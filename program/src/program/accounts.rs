use std::{
    fmt::Display,
    ops::{Deref, DerefMut},
    slice::{Iter, IterMut},
};

use bytemuck::{Pod, Zeroable};
use solana_program::{msg, program_error::ProgramError, pubkey::Pubkey};

use plasma_amm_state::{amm::Amm, lp::LpPosition};

use crate::assert_with_msg;

pub const LP_POSITION_ACCOUNT_DISCRIMINATOR: [u8; 8] = [101, 177, 26, 44, 161, 242, 87, 136];
pub const POOL_ACCOUNT_DISCRIMINATOR: [u8; 8] = [116, 210, 187, 119, 196, 196, 52, 137];

#[derive(Debug, Copy, Clone, Zeroable, Pod)]
#[repr(C)]
pub struct TokenParams {
    /// Number of decimals for the token (e.g. 9 for SOL, 6 for USDC).
    pub decimals: u32,

    /// Bump used for generating the PDA for the pool's token vault.
    pub vault_bump: u32,

    /// Pubkey of the token mint.
    pub mint_key: Pubkey,

    /// Pubkey of the token vault.
    pub vault_key: Pubkey,
}

#[derive(Debug, Default, Copy, Clone, Zeroable, Pod)]
#[repr(C)]
pub struct ProtocolFeeRecipient {
    pub recipient: Pubkey,
    pub shares: u64,
    pub total_accumulated_quote_fees: u64,
    pub collected_quote_fees: u64,
}

#[derive(Debug, Default, Copy, Clone, Zeroable, Pod)]
#[repr(C)]
pub struct ProtocolFeeRecipients {
    pub recipients: [ProtocolFeeRecipient; 3],
    _padding: [u64; 12],
}

impl ProtocolFeeRecipients {
    pub fn new(recipients: [ProtocolFeeRecipient; 3]) -> Self {
        Self {
            recipients,
            _padding: [0; 12],
        }
    }

    pub fn iter(&self) -> Iter<'_, ProtocolFeeRecipient> {
        self.recipients.iter()
    }

    pub fn iter_mut(&mut self) -> IterMut<'_, ProtocolFeeRecipient> {
        self.recipients.iter_mut()
    }
}
#[derive(Debug, Copy, Clone, Zeroable, Pod)]
#[repr(C)]
pub struct PoolHeader {
    pub discriminator: [u8; 8],
    pub sequence_number: u64,
    pub base_params: TokenParams,
    pub quote_params: TokenParams,
    pub fee_recipients: ProtocolFeeRecipients,
    pub swap_sequence_number: u64,
    pub padding: [u64; 12],
}

#[derive(Debug, Copy, Clone, Zeroable, Pod)]
#[repr(C)]
pub struct PoolAccount {
    pub header: PoolHeader,
    pub amm: Amm,
}

impl PoolAccount {
    pub fn increment_sequence_number(&mut self) {
        self.header.sequence_number += 1;
    }

    pub fn increment_swap_sequence_number(&mut self) -> u64 {
        self.header.swap_sequence_number += 1;
        self.header.swap_sequence_number
    }

    pub fn update_protocol_fee_recipients_post_swap(&mut self) -> Result<(), ProgramError> {
        let total_shares = self
            .header
            .fee_recipients
            .iter()
            .map(|r| r.shares as u128)
            .sum::<u128>();

        if total_shares > u64::MAX as u128 {
            msg!("Total shares exceeds u64::MAX");
            return Err(ProgramError::InvalidArgument);
        }

        let mut accumulated_fees_all_recpients = 0;

        for recipient in self.header.fee_recipients.iter_mut() {
            recipient.total_accumulated_quote_fees = self
                .amm
                .cumulative_quote_protocol_fees
                .checked_mul(recipient.shares)
                .and_then(|total_unnormalized_fee| {
                    total_unnormalized_fee.checked_div(total_shares as u64)
                })
                .ok_or_else(|| {
                    msg!("Overflow while calculating total_accumulated_quote_fees");
                    ProgramError::InvalidArgument
                })?;
            accumulated_fees_all_recpients += recipient.total_accumulated_quote_fees;
        }

        assert_with_msg(
            self.amm.cumulative_quote_protocol_fees >= accumulated_fees_all_recpients,
            ProgramError::InvalidAccountData,
            "Cumulative protocol fees does not match the sum of all recipients",
        )?;
        Ok(())
    }

    /// Withdraws protocol fees for a given recipient. Error if the recipient is not one of the protocol fee recipients.
    pub fn withdraw_protocol_fee(&mut self, recipient: &Pubkey) -> Result<u64, ProgramError> {
        let recipient_index = self
            .header
            .fee_recipients
            .iter()
            .position(|r: &ProtocolFeeRecipient| r.recipient == *recipient)
            .ok_or(ProgramError::InvalidArgument)?;
        let recipient = &mut self.header.fee_recipients.recipients[recipient_index];

        let withdrawable_amount = recipient
            .total_accumulated_quote_fees
            .saturating_sub(recipient.collected_quote_fees);
        recipient.collected_quote_fees = recipient.total_accumulated_quote_fees;

        Ok(withdrawable_amount)
    }
}

impl Deref for PoolAccount {
    type Target = Amm;

    fn deref(&self) -> &Self::Target {
        &self.amm
    }
}

impl DerefMut for PoolAccount {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.amm
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
#[repr(u64)]
pub enum LpPositionStatus {
    Uninitialized,
    Active,
    RenouncedWithBurnedFees,
    RenouncedWithFeeWithdawal,
}

impl LpPositionStatus {
    pub fn parse(status: u64) -> Result<Self, ProgramError> {
        LpPositionStatus::try_from(status).map_err(|_| {
            msg!(
                "[ERROR] Invalid LpPositionStatus {}. Data corruption detected.",
                status
            );
            ProgramError::InvalidAccountData
        })
    }
}

impl From<u64> for LpPositionStatus {
    fn from(status: u64) -> Self {
        match status {
            0 => LpPositionStatus::Uninitialized,
            1 => LpPositionStatus::Active,
            2 => LpPositionStatus::RenouncedWithBurnedFees,
            3 => LpPositionStatus::RenouncedWithFeeWithdawal,
            _ => panic!("Invalid approval status"),
        }
    }
}

impl Display for LpPositionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LpPositionStatus::Uninitialized => write!(f, "Unititialized"),
            LpPositionStatus::Active => write!(f, "Active"),
            LpPositionStatus::RenouncedWithBurnedFees => write!(f, "RenouncedWithBurnedFees"),
            LpPositionStatus::RenouncedWithFeeWithdawal => write!(f, "RenouncedWithFeeWithdawal"),
        }
    }
}

impl Default for LpPositionStatus {
    fn default() -> Self {
        LpPositionStatus::Uninitialized
    }
}

#[derive(Debug, Copy, Clone, Zeroable, Pod)]
#[repr(C)]
pub struct LpPositionAccount {
    pub discriminator: [u8; 8],
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub status: u64,
    pub lp_position: LpPosition,
}

impl Deref for LpPositionAccount {
    type Target = LpPosition;

    fn deref(&self) -> &Self::Target {
        &self.lp_position
    }
}

impl DerefMut for LpPositionAccount {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.lp_position
    }
}
