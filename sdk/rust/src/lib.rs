use errors::PlasmaError;
use solana_program::{declare_id, pubkey::Pubkey};

pub mod accounts;
pub mod amm;
pub mod errors;
pub mod events;
pub mod fixed;
pub mod instructions;
pub mod lp;

declare_id!("srAMMzfVHVAtgSJc8iH6CfKzuWuUTzLHVCE81QU1rgi");

pub mod spl_token {
    use solana_program::declare_id;

    declare_id!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
}

pub fn get_vault_address(plasma_program_id: &Pubkey, pool: &Pubkey, mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"vault", pool.as_ref(), mint.as_ref()],
        &plasma_program_id,
    )
}

pub fn get_lp_position_address(
    plasma_program_id: &Pubkey,
    pool: &Pubkey,
    trader: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"lp_position", pool.as_ref(), trader.as_ref()],
        &plasma_program_id,
    )
}

pub fn get_log_authority(plasma_program_id: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[b"log"], plasma_program_id).0
}

pub type SlotWindow = u64;

/// Private trait for safely downcasting between types
pub(crate) trait Downcast<To> {
    fn downcast(&self) -> Result<To, PlasmaError>;
}

impl Downcast<u64> for u128 {
    fn downcast(&self) -> Result<u64, PlasmaError> {
        if *self > u64::MAX as u128 {
            Err(PlasmaError::Overflow)
        } else {
            Ok(*self as u64)
        }
    }
}

/// Private trait for upcasting a larger integer type
pub(crate) trait Upcast<To> {
    fn upcast(&self) -> To;
}

impl Upcast<u128> for u64 {
    fn upcast(&self) -> u128 {
        *self as u128
    }
}

impl Upcast<u128> for u32 {
    fn upcast(&self) -> u128 {
        *self as u128
    }
}
