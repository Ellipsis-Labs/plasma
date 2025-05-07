use borsh::{BorshDeserialize as Deserialize, BorshSerialize as Serialize};
use bytemuck::try_from_bytes_mut;
use plasma_state::amm::Side;
use solana_program::{
    account_info::AccountInfo, clock::Clock, msg, program::set_return_data,
    program_error::ProgramError, sysvar::Sysvar,
};

use crate::{
    assert_with_msg,
    program::{
        accounts::PoolAccount,
        events::SwapEvent,
        token_utils::{
            maybe_invoke_deposit, maybe_invoke_withdraw, MaybeInvokeDepositParams,
            MaybeInvokeWithdrawParams,
        },
        validation::loaders::{PlasmaPoolContext, PlasmaVaultContext},
    },
    LEADER_SLOT_WINDOW,
};

#[repr(C)]
#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
pub struct SwapParams {
    pub side: Side,
    pub swap_type: SwapType,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
pub enum SwapType {
    ExactIn { amount_in: u64, min_amount_out: u64 },
    ExactOut { amount_out: u64, max_amount_in: u64 },
}

pub(crate) fn process_swap<'a, 'info>(
    pool_context: &PlasmaPoolContext<'a, 'info>,
    accounts: &[AccountInfo<'info>],
    data: &[u8],
) -> Result<SwapEvent, ProgramError> {
    let (base_params, quote_params) = {
        let header = pool_context.pool_info.get_header()?;
        (header.base_params, header.quote_params)
    };
    let PlasmaVaultContext {
        base_account,
        quote_account,
        base_vault,
        quote_vault,
        token_program,
    } = PlasmaVaultContext::load_from_iter(
        &mut accounts.iter(),
        &base_params,
        &quote_params,
        &pool_context.signer.key,
    )?;

    let SwapParams { side, swap_type } = SwapParams::try_from_slice(data)?;
    msg!("{:?} {:?}", side, swap_type);
    // Get the active leader slot
    let slot = Clock::get()?.slot;
    let snapshot_slot = (slot / LEADER_SLOT_WINDOW) * LEADER_SLOT_WINDOW;

    let mut pool_bytes = pool_context.pool_info.try_borrow_mut_data()?;
    let pool = try_from_bytes_mut::<PoolAccount>(&mut *pool_bytes)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    let pre_base_liquidity = pool.base_reserves;
    let pre_quote_liquidity = pool.quote_reserves;
    let pre_protocol_fees = pool.amm.cumulative_quote_protocol_fees;
    let pre_lp_fees = pool.amm.cumulative_quote_lp_fees;

    let (swap_result, deposit_params, withdraw_params) = match side {
        Side::Buy => {
            let result = match swap_type {
                SwapType::ExactIn {
                    amount_in,
                    min_amount_out,
                } => {
                    if amount_in > quote_account.amount()? {
                        msg!("Insufficient quote balance, failing");
                        return Err(ProgramError::InvalidArgument);
                    }
                    let result = pool.buy_exact_in(snapshot_slot, amount_in).map_err(|e| {
                        msg!("Swap failed: {:?}", e);
                        ProgramError::InvalidAccountData
                    })?;
                    if result.base_amount_to_transfer < min_amount_out {
                        msg!("Buy failed: slippage exceeded");
                        return Err(ProgramError::InvalidArgument);
                    }
                    result
                }
                SwapType::ExactOut {
                    amount_out,
                    max_amount_in,
                } => {
                    let result = pool.buy_exact_out(snapshot_slot, amount_out).map_err(|e| {
                        msg!("Swap failed: {:?}", e);
                        ProgramError::InvalidAccountData
                    })?;
                    if result.quote_amount_to_transfer > max_amount_in {
                        msg!("Buy failed: slippage exceeded");
                        return Err(ProgramError::InvalidArgument);
                    }
                    if result.quote_amount_to_transfer + result.fee_in_quote
                        > quote_account.amount()?
                    {
                        msg!("Insufficient quote balance, failing");
                        return Err(ProgramError::InvalidArgument);
                    }
                    result
                }
            };
            let deposit_params = MaybeInvokeDepositParams {
                deposit_amount: result.quote_amount_to_transfer,
                token_program: &token_program,
                deposit_account: quote_account,
                deposit_vault: quote_vault,
                trader: &pool_context.signer,
            };

            let withdraw_params = MaybeInvokeWithdrawParams {
                pool_key: pool_context.pool_info.key,
                mint_key: &base_params.mint_key,
                bump: base_params.vault_bump as u8,
                withdraw_amount: result.base_amount_to_transfer,
                token_program: &token_program,
                withdraw_account: base_account,
                withdraw_vault: base_vault,
            };
            (result, deposit_params, withdraw_params)
        }

        Side::Sell => {
            let result = match swap_type {
                SwapType::ExactIn {
                    amount_in,
                    min_amount_out,
                } => {
                    if amount_in > base_account.amount()? {
                        msg!("Insufficient base balance, failing");
                        return Err(ProgramError::InvalidArgument);
                    }
                    let result = pool.sell_exact_in(snapshot_slot, amount_in).map_err(|e| {
                        msg!("Swap failed: {:?}", e);
                        ProgramError::InvalidAccountData
                    })?;
                    if result.base_amount_to_transfer < min_amount_out {
                        msg!("Sell failed: slippage exceeded");
                        return Err(ProgramError::InvalidArgument);
                    }
                    result
                }
                SwapType::ExactOut {
                    amount_out,
                    max_amount_in,
                } => {
                    let result = pool
                        .sell_exact_out(snapshot_slot, amount_out)
                        .map_err(|e| {
                            msg!("Swap failed: {:?}", e);
                            ProgramError::InvalidAccountData
                        })?;
                    if result.base_amount_to_transfer > max_amount_in {
                        msg!("Sell failed: slippage exceeded");
                        return Err(ProgramError::InvalidArgument);
                    }
                    if result.base_amount_to_transfer > base_account.amount()? {
                        msg!("Insufficient base balance, failing");
                        return Err(ProgramError::InvalidArgument);
                    }
                    result
                }
            };

            let deposit_params = MaybeInvokeDepositParams {
                deposit_amount: result.base_amount_to_transfer,
                token_program: &token_program,
                deposit_account: base_account,
                deposit_vault: base_vault,
                trader: &pool_context.signer,
            };

            let withdraw_params = MaybeInvokeWithdrawParams {
                pool_key: pool_context.pool_info.key,
                mint_key: &quote_params.mint_key,
                bump: quote_params.vault_bump as u8,
                withdraw_amount: result.quote_amount_to_transfer,
                token_program: &token_program,
                withdraw_account: quote_account,
                withdraw_vault: quote_vault,
            };
            (result, deposit_params, withdraw_params)
        }
    };

    let post_base_liquidity = pool.base_reserves;
    let post_quote_liquidity = pool.quote_reserves;

    let deposit_amount = deposit_params.deposit_amount;
    let withdraw_amount = withdraw_params.withdraw_amount;

    // Handle protocol fees accounting
    pool.update_protocol_fee_recipients_post_swap()?;
    assert_with_msg(
        pool.amm.cumulative_quote_protocol_fees >= pre_protocol_fees,
        ProgramError::InvalidArgument,
        "Cumulative protocol fees did not increase after swap",
    )?;
    assert_with_msg(
        pool.amm.cumulative_quote_lp_fees >= pre_lp_fees,
        ProgramError::InvalidArgument,
        "Cumulative LP fees did not increase after swap",
    )?;

    maybe_invoke_deposit(deposit_params)?;
    maybe_invoke_withdraw(withdraw_params)?;

    // Set the return data to the in and out amounts so upstream callers can quickly process the swap results
    set_return_data(&[deposit_amount.to_le_bytes(), withdraw_amount.to_le_bytes()].concat());

    match side {
        Side::Buy => {
            msg!(
                "[Buy] Swapped {} quote for {} base",
                deposit_amount,
                withdraw_amount
            );
        }
        Side::Sell => {
            msg!(
                "[Sell] Swapped {} base for {} quote",
                deposit_amount,
                withdraw_amount
            );
        }
    }

    Ok(SwapEvent {
        swap_sequence_number: pool.increment_swap_sequence_number(),
        pre_base_liquidity,
        pre_quote_liquidity,
        post_base_liquidity,
        post_quote_liquidity,
        snapshot_base_liquidity: pool.base_reserves_snapshot,
        snapshot_quote_liquidity: pool.quote_reserves_snapshot,
        swap_result,
    })
}
