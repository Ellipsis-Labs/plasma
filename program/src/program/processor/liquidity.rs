use std::mem::size_of;

use borsh::{BorshDeserialize as Deserialize, BorshSerialize as Serialize};
use bytemuck::{try_from_bytes, try_from_bytes_mut};
use plasma_state::lp::{AddLiquidityResult, LpPosition, RemoveLiquidityResult};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    msg,
    program_error::ProgramError,
    rent::Rent,
    sysvar::Sysvar,
};

use crate::{
    assert_with_msg,
    program::{
        accounts::{
            LpPositionAccount, LpPositionStatus, PoolAccount, LP_POSITION_ACCOUNT_DISCRIMINATOR,
        },
        events::{
            AddLiquidityEvent, InitializeLpPositionEvent, RemoveLiquidityEvent,
            RenounceLiquidityEvent, TransferLiquidityEvent,
        },
        system_utils::create_account,
        token_utils::{try_deposit, try_withdraw, TryDepositParams, TryWithdrawParams},
        validation::{
            checkers::plasma_checkers::LpPositionAccountInfo,
            loaders::{
                get_lp_position_address, InitializeLpPositionContext, LiquidityActionContext,
                PlasmaPoolContext, PlasmaVaultContext,
            },
        },
    },
    LEADER_SLOT_WINDOW,
};

