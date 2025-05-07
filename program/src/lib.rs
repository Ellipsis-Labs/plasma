pub mod program;

#[cfg(feature = "autogen-client-structs")]
mod autogen_client_structs;

use crate::program::instruction::PlasmaInstruction;
use crate::program::validation::loaders::PlasmaLogContext;
pub use program::processor::*;
use program::validation::loaders::PlasmaPoolContext;
use solana_program::{
    self,
    account_info::{next_account_info, AccountInfo},
    declare_id,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

pub const LEADER_SLOT_WINDOW: u64 = 4;

declare_id!("srAMMzfVHVAtgSJc8iH6CfKzuWuUTzLHVCE81QU1rgi");

/// This is a static PDA with seeds: [b"log"]
/// If the program id changes, this will also need to be updated
pub mod plasma_log_authority {
    // You need to import Pubkey prior to using the declare_pda macro
    use ellipsis_macros::declare_pda;
    use solana_program::pubkey::Pubkey;

    // This creates a static PDA with seeds: [b"log"]
    // The address of the PDA is 37zgQb6PjFuxah6R8CTk67gEvLrpqPQ61E7vh9ARPGFD
    // The bump seed is stored in a variable called bump()
    declare_pda!(
        "37zgQb6PjFuxah6R8CTk67gEvLrpqPQ61E7vh9ARPGFD",
        "srAMMzfVHVAtgSJc8iH6CfKzuWuUTzLHVCE81QU1rgi",
        "log"
    );

    #[test]
    fn check_pda() {
        use crate::plasma_log_authority;
        use solana_program::pubkey::Pubkey;
        assert_eq!(
            plasma_log_authority::ID,
            Pubkey::create_program_address(
                &["log".as_ref(), &[plasma_log_authority::bump()]],
                &super::id()
            )
            .unwrap()
        );
    }
}

#[track_caller]
#[inline(always)]
pub fn assert_with_msg(v: bool, err: impl Into<ProgramError>, msg: &str) -> ProgramResult {
    if v {
        Ok(())
    } else {
        let caller = std::panic::Location::caller();
        msg!("{}. \n{}", msg, caller);
        Err(err.into())
    }
}

macro_rules! record_event {
    ($plasma_log_context:ident, $pool_context:ident, $event:ident) => {
        $plasma_log_context.record_event(($pool_context.get_event_header()?, $event).into())
    };
}

#[cfg(not(feature = "no-entrypoint"))]
solana_program::entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    assert_with_msg(
        *program_id == crate::id(),
        ProgramError::IncorrectProgramId,
        "Incorrect program ID",
    )?;

    let (tag, data) = data
        .split_first()
        .ok_or(ProgramError::InvalidInstructionData)?;

    let instruction =
        PlasmaInstruction::try_from(*tag).or(Err(ProgramError::InvalidInstructionData))?;

    // This is a special instruction that is only used for recording
    // inner instruction data from recursive CPI calls.
    //
    // Pool events can be searched by querying the transaction hash and parsing
    // the inner instruction data according to a pre-defined schema.
    //
    // Only the log authority is allowed to call this instruction.
    if let PlasmaInstruction::Log = instruction {
        let authority = next_account_info(&mut accounts.iter())?;
        assert_with_msg(
            authority.is_signer,
            ProgramError::MissingRequiredSignature,
            "Log authority must sign through CPI",
        )?;
        assert_with_msg(
            authority.key == &plasma_log_authority::id(),
            ProgramError::InvalidArgument,
            "Invalid log authority",
        )?;
        return Ok(());
    }

    let (program_accounts, accounts) = accounts.split_at(4);
    let accounts_iter = &mut program_accounts.iter();
    let plasma_log_context = PlasmaLogContext::load(accounts_iter)?;
    let pool_context = if instruction == PlasmaInstruction::InitializePool {
        PlasmaPoolContext::load_init(accounts_iter)?
    } else {
        PlasmaPoolContext::load(accounts_iter)?
    };

    match instruction {
        PlasmaInstruction::InitializePool => {
            msg!("InitializePool");
            initialize::process_initialize_pool(&pool_context, accounts, data)
                .and_then(|event| record_event!(plasma_log_context, pool_context, event))?
        }
        PlasmaInstruction::InitializeLpPosition => {
            msg!("InitializeLpPosition");
            liquidity::process_initialize_lp_position(&pool_context, accounts)
                .and_then(|event| record_event!(plasma_log_context, pool_context, event))?
        }
        PlasmaInstruction::Swap => {
            msg!("Swap");
            swap::process_swap(&pool_context, accounts, data)
                .and_then(|event| record_event!(plasma_log_context, pool_context, event))?
        }
        PlasmaInstruction::AddLiquidity => {
            msg!("AddLiquidity");
            liquidity::process_add_liquidity(&pool_context, accounts, data)
                .and_then(|event| record_event!(plasma_log_context, pool_context, event))?
        }
        PlasmaInstruction::RemoveLiquidity => {
            msg!("RemoveLiquidity");
            liquidity::process_remove_liqidity(&pool_context, accounts, data)
                .and_then(|event| record_event!(plasma_log_context, pool_context, event))?
        }
        PlasmaInstruction::RenounceLiquidity => {
            msg!("RenounceLiquidity");
            liquidity::process_renounce_liqidity(&pool_context, accounts, data)
                .and_then(|event| record_event!(plasma_log_context, pool_context, event))?
        }
        PlasmaInstruction::WithdrawLpFees => {
            msg!("WithdrawLpFees");
            fees::process_withdraw_lp_fees(&pool_context, accounts)
                .and_then(|event| record_event!(plasma_log_context, pool_context, event))?
        }
        PlasmaInstruction::WithdrawProtocolFees => {
            msg!("WithdrawProtocolFees");
            fees::process_withdraw_protocol_fees(&pool_context, accounts)
                .and_then(|event| record_event!(plasma_log_context, pool_context, event))?
        }
        PlasmaInstruction::TransferLiquidity => {
            msg!("TransferLiquidity");
            liquidity::process_transfer_liquidity(&pool_context, accounts)
                .and_then(|event| record_event!(plasma_log_context, pool_context, event))?
        }
        PlasmaInstruction::Log => {
            // The log instruction is handled at the beginning of this function
            unreachable!()
        }
    }
    Ok(())
}
