///! These structs are unused in the program but are used to generate the IDL.
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::pubkey::Pubkey;

/* Types */
#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq, BorshDeserialize, BorshSerialize)]
pub enum Side {
    Buy,
    Sell,
}

#[derive(Debug, Clone, Copy, BorshDeserialize, BorshSerialize)]
pub struct SwapResult {
    pub side: Side,
    pub base_matched: u64,
    pub quote_matched: u64,
    pub base_matched_as_limit_order: u64,
    pub quote_matched_as_limit_order: u64,
    pub base_matched_as_swap: u64,
    pub quote_matched_as_swap: u64,
    pub fee_in_quote: u64,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, BorshDeserialize, BorshSerialize)]
pub struct TokenParams {
    pub decimals: u32,
    pub vault_bump: u32,
    pub mint_key: Pubkey,
    pub vault_key: Pubkey,
}

#[derive(Debug, Default, Copy, Clone, BorshDeserialize, BorshSerialize)]
#[repr(C)]
pub struct ProtocolFeeRecipient {
    pub recipient: Pubkey,
    pub shares: u64,
    pub total_accumulated_quote_fees: u64,
    pub collected_quote_fees: u64,
}

#[derive(Debug, Default, Copy, Clone, BorshDeserialize, BorshSerialize)]
#[repr(C)]
pub struct ProtocolFeeRecipients {
    pub recipients: [ProtocolFeeRecipient; 3],
    _padding: [u64; 12],
}
#[repr(C)]
#[derive(Debug, Copy, Clone, BorshDeserialize, BorshSerialize)]
pub struct PoolHeader {
    // We omit the discriminator from the autogen_client_structs.rs file to enable Anchor to autogenerate the struct
    pub sequence_number: u64,
    pub base_params: TokenParams,
    pub quote_params: TokenParams,
    pub fee_recipients: ProtocolFeeRecipients,
    pub swap_sequence_number: u64,
    pub padding: [u64; 12],
}
#[repr(C)]
#[derive(Debug, Copy, Clone, BorshDeserialize, BorshSerialize)]
pub struct Amm {
    pub fee_in_bps: u32,
    pub protocol_allocation_in_pct: u32,
    pub lp_vesting_window: u64,
    pub reward_factor: u128,
    pub total_lp_shares: u64,
    pub slot_snapshot: u64,
    pub base_reserves_snapshot: u64,
    pub quote_reserves_snapshot: u64,
    pub base_reserves: u64,
    pub quote_reserves: u64,
    pub cumulative_quote_lp_fees: u64,
    pub cumulative_quote_protocol_fees: u64,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, BorshDeserialize, BorshSerialize)]
pub struct LpPosition {
    reward_factor_snapshot: u128,
    pub lp_shares: u64,
    pub withdrawable_lp_shares: u64,
    uncollected_fees: u64,
    collected_fees: u64,
    pending_shares_to_vest: PendingSharesToVest,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, BorshDeserialize, BorshSerialize)]
pub struct PendingSharesToVest {
    pub deposit_slot: u64,
    pub lp_shares_to_vest: u64,
}

/* Instruction params. Each struct below must be formatted as IX_NAME + "IxParams" */
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, BorshDeserialize, BorshSerialize)]
pub struct InitializePoolIxParams {
    lp_fee_in_bps: u64,
    protocol_lp_fee_allocation_in_pct: u64,
    fee_recipients_params: [ProtocolFeeRecipientParams; 3],
    num_slots_to_vest_lp_shares: Option<u64>,
}

#[repr(C)]
#[derive(Clone, Copy, Debug, Default, BorshDeserialize, BorshSerialize)]
pub struct AddLiquidityIxParams {
    pub desired_base_amount_in: u64,
    pub desired_quote_amount_in: u64,
    pub initial_lp_shares: Option<u64>,
}

#[repr(C)]
#[derive(Clone, Copy, Debug, Default, BorshDeserialize, BorshSerialize)]
pub struct RemoveLiquidityIxParams {
    pub lp_shares: u64,
}

#[repr(C)]
#[derive(Clone, Copy, Debug, BorshDeserialize, BorshSerialize)]
pub struct SwapIxParams {
    pub side: Side,
    pub swap_type: SwapType,
}

#[repr(C)]
#[derive(Clone, Copy, Debug, BorshDeserialize, BorshSerialize)]
pub enum SwapType {
    ExactIn { amount_in: u64, min_amount_out: u64 },
    ExactOut { amount_out: u64, max_amount_in: u64 },
}
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, BorshDeserialize, BorshSerialize)]
pub struct RenounceLiquidityIxParams {
    pub allow_fee_withdrawal: bool,
}

/* Accounts */

#[repr(C)]
#[derive(Debug, Clone, BorshDeserialize, BorshSerialize)]
pub struct PoolAccount {
    pub pool_header: PoolHeader,
    pub amm: Amm,
}

