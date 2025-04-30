use borsh::{BorshDeserialize as Deserialize, BorshSerialize as Serialize};
use solana_program::pubkey::Pubkey;

use plasma_state::amm::SwapResult;

use crate::initialize::ProtocolFeeRecipientParams;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlasmaEvent<T: Clone + Deserialize + Serialize> {
    pub instruction: u8,
    pub sequence_number: u64,
    pub slot: u64,
    pub timestamp: i64,
    pub pool: Pubkey,
    pub signer: Pubkey,
    pub base_decimals: u8,
    pub quote_decimals: u8,
    pub event: T,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenounceLiquidityEvent {
    pub allow_fee_withdrawal: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferLiquidityEvent {
    pub src: Pubkey,
    pub dst: Pubkey,
    pub lp_shares_transferred: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitializeLpPositionEvent {
    pub owner: Pubkey,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitializePoolEvent {
    pub lp_fee_in_bps: u64,
    pub protocol_fee_in_pct: u64,
    pub fee_recipient_params: [ProtocolFeeRecipientParams; 3],
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WithdrawLpFeesEvent {
    pub fees_withdrawn: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WithdrawProtocolFeesEvent {
    pub protocol_fee_recipient: Pubkey,
    pub fees_withdrawn: u64,
}
