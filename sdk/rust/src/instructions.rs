use crate::{
    amm::Side, get_log_authority, get_lp_position_address, get_vault_address, spl_token, ID,
};
use borsh::{BorshDeserialize, BorshSerialize};
use num_enum::TryFromPrimitive;
use shank::ShankInstruction;
use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    system_program,
};

pub const SWAP_DISCRIMINATOR: u8 = 0;
pub const ADD_LIQUIDITY_DISCRIMINATOR: u8 = 1;
pub const REMOVE_LIQUIDITY_DISCRIMINATOR: u8 = 2;
pub const INITIALIZE_LP_POSITION_DISCRIMINATOR: u8 = 5;
pub const INITIALIZE_POOL_DISCRIMINATOR: u8 = 6;
pub const TRANSFER_LIQUIDITY_DISCRIMINATOR: u8 = 9;

#[repr(u8)]
#[derive(TryFromPrimitive, Debug, Copy, Clone, ShankInstruction, PartialEq, Eq, BorshDeserialize, BorshSerialize)]
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

#[derive(Clone, Copy, Debug, BorshDeserialize, BorshSerialize)]
pub enum SwapType {
    ExactIn { amount_in: u64, min_amount_out: u64 },
    ExactOut { amount_out: u64, max_amount_in: u64 },
}

#[repr(C)]
#[derive(Clone, Copy, Debug, BorshDeserialize, BorshSerialize)]
pub struct SwapParams {
    pub side: Side,
    pub swap_type: SwapType,
}

pub fn swap(
    pool_key: &Pubkey,
    trader: &Pubkey,
    base_mint: &Pubkey,
    quote_mint: &Pubkey,
    base_account_key: &Pubkey,
    quote_account_key: &Pubkey,
    params: SwapParams,
) -> Instruction {
    let log_authority = get_log_authority(&ID);
    let base_vault_key = get_vault_address(&ID, pool_key, base_mint).0;
    let quote_vault_key = get_vault_address(&ID, pool_key, quote_mint).0;

    Instruction {
        program_id: ID,
        accounts: vec![
            AccountMeta::new_readonly(ID, false),
            AccountMeta::new_readonly(log_authority, false),
            AccountMeta::new(*pool_key, false),
            AccountMeta::new_readonly(*trader, true),
            AccountMeta::new(*base_account_key, false),
            AccountMeta::new(*quote_account_key, false),
            AccountMeta::new(base_vault_key, false),
            AccountMeta::new(quote_vault_key, false),
            AccountMeta::new_readonly(spl_token::ID, false),
        ],
        data: [vec![SWAP_DISCRIMINATOR], params.try_to_vec().unwrap()].concat(),
    }
}

#[repr(C)]
#[derive(Clone, Copy, Debug, Default, BorshDeserialize, BorshSerialize)]
pub struct InitializePoolParams {
    pub lp_fee_in_bps: u64,
    pub protocol_fee_allocation_in_pct: u64,
    pub fee_recipients_params: [ProtocolFeeRecipientParams; 3],
    /// This is the number of slots that the LP shares will be vested over
    /// If this value is not a multiple of the leader slot window, it will be rounded down
    pub num_slots_to_vest_lp_shares: Option<u64>,
}

pub fn initialize_pool(
    pool_key: &Pubkey,
    pool_creator: &Pubkey,
    base_mint: &Pubkey,
    quote_mint: &Pubkey,
    params: InitializePoolParams,
) -> Instruction {
    let base_vault = get_vault_address(&ID, pool_key, base_mint).0;
    let quote_vault = get_vault_address(&ID, pool_key, quote_mint).0;
    let log_authority = get_log_authority(&ID);

    Instruction {
        program_id: crate::ID,
        accounts: vec![
            AccountMeta::new_readonly(ID, false),
            AccountMeta::new_readonly(log_authority, false),
            AccountMeta::new(*pool_key, false),
            AccountMeta::new(*pool_creator, true),
            AccountMeta::new_readonly(*base_mint, false),
            AccountMeta::new_readonly(*quote_mint, false),
            AccountMeta::new(base_vault, false),
            AccountMeta::new(quote_vault, false),
            AccountMeta::new_readonly(system_program::ID, false),
            AccountMeta::new_readonly(spl_token::ID, false),
        ],
        data: [
            vec![INITIALIZE_POOL_DISCRIMINATOR],
            params.try_to_vec().unwrap(),
        ]
        .concat(),
    }
}

#[derive(Debug, Default, Copy, Clone, BorshDeserialize, BorshSerialize)]
#[repr(C)]
pub struct ProtocolFeeRecipientParams {
    pub recipient: Pubkey,
    pub shares: u64,
}

