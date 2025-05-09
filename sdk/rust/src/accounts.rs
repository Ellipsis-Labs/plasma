use borsh::{BorshDeserialize, BorshSerialize};
use bytemuck::{Pod, Zeroable};
use solana_program::pubkey::Pubkey;

pub const POOL_LEN: u64 = 624;
pub const POOL_DISCRIMINATOR: [u8; 8] = [116, 210, 187, 119, 196, 196, 52, 137];

#[derive(Debug, Copy, Clone, BorshDeserialize, BorshSerialize)]
#[repr(C)]
pub struct LpPosition {
    reward_factor_snapshot: i128,
    pub lp_shares: u64,
    pub withdrawable_lp_shares: u64,
    uncollected_fees: u64,
    collected_fees: u64,
    pub pending_shares_to_vest: (u64, u64),
}

#[derive(Debug, Copy, Clone, Zeroable, Pod, BorshDeserialize, BorshSerialize)]
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

#[derive(Debug, Copy, Clone, Zeroable, Pod, BorshDeserialize, BorshSerialize)]
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

#[derive(Debug, Default, Copy, Clone, Zeroable, Pod, BorshDeserialize, BorshSerialize)]
#[repr(C)]
pub struct ProtocolFeeRecipient {
    pub recipient: Pubkey,
    pub shares: u64,
    pub total_accumulated_quote_fees: u64,
    pub collected_quote_fees: u64,
}

#[derive(Debug, Default, Copy, Clone, Zeroable, Pod, BorshDeserialize, BorshSerialize)]
#[repr(C)]
pub struct ProtocolFeeRecipients {
    pub recipients: [ProtocolFeeRecipient; 3],
    _padding: [u64; 12],
}
