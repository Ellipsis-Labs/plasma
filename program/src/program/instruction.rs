use num_enum::TryFromPrimitive;
use shank::ShankInstruction;

#[repr(u8)]
#[derive(TryFromPrimitive, Debug, Copy, Clone, ShankInstruction, PartialEq, Eq)]
#[rustfmt::skip]
pub enum PlasmaInstruction {
    // Pool instructions
    /// Send a swap order
    #[account(0, name = "plasma_program", desc = "Plasma program")]
    #[account(1, name = "log_authority", desc = "Plasma log authority")]
    #[account(2, writable, name = "pool", desc = "This account holds the pool state")]
    #[account(3, signer, name = "trader")]
    #[account(4, writable, name = "base_account", desc = "Trader base token account")]
    #[account(5, writable, name = "quote_account", desc = "Trader quote token account")]
    #[account(6, writable, name = "base_vault", desc = "Base vault PDA, seeds are [b'vault', pool_address, base_mint_address]")]
    #[account(7, writable, name = "quote_vault", desc = "Quote vault PDA, seeds are [b'vault', pool_address, quote_mint_address]")]
    #[account(8, name = "token_program", desc = "Token program")]
    Swap = 0,

    /// Adds liquidity to the pool 
    #[account(0, name = "plasma_program", desc = "Plasma program")]
    #[account(1, name = "log_authority", desc = "Plasma log authority")]
    #[account(2, writable, name = "pool", desc = "This account holds the pool state")]
    #[account(3, signer, name = "trader")]
    #[account(4, writable, name = "lp_position")]
    #[account(5, writable, name = "base_account", desc = "Trader base token account")]
    #[account(6, writable, name = "quote_account", desc = "Trader quote token account")]
    #[account(7, writable, name = "base_vault", desc = "Base vault PDA, seeds are [b'vault', pool_address, base_mint_address]")]
    #[account(8, writable, name = "quote_vault", desc = "Quote vault PDA, seeds are [b'vault', pool_address, quote_mint_address]")]
    #[account(9, name = "token_program", desc = "Token program")]
    AddLiquidity = 1,

    /// Removes Liquidity from the pool 
    #[account(0, name = "plasma_program", desc = "Plasma program")]
    #[account(1, name = "log_authority", desc = "Plasma log authority")]
    #[account(2, writable, name = "pool", desc = "This account holds the pool state")]
    #[account(3, signer, name = "trader")]
    #[account(4, writable, name = "lp_position")]
    #[account(5, writable, name = "base_account", desc = "Trader base token account")]
    #[account(6, writable, name = "quote_account", desc = "Trader quote token account")]
    #[account(7, writable, name = "base_vault", desc = "Base vault PDA, seeds are [b'vault', pool_address, base_mint_address]")]
    #[account(8, writable, name = "quote_vault", desc = "Quote vault PDA, seeds are [b'vault', pool_address, quote_mint_address]")]
    #[account(9, name = "token_program", desc = "Token program")]
    RemoveLiquidity = 2,

    /// Renounce ownership of LP position 
    #[account(0, name = "plasma_program", desc = "Plasma program")]
    #[account(1, name = "log_authority", desc = "Plasma log authority")]
    #[account(2, writable, name = "pool", desc = "This account holds the pool state")]
    #[account(3, signer, name = "trader")]
    #[account(4, writable, name = "lp_position")]
    RenounceLiquidity = 3,

    /// Reduce the size of an existing order on the book 
    #[account(0, name = "plasma_program", desc = "Plasma program")]
    #[account(1, name = "log_authority", desc = "Plasma log authority")]
    #[account(2, writable, name = "pool", desc = "This account holds the pool state")]
    #[account(3, signer, name = "trader")]
    #[account(4, name = "lp_position_owner")]
    #[account(5, writable, name = "lp_position")]
    #[account(6, writable, name = "quote_account", desc = "Trader quote token account")]
    #[account(7, writable, name = "quote_vault", desc = "Quote vault PDA, seeds are [b'vault', pool_address, quote_mint_address]")]
    #[account(8, name = "token_program", desc = "Token program")]
    WithdrawLpFees = 4,

    #[account(0, name = "plasma_program", desc = "Plasma program")]
    #[account(1, name = "log_authority", desc = "Plasma log authority")]
    #[account(2, writable, name = "pool", desc = "This account holds the pool state")]
    #[account(3, writable, signer, name = "payer")]
    #[account(4, name = "lp_position_owner")]
    #[account(5, writable, name = "lp_position")]
    #[account(6, name = "system_program", desc = "System program")]
    InitializeLpPosition = 5,

    /// Create a pool 
    #[account(0, name = "plasma_program", desc = "Plasma program")]
    #[account(1, name = "log_authority", desc = "Plasma log authority")]
    #[account(2, writable, name = "pool", desc = "This account holds the pool state")]
    #[account(3, writable, signer, name = "pool_creator", desc = "The pool_creator account must sign for the creation of new vaults")]
    #[account(4, name = "base_mint", desc = "Base mint account")]
    #[account(5, name = "quote_mint", desc = "Quote mint account")]
    #[account(6, writable, name = "base_vault", desc = "Base vault PDA, seeds are [b'vault', pool_address, base_mint_address]")]
    #[account(7, writable, name = "quote_vault", desc = "Quote vault PDA, seeds are [b'vault', pool_address, quote_mint_address]")]
    #[account(8, name = "system_program", desc = "System program")]
    #[account(9, name = "token_program", desc = "Token program")]
    InitializePool = 6,

    /// Withdraw Protocol Fees
    #[account(0, name = "plasma_program", desc = "Plasma program")]
    #[account(1, name = "log_authority", desc = "Plasma log authority")]
    #[account(2, writable, name = "pool", desc = "This account holds the pool state")]
    #[account(3, signer, name = "protocol_fee_recipient", desc = "Recipient of protocol fees")]
    #[account(4, writable, name = "quote_account", desc = "Trader quote token account")]
    #[account(5, writable, name = "quote_vault", desc = "Quote vault PDA, seeds are [b'vault', pool_address, quote_mint_address]")]
    #[account(6, name = "token_program", desc = "Token program")]
    WithdrawProtocolFees = 7,

    #[account(0, signer, name = "log_authority", desc = "Log authority")]
    Log = 8,

    /// Transfer liquidity between LP positions
    #[account(0, name = "plasma_program", desc = "Plasma program")]
    #[account(1, name = "log_authority", desc = "Plasma log authority")]
    #[account(2, writable, name = "pool", desc = "This account holds the pool state")]
    #[account(3, signer, name = "trader")]
    #[account(4, writable, name = "src_lp_position")]
    #[account(5, writable, name = "dst_lp_position")]
    TransferLiquidity = 9,
}

impl PlasmaInstruction {
    pub fn to_vec(&self) -> Vec<u8> {
        vec![*self as u8]
    }
}

#[test]
fn test_instruction_serialization() {
    for i in 0..=255 {
        let instruction = match PlasmaInstruction::try_from(i) {
            Ok(j) => j,
            Err(_) => {
                // This needs to be changed if new instructions are added
                assert!(i > 9);
                continue;
            }
        };
        assert_eq!(instruction as u8, i);
    }
}
