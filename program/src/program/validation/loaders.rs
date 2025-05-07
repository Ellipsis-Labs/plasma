//! This file contains all of the code that is used to load and validate account
//! and instruction data.
//!
//! Each loader describes specific account types and constraints that must be met for
//! the instruction data to be valid. Each AccountInfo is checked according to a particular
//! checker struct and if the account data is invalid, an error is returned and the instruction will fail.
//!
//! The loader structs are used to validate the accounts passed into the program based on the
//! current instruction.

use super::checkers::plasma_checkers::LpPositionAccountInfo;
use super::checkers::{plasma_checkers::PoolAccountInfo, MintAccountInfo, TokenAccountInfo, PDA};
use crate::assert_with_msg;
use crate::program::accounts::{PoolAccount, TokenParams};
use crate::program::events::{PlasmaEvent, PlasmaEventHeader};
use crate::program::instruction::PlasmaInstruction;
use crate::{
    plasma_log_authority,
    program::validation::checkers::{EmptyAccount, Program, Signer},
};
use borsh::BorshSerialize;
use bytemuck::try_from_bytes_mut;
use core::slice::Iter;
use solana_program::clock::Clock;
use solana_program::instruction::{AccountMeta, Instruction};
use solana_program::log::sol_log_data;
use solana_program::program::invoke_signed;
use solana_program::sysvar::Sysvar;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    program_error::ProgramError,
    pubkey::Pubkey,
    system_program,
};

pub fn get_vault_address(pool: &Pubkey, mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"vault", pool.as_ref(), mint.as_ref()], &crate::ID)
}

pub fn get_lp_position_address(pool: &Pubkey, trader: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"lp_position", pool.as_ref(), trader.as_ref()],
        &crate::ID,
    )
}

pub(crate) struct PlasmaLogContext<'a, 'info> {
    pub(crate) plasma_program: Program<'a, 'info>,
    pub(crate) log_authority: PDA<'a, 'info>,
}

impl<'a, 'info> PlasmaLogContext<'a, 'info> {
    pub(crate) fn load(
        account_iter: &mut Iter<'a, AccountInfo<'info>>,
    ) -> Result<Self, ProgramError> {
        Ok(Self {
            plasma_program: Program::new(next_account_info(account_iter)?, &crate::id())?,
            log_authority: PDA::new(
                next_account_info(account_iter)?,
                &plasma_log_authority::id(),
            )?,
        })
    }
}

impl<'a, 'info> PlasmaLogContext<'a, 'info> {
    pub(crate) fn record_event(&self, plasma_event: PlasmaEvent) -> Result<(), ProgramError> {
        let event_vec = plasma_event.try_to_vec()?;
        sol_log_data(&[&event_vec]);

        let log_instruction = Instruction {
            program_id: crate::id(),
            accounts: vec![AccountMeta::new_readonly(plasma_log_authority::id(), true)],
            data: [
                PlasmaInstruction::Log.to_vec().as_slice(),
                event_vec.as_slice(),
            ]
            .concat(),
        };
        invoke_signed(
            &log_instruction,
            &[
                self.plasma_program.as_ref().clone(),
                self.log_authority.as_ref().clone(),
            ],
            &[&[b"log", &[plasma_log_authority::bump()]]],
        )
    }
}

pub(crate) struct PlasmaPoolContext<'a, 'info> {
    pub(crate) pool_info: PoolAccountInfo<'a, 'info>,
    pub(crate) signer: Signer<'a, 'info>,
}

impl<'a, 'info> PlasmaPoolContext<'a, 'info> {
    pub(crate) fn load(
        account_iter: &mut Iter<'a, AccountInfo<'info>>,
    ) -> Result<Self, ProgramError> {
        Ok(Self {
            pool_info: PoolAccountInfo::new(next_account_info(account_iter)?)?,
            signer: Signer::new(next_account_info(account_iter)?)?,
        })
    }

    pub(crate) fn load_init(
        account_iter: &mut Iter<'a, AccountInfo<'info>>,
    ) -> Result<Self, ProgramError> {
        Ok(Self {
            pool_info: PoolAccountInfo::new_init(next_account_info(account_iter)?)?,
            signer: Signer::new(next_account_info(account_iter)?)?,
        })
    }

