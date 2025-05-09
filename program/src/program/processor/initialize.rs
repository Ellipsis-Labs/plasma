use borsh::{BorshDeserialize as Deserialize, BorshSerialize as Serialize};
use bytemuck::try_from_bytes_mut;
use plasma_amm_state::amm::Amm;
use solana_program::{
    account_info::AccountInfo, clock::Clock, msg, program::invoke, program_error::ProgramError,
    program_pack::Pack, pubkey::Pubkey, rent::Rent, system_program, sysvar::Sysvar,
};

use crate::{
    assert_with_msg,
    program::{
        accounts::{
            PoolAccount, PoolHeader, ProtocolFeeRecipient, ProtocolFeeRecipients, TokenParams,
            POOL_ACCOUNT_DISCRIMINATOR,
        },
        events::InitializePoolEvent,
        system_utils::create_account,
        validation::loaders::{get_vault_address, InitializePoolContext, PlasmaPoolContext},
    },
    LEADER_SLOT_WINDOW,
};

#[derive(Debug, Default, Copy, Clone, Deserialize, Serialize)]
#[repr(C)]
pub struct ProtocolFeeRecipientParams {
    pub recipient: Pubkey,
    pub shares: u64,
}

#[repr(C)]
#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize)]
pub struct InitializePoolParams {
    lp_fee_in_bps: u64,
    protocol_lp_fee_allocation_in_pct: u64,
    fee_recipients_params: [ProtocolFeeRecipientParams; 3],
    /// This is the number of slots that the LP shares will be vested over
    /// If this value is not a multiple of the leader slot window, it will be rounded down
    num_slots_to_vest_lp_shares: Option<u64>,
}

pub(crate) fn process_initialize_pool<'a, 'info>(
    pool_context: &PlasmaPoolContext<'a, 'info>,
    accounts: &'a [AccountInfo<'info>],
    data: &[u8],
) -> Result<InitializePoolEvent, ProgramError> {
    let PlasmaPoolContext {
        pool_info,
        signer: pool_creator,
    } = pool_context;
    let InitializePoolContext {
        base_mint,
        quote_mint,
        base_vault,
        quote_vault,
        system_program,
        token_program,
    } = InitializePoolContext::load(accounts)?;

    let InitializePoolParams {
        lp_fee_in_bps,
        protocol_lp_fee_allocation_in_pct: protocol_fee_allocation_in_pct,
        fee_recipients_params,
        num_slots_to_vest_lp_shares: vesting_slot_window,
    } = InitializePoolParams::try_from_slice(data)?;

    assert_with_msg(
        lp_fee_in_bps < 500,
        ProgramError::InvalidArgument,
        "LP fee is capped at 5%",
    )?;

    assert_with_msg(
        protocol_fee_allocation_in_pct <= 100,
        ProgramError::InvalidArgument,
        "The protocol fee allocation must be less than or equal to 100%",
    )?;

    assert_with_msg(
        fee_recipients_params
            .iter()
            .map(|params| params.shares as u128)
            .sum::<u128>()
            < 10000,
        ProgramError::InvalidArgument,
        "The total shares must sum to less than 10000",
    )?;

    // Create the base and quote vaults of this pool
    let rent = Rent::get()?;
    let mut bumps = vec![];
    for (token_account, mint) in [
        (base_vault.as_ref(), base_mint.as_ref()),
        (quote_vault.as_ref(), quote_mint.as_ref()),
    ] {
        let (vault_key, bump) = get_vault_address(pool_info.key, mint.key);
        assert_with_msg(
            vault_key == *token_account.key,
            ProgramError::InvalidSeeds,
            &format!(
                "Supplied vault ({}) does not match computed key ({})",
                token_account.key, vault_key
            ),
        )?;
        let space = spl_token::state::Account::LEN;
        let seeds = vec![
            b"vault".to_vec(),
            pool_info.key.as_ref().to_vec(),
            mint.key.as_ref().to_vec(),
            vec![bump],
        ];
        create_account(
            pool_creator.as_ref(),
            token_account,
            system_program.as_ref(),
            &spl_token::id(),
            &rent,
            space as u64,
            seeds,
        )?;
        invoke(
            &spl_token::instruction::initialize_account3(
                &spl_token::id(),
                token_account.key,
                mint.key,
                token_account.key,
            )?,
            &[
                pool_creator.as_ref().clone(),
                token_account.clone(),
                mint.clone(),
                token_program.as_ref().clone(),
            ],
        )?;
        bumps.push(bump);
    }

    let mut pool_bytes = pool_context.pool_info.try_borrow_mut_data()?;
    let pool = try_from_bytes_mut::<PoolAccount>(&mut *pool_bytes)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if pool.header.sequence_number != 0 {
        msg!("Pool account already initialized");
        return Err(ProgramError::InvalidAccountData);
    }
    let fee_recipients = {
        let fee_recipients = fee_recipients_params.map(|params| ProtocolFeeRecipient {
            recipient: params.recipient,
            shares: params.shares,
            total_accumulated_quote_fees: 0,
            collected_quote_fees: 0,
        });

        let mut fee_recipient_keys = vec![];
        for recipient in fee_recipients.iter() {
            if recipient.recipient != system_program::ID {
                if fee_recipient_keys.contains(&recipient.recipient) {
                    msg!("Duplicate protocol fee recipient: {}", recipient.recipient);
                    return Err(ProgramError::InvalidArgument);
                }
                fee_recipient_keys.push(recipient.recipient);
            } else {
                assert_with_msg(
                    recipient.shares == 0,
                    ProgramError::InvalidArgument,
                    "Invalid protocol fee recipient configuration. Null recipient cannot have shares",
                )?;
            }
        }

        ProtocolFeeRecipients::new(fee_recipients)
    };

    // Populate the header data
    pool.header = PoolHeader {
        discriminator: POOL_ACCOUNT_DISCRIMINATOR,
        sequence_number: 0,
        base_params: TokenParams {
            vault_bump: bumps[0] as u32,
            decimals: base_mint.decimals as u32,
            mint_key: *base_mint.as_ref().key,
            vault_key: *base_vault.key,
        },
        quote_params: TokenParams {
            vault_bump: bumps[1] as u32,
            decimals: quote_mint.decimals as u32,
            mint_key: *quote_mint.as_ref().key,
            vault_key: *quote_vault.key,
        },
        fee_recipients,
        swap_sequence_number: 0,
        padding: [0; 12],
    };

    let slot = (Clock::get()?.slot / LEADER_SLOT_WINDOW) * LEADER_SLOT_WINDOW;
    pool.amm = Amm::new(
        lp_fee_in_bps as u32,
        protocol_fee_allocation_in_pct as u32,
        vesting_slot_window
            .map(|v| (v / LEADER_SLOT_WINDOW) * LEADER_SLOT_WINDOW)
            .unwrap_or(2 * LEADER_SLOT_WINDOW),
        slot,
    );

    Ok(InitializePoolEvent {
        lp_fee_in_bps,
        protocol_fee_in_pct: protocol_fee_allocation_in_pct,
        fee_recipient_params: fee_recipients_params,
    })
}