pub(crate) fn process_initialize_lp_position<'a, 'info>(
    pool_context: &PlasmaPoolContext<'a, 'info>,
    accounts: &[AccountInfo<'info>],
) -> Result<InitializeLpPositionEvent, ProgramError> {
    let pool_key = pool_context.pool_info.key;

    let InitializeLpPositionContext {
        lp_position_owner,
        lp_position,
        system_program,
    } = InitializeLpPositionContext::load(accounts)?;

    let (lp_position_address, bump) = get_lp_position_address(pool_key, lp_position_owner.key);

    assert_with_msg(
        &lp_position_address == lp_position.key,
        ProgramError::InvalidAccountData,
        "Invalid lp_position address",
    )?;
    assert_with_msg(
        lp_position.data_is_empty(),
        ProgramError::InvalidAccountData,
        "LpPosition account is already initialized",
    )?;

    let space = size_of::<LpPositionAccount>();
    let seeds = vec![
        b"lp_position".to_vec(),
        pool_key.as_ref().to_vec(),
        lp_position_owner.key.as_ref().to_vec(),
        vec![bump],
    ];

    create_account(
        &pool_context.signer,
        lp_position.as_ref(),
        system_program.as_ref(),
        &crate::id(),
        &Rent::get()?,
        space as u64,
        seeds,
    )?;

    let pool_bytes = pool_context.pool_info.try_borrow_data()?;
    let pool = try_from_bytes::<PoolAccount>(&pool_bytes).map_err(|_| {
        msg!("Invalid pool account data");
        ProgramError::InvalidAccountData
    })?;

    let mut lp_position_bytes = lp_position.try_borrow_mut_data()?;
    *try_from_bytes_mut::<LpPositionAccount>(&mut lp_position_bytes)
        .map_err(|_| ProgramError::InvalidAccountData)? = LpPositionAccount {
        discriminator: LP_POSITION_ACCOUNT_DISCRIMINATOR,
        authority: *lp_position_owner.key,
        pool: *pool_key,
        status: LpPositionStatus::Active as u64,
        lp_position: LpPosition::new_with_reward_factor_snapshot(pool.reward_factor),
    };

    Ok(InitializeLpPositionEvent {
        owner: *lp_position_owner.key,
    })
}

#[repr(C)]
#[derive(Clone, Copy, Debug, Default, Serialize, Deserialize)]
pub struct AddLiquidityParams {
    pub desired_base_amount_in: u64,
    pub desired_quote_amount_in: u64,
    pub initial_lp_shares: Option<u64>,
}

pub(crate) fn process_add_liquidity<'a, 'info>(
    pool_context: &PlasmaPoolContext<'a, 'info>,
    accounts: &[AccountInfo<'info>],
    data: &[u8],
) -> Result<AddLiquidityEvent, ProgramError> {
    let LiquidityActionContext {
        lp_position: lp_position_account,
        vault_context,
    } = LiquidityActionContext::load(&pool_context, accounts)?;

    let PlasmaVaultContext {
        base_account,
        quote_account,
        base_vault,
        quote_vault,
        token_program,
    } = vault_context;

    let AddLiquidityParams {
        desired_base_amount_in,
        desired_quote_amount_in,
        initial_lp_shares,
    } = AddLiquidityParams::try_from_slice(data)?;

    // Get the active leader slot
    let slot = (Clock::get()?.slot / LEADER_SLOT_WINDOW) * LEADER_SLOT_WINDOW;

    let mut pool_bytes = pool_context.pool_info.try_borrow_mut_data()?;
    let pool = try_from_bytes_mut::<PoolAccount>(&mut *pool_bytes)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if pool.total_lp_shares == 0 {
        assert_with_msg(
            initial_lp_shares.is_some(),
            ProgramError::InvalidArgument,
            "Initial LP shares must be provided for the first liquidity deposit",
        )?;
    } else {
        assert_with_msg(
            initial_lp_shares.is_none(),
            ProgramError::InvalidArgument,
            "Initial LP shares must be None for subsequent liquidity deposits",
        )?;
    }

    let mut lp_position_bytes = lp_position_account.info.try_borrow_mut_data()?;
    let lp_position = try_from_bytes_mut::<LpPositionAccount>(&mut *lp_position_bytes)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // One consequence of renouncing a liquidity position is that the associated trader pubkey can no longer add or remove liquidity
    // for this pool ever again.
    if matches!(
        LpPositionStatus::parse(lp_position.status)?,
        LpPositionStatus::RenouncedWithBurnedFees | LpPositionStatus::RenouncedWithFeeWithdawal
    ) {
        msg!("Liquidity position has been renounced, cannot remove liquidity");
        return Err(ProgramError::InvalidArgument);
    }

    let AddLiquidityResult {
        base_amount_deposited,
        quote_amount_deposited,
        lp_shares_received: lp_shares,
        lp_shares_vested,
        ..
    } = lp_position
        .add_liquidity(
            slot,
            pool,
            desired_base_amount_in,
            desired_quote_amount_in,
            initial_lp_shares,
        )
        .map_err(|e| {
            msg!("Error adding liquidity: {:?}", e);
            ProgramError::InvalidArgument
        })?;

    let (user_total_withdrawable_base, user_total_withdrawable_quote) =
        lp_position.get_withdrawable_base_and_quote_amounts(pool);

    try_deposit(TryDepositParams {
        token_program: &token_program,
        quote_account,
        quote_vault,
        base_account,
        base_vault,
        quote_amount: quote_amount_deposited,
        base_amount: base_amount_deposited,
        trader: &pool_context.signer,
    })?;

    Ok(AddLiquidityEvent {
        pool_total_lp_shares: pool.total_lp_shares,
        pool_total_base_liquidity: pool.base_reserves,
        pool_total_quote_liquitidy: pool.quote_reserves,
        snapshot_base_liquidity: pool.base_reserves_snapshot,
        snapshot_quote_liquidity: pool.quote_reserves_snapshot,
        user_lp_shares_received: lp_shares,
        user_lp_shares_available: lp_position.lp_shares,
        user_lp_shares_locked: lp_position.lp_shares - lp_position.withdrawable_lp_shares,
        user_lp_shares_unlocked_for_withdrawal: lp_shares_vested,
        user_base_deposited: base_amount_deposited,
        user_quote_deposited: quote_amount_deposited,
        user_total_withdrawable_base,
        user_total_withdrawable_quote,
    })
}

pub(crate) fn process_remove_liqidity<'a, 'info>(
    pool_context: &PlasmaPoolContext<'a, 'info>,
    accounts: &[AccountInfo<'info>],
    data: &[u8],
) -> Result<RemoveLiquidityEvent, ProgramError> {
    let (base_params, quote_params) = {
        let header = pool_context.pool_info.get_header()?;
        (header.base_params, header.quote_params)
    };

    let LiquidityActionContext {
        lp_position: lp_position_account,
        vault_context,
    } = LiquidityActionContext::load(&pool_context, accounts)?;

    let PlasmaVaultContext {
        base_account,
        quote_account,
        base_vault,
        quote_vault,
        token_program,
    } = vault_context;

    let lp_shares = u64::try_from_slice(data)?;

    // Get the active leader slot
    let slot = (Clock::get()?.slot / LEADER_SLOT_WINDOW) * LEADER_SLOT_WINDOW;

    let mut pool_bytes = pool_context.pool_info.try_borrow_mut_data()?;
    let pool = try_from_bytes_mut::<PoolAccount>(&mut *pool_bytes)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    let mut lp_position_bytes = lp_position_account.info.try_borrow_mut_data()?;
    let lp_position = try_from_bytes_mut::<LpPositionAccount>(&mut *lp_position_bytes)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if matches!(
        LpPositionStatus::parse(lp_position.status)?,
        LpPositionStatus::RenouncedWithBurnedFees | LpPositionStatus::RenouncedWithFeeWithdawal
    ) {
        msg!("Liquidity position has been renounced, cannot remove liquidity");
        return Err(ProgramError::InvalidArgument);
    }

    let RemoveLiquidityResult {
        base_amount_withdrawn,
        quote_amount_withdrawn,
        lp_shares_burned,
        lp_shares_vested,
        ..
    } = lp_position
        .remove_liquidity(slot, pool, lp_shares)
        .map_err(|e| {
            msg!("Error removing liquidity: {:?}", e);
            ProgramError::InvalidArgument
        })?;

    let (user_total_withdrawable_base, user_total_withdrawable_quote) =
        lp_position.get_withdrawable_base_and_quote_amounts(pool);

    try_withdraw(TryWithdrawParams {
        pool_key: &pool_context.pool_info.key,
        base_params: &base_params,
        quote_params: &quote_params,
        token_program: &token_program,
        quote_account,
        quote_vault,
        base_account,
        base_vault,
        quote_amount: quote_amount_withdrawn,
        base_amount: base_amount_withdrawn,
    })?;

    Ok(RemoveLiquidityEvent {
        pool_total_lp_shares: pool.total_lp_shares,
        pool_total_base_liquidity: pool.base_reserves,
        pool_total_quote_liquitidy: pool.quote_reserves,
        snapshot_base_liquidity: pool.base_reserves_snapshot,
        snapshot_quote_liquidity: pool.quote_reserves_snapshot,
        user_lp_shares_burned: lp_shares_burned,
        user_lp_shares_available: lp_position.lp_shares,
        user_lp_shares_locked: lp_position.lp_shares - lp_position.withdrawable_lp_shares,
        user_lp_shares_unlocked_for_withdrawal: lp_shares_vested,
        user_base_withdrawn: base_amount_withdrawn,
        user_quote_withdrawn: quote_amount_withdrawn,
        user_total_withdrawable_base,
        user_total_withdrawable_quote,
    })
}

pub(crate) fn process_renounce_liqidity<'a, 'info>(
    pool_context: &PlasmaPoolContext<'a, 'info>,
    accounts: &[AccountInfo<'info>],
    data: &[u8],
) -> Result<RenounceLiquidityEvent, ProgramError> {
    let account_iter = &mut accounts.iter();
    let lp_position_account = LpPositionAccountInfo::new(
        next_account_info(account_iter)?,
        pool_context.pool_info.key,
        pool_context.signer.key,
    )?;

    let mut lp_position_bytes = lp_position_account.info.try_borrow_mut_data()?;
    let lp_position = try_from_bytes_mut::<LpPositionAccount>(&mut *lp_position_bytes)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if matches!(
        LpPositionStatus::parse(lp_position.status)?,
        LpPositionStatus::RenouncedWithBurnedFees | LpPositionStatus::RenouncedWithFeeWithdawal
    ) {
        msg!("Liquidity position has been renounced, cannot renounce again");
        return Err(ProgramError::InvalidArgument);
    }

    let allow_fee_withdrawal = bool::try_from_slice(data)?;

    lp_position.status = if allow_fee_withdrawal {
        LpPositionStatus::RenouncedWithFeeWithdawal as u64
    } else {
        LpPositionStatus::RenouncedWithBurnedFees as u64
    };

    Ok(RenounceLiquidityEvent {
        allow_fee_withdrawal,
    })
}

pub(crate) fn process_transfer_liquidity<'a, 'info>(
    pool_context: &PlasmaPoolContext<'a, 'info>,
    accounts: &[AccountInfo<'info>],
) -> Result<TransferLiquidityEvent, ProgramError> {
    let account_iter = &mut accounts.iter();
    let src_lp_position_account = LpPositionAccountInfo::new(
        next_account_info(account_iter)?,
        pool_context.pool_info.key,
        pool_context.signer.key,
    )?;

    let dst_lp_position_account = LpPositionAccountInfo::new_from_pool(
        next_account_info(account_iter)?,
        pool_context.pool_info.key,
    )?;

    assert_with_msg(
        src_lp_position_account.info.key != dst_lp_position_account.info.key,
        ProgramError::InvalidArgument,
        "Source and destination liquidity positions must be different",
    )?;

    let mut src_lp_position_bytes = src_lp_position_account.info.try_borrow_mut_data()?;
    let src_lp_position = try_from_bytes_mut::<LpPositionAccount>(&mut *src_lp_position_bytes)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if matches!(
        LpPositionStatus::parse(src_lp_position.status)?,
        LpPositionStatus::RenouncedWithBurnedFees | LpPositionStatus::RenouncedWithFeeWithdawal
    ) {
        msg!("Source liquidity position has been renounced, cannot transfer");
        return Err(ProgramError::InvalidArgument);
    }

    let mut dst_lp_position_bytes = dst_lp_position_account.info.try_borrow_mut_data()?;
    let dst_lp_position = try_from_bytes_mut::<LpPositionAccount>(&mut *dst_lp_position_bytes)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if matches!(
        LpPositionStatus::parse(dst_lp_position.status)?,
        LpPositionStatus::RenouncedWithBurnedFees | LpPositionStatus::RenouncedWithFeeWithdawal
    ) {
        msg!("Destination liquidity position has been renounced, cannot transfer");
        return Err(ProgramError::InvalidArgument);
    }

    // Get the active leader slot
    let slot = (Clock::get()?.slot / LEADER_SLOT_WINDOW) * LEADER_SLOT_WINDOW;

    let pool_bytes = pool_context.pool_info.try_borrow_data()?;
    let pool = try_from_bytes::<PoolAccount>(&pool_bytes).map_err(|_| {
        msg!("Failed to deserialize pool account");
        ProgramError::InvalidAccountData
    })?;

    let lp_shares_transferred = src_lp_position
        .transfer_liquidity(slot, pool, dst_lp_position)
        .map_err(|e| {
            msg!("Error transferring liquidity: {:?}", e);
            ProgramError::InvalidArgument
        })?;

    Ok(TransferLiquidityEvent {
        src: src_lp_position.authority,
        dst: dst_lp_position.authority,
        lp_shares_transferred,
    })
}