    pub(crate) fn get_event_header(&self) -> Result<PlasmaEventHeader, ProgramError> {
        let clock = Clock::get()?;
        let (sequence_number, base_decimals, quote_decimals) = {
            let mut pool_bytes = self.pool_info.try_borrow_mut_data()?;
            let pool = try_from_bytes_mut::<PoolAccount>(&mut pool_bytes)
                .map_err(|_| ProgramError::InvalidAccountData)?;
            let sequence_number = pool.header.sequence_number;
            pool.increment_sequence_number();
            (
                sequence_number,
                pool.header.base_params.decimals as u8,
                pool.header.quote_params.decimals as u8,
            )
        };
        let plasma_event = PlasmaEventHeader {
            sequence_number,
            slot: clock.slot,
            timestamp: clock.unix_timestamp,
            signer: *self.signer.key,
            pool: *self.pool_info.key,
            base_decimals,
            quote_decimals,
        };
        Ok(plasma_event)
    }
}

/// These accounts that are required for all pool actions that interact with a token vault
pub(crate) struct PlasmaVaultContext<'a, 'info> {
    pub(crate) base_account: TokenAccountInfo<'a, 'info>,
    pub(crate) quote_account: TokenAccountInfo<'a, 'info>,
    pub(crate) base_vault: TokenAccountInfo<'a, 'info>,
    pub(crate) quote_vault: TokenAccountInfo<'a, 'info>,
    pub(crate) token_program: Program<'a, 'info>,
}

impl<'a, 'info> PlasmaVaultContext<'a, 'info> {
    pub(crate) fn load_from_iter(
        account_iter: &mut Iter<'a, AccountInfo<'info>>,
        base_params: &TokenParams,
        quote_params: &TokenParams,
        trader_key: &Pubkey,
    ) -> Result<Self, ProgramError> {
        Ok(Self {
            base_account: TokenAccountInfo::new_with_owner(
                next_account_info(account_iter)?,
                &base_params.mint_key,
                trader_key,
            )?,
            quote_account: TokenAccountInfo::new_with_owner(
                next_account_info(account_iter)?,
                &quote_params.mint_key,
                trader_key,
            )?,
            base_vault: TokenAccountInfo::new_with_owner_and_key(
                next_account_info(account_iter)?,
                &base_params.mint_key,
                &base_params.vault_key,
                &base_params.vault_key,
            )?,
            quote_vault: TokenAccountInfo::new_with_owner_and_key(
                next_account_info(account_iter)?,
                &quote_params.mint_key,
                &quote_params.vault_key,
                &quote_params.vault_key,
            )?,
            token_program: Program::new(next_account_info(account_iter)?, &spl_token::id())?,
        })
    }
}

pub(crate) struct InitializePoolContext<'a, 'info> {
    pub(crate) base_mint: MintAccountInfo<'a, 'info>,
    pub(crate) quote_mint: MintAccountInfo<'a, 'info>,
    pub(crate) base_vault: EmptyAccount<'a, 'info>,
    pub(crate) quote_vault: EmptyAccount<'a, 'info>,
    pub(crate) system_program: Program<'a, 'info>,
    pub(crate) token_program: Program<'a, 'info>,
}

impl<'a, 'info> InitializePoolContext<'a, 'info> {
    pub(crate) fn load(accounts: &'a [AccountInfo<'info>]) -> Result<Self, ProgramError> {
        let account_iter = &mut accounts.iter();
        let ctx = Self {
            base_mint: MintAccountInfo::new(next_account_info(account_iter)?)?,
            quote_mint: MintAccountInfo::new(next_account_info(account_iter)?)?,
            base_vault: EmptyAccount::new(next_account_info(account_iter)?)?,
            quote_vault: EmptyAccount::new(next_account_info(account_iter)?)?,
            system_program: Program::new(next_account_info(account_iter)?, &system_program::id())?,
            token_program: Program::new(next_account_info(account_iter)?, &spl_token::id())?,
        };

        assert_with_msg(
            ctx.base_mint.info.key != ctx.quote_mint.info.key,
            ProgramError::InvalidArgument,
            "Base mint and quote mint must be different",
        )?;
        Ok(ctx)
    }
}

pub(crate) struct LiquidityActionContext<'a, 'info> {
    // This is only used for limit order instructions
    pub(crate) lp_position: LpPositionAccountInfo<'a, 'info>,
    pub(crate) vault_context: PlasmaVaultContext<'a, 'info>,
}

