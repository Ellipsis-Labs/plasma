use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{declare_id, pubkey::Pubkey};

pub use plasma_amm_state::amm;
pub use plasma_amm_state::lp;

pub mod accounts;
pub mod errors;
pub mod events;
pub mod fixed;
pub mod instructions;

declare_id!("srAMMzfVHVAtgSJc8iH6CfKzuWuUTzLHVCE81QU1rgi");

pub mod spl_token {
    use solana_program::declare_id;

    declare_id!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
}

pub fn get_vault_address(plasma_program_id: &Pubkey, pool: &Pubkey, mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"vault", pool.as_ref(), mint.as_ref()], plasma_program_id)
}

pub fn get_lp_position_address(
    plasma_program_id: &Pubkey,
    pool: &Pubkey,
    trader: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"lp_position", pool.as_ref(), trader.as_ref()],
        plasma_program_id,
    )
}

pub fn get_log_authority(plasma_program_id: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[b"log"], plasma_program_id).0
}

pub type SlotWindow = u64;

#[derive(Debug, Clone, Copy, BorshDeserialize, BorshSerialize)]
pub struct SwapResult {
    pub side: amm::Side,
    pub base_amount_to_transfer: u64,
    pub quote_amount_to_transfer: u64,
    pub base_matched_as_limit_order: u64,
    pub quote_matched_as_limit_order: u64,
    pub base_matched_as_swap: u64,
    pub quote_matched_as_swap: u64,
    pub fee_in_quote: u64,
}

impl SwapResult {
    pub fn new_empty_with_side(side: amm::Side) -> Self {
        Self {
            side,
            base_amount_to_transfer: 0,
            quote_amount_to_transfer: 0,
            base_matched_as_limit_order: 0,
            quote_matched_as_limit_order: 0,
            base_matched_as_swap: 0,
            quote_matched_as_swap: 0,
            fee_in_quote: 0,
        }
    }
}