pub fn initialize_lp_position(
    pool_key: &Pubkey,
    payer: &Pubkey,
    lp_position_owner: &Pubkey,
) -> Instruction {
    let log_authority = get_log_authority(&ID);
    let (lp_position_key, _) = get_lp_position_address(&ID, pool_key, lp_position_owner);
    Instruction {
        program_id: ID,
        accounts: vec![
            AccountMeta::new_readonly(ID, false),
            AccountMeta::new_readonly(log_authority, false),
            AccountMeta::new(*pool_key, false),
            AccountMeta::new(*payer, true),
            AccountMeta::new_readonly(*lp_position_owner, false),
            AccountMeta::new(lp_position_key, false),
            AccountMeta::new_readonly(system_program::ID, false),
        ],
        data: vec![INITIALIZE_LP_POSITION_DISCRIMINATOR],
    }
}

#[repr(C)]
#[derive(Clone, Copy, Debug, Default, BorshDeserialize, BorshSerialize)]
pub struct AddLiquidityParams {
    pub desired_base_amount_in: u64,
    pub desired_quote_amount_in: u64,
    pub initial_lp_shares: Option<u64>,
}

pub fn add_liquidity(
    pool_key: &Pubkey,
    trader: &Pubkey,
    base_mint: &Pubkey,
    base_mint_account_key: &Pubkey,
    quote_mint: &Pubkey,
    quote_mint_account_key: &Pubkey,
    params: AddLiquidityParams,
) -> Instruction {
    let log_authority = get_log_authority(&ID);
    let (lp_position_key, _) = get_lp_position_address(&ID, pool_key, trader);

    let (base_vault_key, _) = get_vault_address(&ID, pool_key, base_mint);
    let (quote_vault_key, _) = get_vault_address(&ID, pool_key, quote_mint);

    Instruction {
        program_id: ID,
        accounts: vec![
            AccountMeta::new_readonly(ID, false),
            AccountMeta::new_readonly(log_authority, false),
            AccountMeta::new(*pool_key, false),
            AccountMeta::new_readonly(*trader, true),
            AccountMeta::new(lp_position_key, false),
            AccountMeta::new(*base_mint_account_key, false),
            AccountMeta::new(*quote_mint_account_key, false),
            AccountMeta::new(base_vault_key, false),
            AccountMeta::new(quote_vault_key, false),
            AccountMeta::new_readonly(spl_token::ID, false),
        ],
        data: [
            vec![ADD_LIQUIDITY_DISCRIMINATOR],
            params.try_to_vec().unwrap(),
        ]
        .concat(),
    }
}

pub fn transfer_liquidity(pool_key: &Pubkey, src: &Pubkey, dst: &Pubkey) -> Instruction {
    let log_authority = get_log_authority(&ID);
    let (src_lp_position_key, _) = get_lp_position_address(&ID, pool_key, src);
    let (dst_lp_position_key, _) = get_lp_position_address(&ID, pool_key, dst);

    Instruction {
        program_id: ID,
        accounts: vec![
            AccountMeta::new_readonly(ID, false),
            AccountMeta::new_readonly(log_authority, false),
            AccountMeta::new(*pool_key, false),
            AccountMeta::new(*src, true),
            AccountMeta::new(src_lp_position_key, false),
            AccountMeta::new(dst_lp_position_key, false),
        ],
        data: vec![TRANSFER_LIQUIDITY_DISCRIMINATOR],
    }
}

pub fn remove_liquidity(
    pool_key: &Pubkey,
    trader: &Pubkey,
    base_mint: &Pubkey,
    quote_mint: &Pubkey,
    base_account_key: &Pubkey,
    quote_account_key: &Pubkey,
    shares: u64,
) -> Instruction {
    let log_authority = get_log_authority(&ID);
    let (lp_position_key, _) = get_lp_position_address(&ID, pool_key, trader);
    let base_vault_key = get_vault_address(&ID, pool_key, base_mint).0;
    let quote_vault_key = get_vault_address(&ID, pool_key, quote_mint).0;

    Instruction {
        program_id: ID,
        accounts: vec![
            AccountMeta::new_readonly(ID, false),
            AccountMeta::new_readonly(log_authority, false),
            AccountMeta::new(*pool_key, false),
            AccountMeta::new_readonly(*trader, true),
            AccountMeta::new(lp_position_key, false),
            AccountMeta::new(*base_account_key, false),
            AccountMeta::new(*quote_account_key, false),
            AccountMeta::new(base_vault_key, false),
            AccountMeta::new(quote_vault_key, false),
            AccountMeta::new_readonly(spl_token::ID, false),
        ],
        data: [
            vec![REMOVE_LIQUIDITY_DISCRIMINATOR],
            shares.to_le_bytes().to_vec(),
        ]
        .concat(),
    }
}

#[test]
fn test_instruction_serialization() {
    for i in 0..=255 {
        let instruction = match PlasmaInstruction::try_from(i) {
            Ok(j) => j,
            Err(_) => {
                // This needs to be changed if new instructions are added
                assert!(i > 7);
                continue;
            }
        };
        assert_eq!(instruction as u8, i);
    }
}