impl<'a, 'info> LiquidityActionContext<'a, 'info> {
    pub(crate) fn load(
        pool_context: &PlasmaPoolContext<'a, 'info>,
        accounts: &'a [AccountInfo<'info>],
    ) -> Result<Self, ProgramError> {
        let PlasmaPoolContext {
            pool_info,
            signer: trader,
        } = pool_context;
        // pool_info.assert_post_allowed()?;
        let account_iter = &mut accounts.iter();
        let lp_position = LpPositionAccountInfo::new(
            next_account_info(account_iter)?,
            pool_info.key,
            trader.key,
        )?;
        let (base_params, quote_params) = {
            let header = pool_info.get_header()?;
            (header.base_params, header.quote_params)
        };
        let vault_context = PlasmaVaultContext::load_from_iter(
            account_iter,
            &base_params,
            &quote_params,
            trader.key,
        )?;

        Ok(Self {
            lp_position,
            vault_context,
        })
    }
}

pub(crate) struct InitializeLpPositionContext<'a, 'info> {
    pub(crate) lp_position_owner: &'a AccountInfo<'info>,
    pub(crate) lp_position: EmptyAccount<'a, 'info>,
    pub(crate) system_program: Program<'a, 'info>,
}

impl<'a, 'info> InitializeLpPositionContext<'a, 'info> {
    pub(crate) fn load(accounts: &'a [AccountInfo<'info>]) -> Result<Self, ProgramError> {
        let account_iter = &mut accounts.iter();
        let ctx = Self {
            lp_position_owner: next_account_info(account_iter)?,
            lp_position: EmptyAccount::new(next_account_info(account_iter)?)?,
            system_program: Program::new(next_account_info(account_iter)?, &system_program::id())?,
        };
        Ok(ctx)
    }
}

pub(crate) struct WithdrawLpFeesContext<'a, 'info> {
    // This is only used for limit order instructions
    pub(crate) lp_position: LpPositionAccountInfo<'a, 'info>,
    pub(crate) quote_account: TokenAccountInfo<'a, 'info>,
    pub(crate) quote_vault: TokenAccountInfo<'a, 'info>,
    pub(crate) token_program: Program<'a, 'info>,
}

impl<'a, 'info> WithdrawLpFeesContext<'a, 'info> {
    pub(crate) fn load(
        pool_context: &PlasmaPoolContext<'a, 'info>,
        accounts: &'a [AccountInfo<'info>],
    ) -> Result<Self, ProgramError> {
        let PlasmaPoolContext { pool_info, .. } = pool_context;
        let account_iter = &mut accounts.iter();

        // This account is loaded but only ever used for validation
        let lp_position_owner = next_account_info(account_iter)?;

        let lp_position = LpPositionAccountInfo::new(
            next_account_info(account_iter)?,
            pool_info.key,
            lp_position_owner.key,
        )?;
        let quote_params = {
            let header = pool_info.get_header()?;
            header.quote_params
        };
        let quote_account = TokenAccountInfo::new_with_owner(
            next_account_info(account_iter)?,
            &quote_params.mint_key,
            &lp_position_owner.key,
        )?;
        let quote_vault = TokenAccountInfo::new_with_owner_and_key(
            next_account_info(account_iter)?,
            &quote_params.mint_key,
            &quote_params.vault_key,
            &quote_params.vault_key,
        )?;
        let token_program = Program::new(next_account_info(account_iter)?, &spl_token::id())?;
        Ok(Self {
            lp_position,
            quote_account,
            quote_vault,
            token_program,
        })
    }
}

pub(crate) struct WithdrawProtocolFeesContext<'a, 'info> {
    pub(crate) quote_account: TokenAccountInfo<'a, 'info>,
    pub(crate) quote_vault: TokenAccountInfo<'a, 'info>,
    pub(crate) token_program: Program<'a, 'info>,
}

impl<'a, 'info> WithdrawProtocolFeesContext<'a, 'info> {
    pub(crate) fn load(
        pool_context: &PlasmaPoolContext<'a, 'info>,
        accounts: &'a [AccountInfo<'info>],
    ) -> Result<Self, ProgramError> {
        let PlasmaPoolContext { pool_info, .. } = pool_context;
        let account_iter = &mut accounts.iter();

        let quote_params = {
            let header = pool_info.get_header()?;
            header.quote_params
        };
        let quote_account = TokenAccountInfo::new_with_owner(
            next_account_info(account_iter)?,
            &quote_params.mint_key,
            &pool_context.signer.key,
        )?;
        let quote_vault = TokenAccountInfo::new_with_owner_and_key(
            next_account_info(account_iter)?,
            &quote_params.mint_key,
            &quote_params.vault_key,
            &quote_params.vault_key,
        )?;
        let token_program = Program::new(next_account_info(account_iter)?, &spl_token::id())?;

        Ok(Self {
            quote_account,
            quote_vault,
            token_program,
        })
    }
}