#[repr(C)]
#[derive(Debug, Copy, Clone, BorshDeserialize, BorshSerialize)]
pub struct LpPositionAccount {
    // We omit the discriminator from the autogen_client_structs.rs file to enable Anchor to autogenerate the struct
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub status: u64,
    pub lp_position: LpPosition,
}

/* Events */
#[repr(C)]
#[derive(Debug, Copy, Clone, BorshDeserialize, BorshSerialize)]
pub struct PlasmaEventHeader {
    pub sequence_number: u64,
    pub slot: u64,
    pub timestamp: i64,
    pub pool: Pubkey,
    pub signer: Pubkey,
    pub base_decimals: u8,
    pub quote_decimals: u8,
}

#[derive(Debug, Clone, BorshSerialize, BorshDeserialize)]
pub struct SwapEvent {
    pub swap_sequence_number: u64,
    pub pre_base_liquidity: u64,
    pub pre_quote_liquidity: u64,
    pub post_base_liquidity: u64,
    pub post_quote_liquidity: u64,
    pub snapshot_base_liquidity: u64,
    pub snapshot_quote_liquidity: u64,
    pub swap_result: SwapResult,
}

#[derive(Debug, Clone, BorshSerialize, BorshDeserialize)]
pub struct AddLiquidityEvent {
    pub pool_total_lp_shares: u64,
    pub pool_total_base_liquidity: u64,
    pub pool_total_quote_liquitidy: u64,
    pub snapshot_base_liquidity: u64,
    pub snapshot_quote_liquidity: u64,
    pub user_lp_shares_received: u64,
    pub user_lp_shares_available: u64,
    pub user_lp_shares_locked: u64,
    pub user_lp_shares_unlocked_for_withdrawal: u64,
    pub user_base_deposited: u64,
    pub user_quote_deposited: u64,
    pub user_total_withdrawable_base: u64,
    pub user_total_withdrawable_quote: u64,
}

#[derive(Debug, Clone, BorshSerialize, BorshDeserialize)]
pub struct RemoveLiquidityEvent {
    pub pool_total_lp_shares: u64,
    pub pool_total_base_liquidity: u64,
    pub pool_total_quote_liquitidy: u64,
    pub snapshot_base_liquidity: u64,
    pub snapshot_quote_liquidity: u64,
    pub user_lp_shares_burned: u64,
    pub user_lp_shares_available: u64,
    pub user_lp_shares_locked: u64,
    pub user_lp_shares_unlocked_for_withdrawal: u64,
    pub user_base_withdrawn: u64,
    pub user_quote_withdrawn: u64,
    pub user_total_withdrawable_base: u64,
    pub user_total_withdrawable_quote: u64,
}

#[derive(Debug, Clone, BorshSerialize, BorshDeserialize)]
pub struct RenounceLiquidityEvent {
    pub allow_fee_withdrawal: bool,
}

#[derive(Debug, Clone, BorshSerialize, BorshDeserialize)]
pub struct InitializeLpPositionEvent {
    owner: Pubkey,
}

#[derive(Debug, Default, Copy, Clone, BorshDeserialize, BorshSerialize)]
#[repr(C)]
pub struct ProtocolFeeRecipientParams {
    pub recipient: Pubkey,
    pub shares: u64,
}

#[derive(Debug, Clone, BorshSerialize, BorshDeserialize)]
pub struct InitializePoolEvent {
    pub lp_fee_in_bps: u64,
    pub protocol_fee_in_pct: u64,
    pub fee_recipient_params: [ProtocolFeeRecipientParams; 3],
}

#[derive(Debug, Clone, BorshSerialize, BorshDeserialize)]
pub struct WithdrawLpFeesEvent {
    pub fees_withdrawn: u64,
}

#[derive(Debug, Clone, BorshSerialize, BorshDeserialize)]
pub struct WithdrawProtocolFeesEvent {
    pub protocol_fee_recipient: Pubkey,
    pub fees_withdrawn: u64,
}

#[repr(C)]
#[derive(Debug, Clone, BorshDeserialize, BorshSerialize)]
pub enum PlasmaEvent {
    Swap {
        header: PlasmaEventHeader,
        event: SwapEvent,
    },
    AddLiquidity {
        header: PlasmaEventHeader,
        event: AddLiquidityEvent,
    },
    RemoveLiquidity {
        header: PlasmaEventHeader,
        event: RemoveLiquidityEvent,
    },
    RenounceLiquidity {
        header: PlasmaEventHeader,
        event: RenounceLiquidityEvent,
    },
    WithdrawLpFees {
        header: PlasmaEventHeader,
        event: WithdrawLpFeesEvent,
    },
    InitializeLpPosition {
        header: PlasmaEventHeader,
        event: InitializeLpPositionEvent,
    },
    InitializePool {
        header: PlasmaEventHeader,
        event: InitializePoolEvent,
    },
    WithdrawProtocolFees {
        header: PlasmaEventHeader,
        event: WithdrawProtocolFeesEvent,
    },
}
