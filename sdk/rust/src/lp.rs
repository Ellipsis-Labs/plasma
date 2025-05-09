use super::SlotWindow;
use crate::{amm::Amm, errors::PlasmaError, fixed::I80F48};
use borsh::{BorshDeserialize, BorshSerialize};
use bytemuck::{Pod, Zeroable};

#[derive(Debug, Copy, Clone, Zeroable, Pod, BorshDeserialize, BorshSerialize)]
#[repr(C)]
pub struct PendingSharesToVest {
    pub deposit_slot: SlotWindow,
    pub lp_shares_to_vest: u64,
}

impl PendingSharesToVest {
    fn new() -> Self {
        Self {
            deposit_slot: 0,
            lp_shares_to_vest: 0,
        }
    }

    pub fn is_vesting(&self) -> bool {
        self.lp_shares_to_vest > 0 || self.deposit_slot != 0
    }

    pub fn set(&mut self, slot: SlotWindow, lp_shares: u64) -> Result<(), PlasmaError> {
        if self.deposit_slot == 0 {
            self.deposit_slot = slot;
            self.lp_shares_to_vest = lp_shares;
            Ok(())
        } else {
            Err(PlasmaError::VestingPeriodNotOver)
        }
    }

    pub fn maybe_vest_shares(&mut self, slot: SlotWindow, amm: &Amm) -> u64 {
        if self.deposit_slot == 0 {
            return 0;
        }
        if self.deposit_slot + amm.lp_vesting_window <= slot {
            let lp_shares = self.lp_shares_to_vest;
            self.deposit_slot = 0;
            self.lp_shares_to_vest = 0;
            lp_shares
        } else {
            0
        }
    }

    /// Force vest the shares, this is only used when transferring liquidity
    pub(crate) fn force_vest_shares(&mut self) -> u64 {
        let lp_shares = self.lp_shares_to_vest;
        self.lp_shares_to_vest = 0;
        self.deposit_slot = 0;
        lp_shares
    }
}

#[derive(Debug, Copy, Clone, Zeroable, Pod, BorshDeserialize, BorshSerialize)]
#[repr(C)]
pub struct LpPosition {
    reward_factor_snapshot: I80F48,
    pub lp_shares: u64,
    pub withdrawable_lp_shares: u64,
    uncollected_fees: u64,
    collected_fees: u64,
    pub pending_shares_to_vest: PendingSharesToVest,
}

impl LpPosition {
    pub fn new_with_reward_factor_snapshot(reward_factor: I80F48) -> Self {
        Self {
            reward_factor_snapshot: reward_factor,
            lp_shares: 0,
            withdrawable_lp_shares: 0,
            uncollected_fees: 0,
            collected_fees: 0,
            pending_shares_to_vest: PendingSharesToVest::new(),
        }
    }

    pub fn is_empty(&self) -> bool {
        self.lp_shares == 0
    }
}

impl LpPosition {
    fn preprocess_lp_position(
        &mut self,
        slot: SlotWindow,
        amm: &Amm,
    ) -> Result<(u64, u64), PlasmaError> {
        let vested_lp_shares = self.pending_shares_to_vest.maybe_vest_shares(slot, amm);
        self.withdrawable_lp_shares += vested_lp_shares;
        let current_reward_factor = amm.reward_factor;
        let withdrawable_fees = if current_reward_factor > I80F48::ZERO && amm.total_lp_shares > 0 {
            let accumulated_reward = current_reward_factor - self.reward_factor_snapshot;
            if accumulated_reward < I80F48::ZERO {
                return Err(PlasmaError::Overflow);
            }
            (accumulated_reward * I80F48::from_num(self.lp_shares)).floor()
        } else {
            0
        };
        self.reward_factor_snapshot = current_reward_factor;
        self.uncollected_fees += withdrawable_fees;
        Ok((vested_lp_shares, withdrawable_fees))
    }
}

impl LpPosition {
    pub fn get_withdrawable_base_and_quote_amounts(&self, amm: &Amm) -> (u64, u64) {
        let base_amount = self.withdrawable_lp_shares * amm.base_reserves / amm.total_lp_shares;
        let quote_amount = self.withdrawable_lp_shares * amm.quote_reserves / amm.total_lp_shares;
        (base_amount, quote_amount)
    }
}

impl LpPosition {
    pub fn add_liquidity(
        &mut self,
        slot: SlotWindow,
        amm: &mut Amm,
        base_amount_desired: u64,
        quote_amount_desired: u64,
        initial_lp_shares: Option<u64>,
    ) -> Result<AddLiquidityResult, PlasmaError> {
        let (lp_shares_vested, quote_fees_accumulated) = self.preprocess_lp_position(slot, amm)?;

        let (base_amount_deposited, quote_amount_deposited, lp_shares_received) = amm.mint(
            slot,
            base_amount_desired,
            quote_amount_desired,
            initial_lp_shares,
        )?;

        // Record new LP shares for the user
        self.pending_shares_to_vest.set(slot, lp_shares_received)?;
        self.lp_shares += lp_shares_received;
        Ok(AddLiquidityResult {
            base_amount_deposited,
            quote_amount_deposited,
            lp_shares_received,
            lp_shares_vested,
            quote_fees_accumulated,
        })
    }

    pub fn remove_liquidity(
        &mut self,
        slot: SlotWindow,
        amm: &mut Amm,
        lp_shares: u64,
    ) -> Result<RemoveLiquidityResult, PlasmaError> {
        let (lp_shares_vested, quote_fees_accumulated) = self.preprocess_lp_position(slot, amm)?;

        if lp_shares > self.withdrawable_lp_shares {
            return Ok(RemoveLiquidityResult {
                base_amount_withdrawn: 0,
                quote_amount_withdrawn: 0,
                lp_shares_burned: 0,
                lp_shares_vested,
                quote_fees_accumulated,
            });
        }

        let (base_amount_withdrawn, quote_amount_withdrawn) = amm.burn(slot, lp_shares)?;

        self.withdrawable_lp_shares -= lp_shares;
        self.lp_shares -= lp_shares;

        Ok(RemoveLiquidityResult {
            base_amount_withdrawn,
            quote_amount_withdrawn,
            lp_shares_burned: lp_shares,
            lp_shares_vested,
            quote_fees_accumulated,
        })
    }

    pub fn transfer_liquidity(
        &mut self,
        slot: SlotWindow,
        amm: &Amm,
        dst: &mut LpPosition,
    ) -> Result<u64, PlasmaError> {
        self.preprocess_lp_position(slot, amm)?;
        dst.preprocess_lp_position(slot, amm)?;

        // You cannot transfer liquidity if the destination is not empty
        if !dst.is_empty() {
            return Err(PlasmaError::InvariantViolation(dst.lp_shares as u128, 0));
        }

        // Force vest the shares to make sure the full amount is transferred to the destination
        let total_withdrawable_lp_shares =
            self.withdrawable_lp_shares + self.pending_shares_to_vest.lp_shares_to_vest;

        if total_withdrawable_lp_shares != self.lp_shares {
            return Err(PlasmaError::InvariantViolation(
                total_withdrawable_lp_shares as u128,
                self.lp_shares as u128,
            ));
        }

        // Every state mutation after this point is not allowed to fail
        self.pending_shares_to_vest.force_vest_shares();

        let lp_shares_transferred = self.lp_shares;

        // Zero out the source liquidity position
        self.withdrawable_lp_shares = 0;
        self.lp_shares = 0;

        // Increment the destination liquidity position
        dst.pending_shares_to_vest
            .set(slot, lp_shares_transferred)?;
        dst.lp_shares += lp_shares_transferred;

        Ok(lp_shares_transferred)
    }

    pub fn collect_fees(&mut self, slot: SlotWindow, amm: &Amm) -> Result<u64, PlasmaError> {
        self.preprocess_lp_position(slot, amm)?;
        let fees = self.uncollected_fees;
        self.collected_fees += fees;
        self.uncollected_fees = 0;
        Ok(fees)
    }
}

#[derive(Debug, Copy, Clone, BorshDeserialize, BorshSerialize)]
pub struct AddLiquidityResult {
    pub base_amount_deposited: u64,
    pub quote_amount_deposited: u64,
    pub lp_shares_received: u64,
    pub lp_shares_vested: u64,
    pub quote_fees_accumulated: u64,
}

#[derive(Debug, Copy, Clone, BorshDeserialize, BorshSerialize)]
pub struct RemoveLiquidityResult {
    pub base_amount_withdrawn: u64,
    pub quote_amount_withdrawn: u64,
    pub lp_shares_burned: u64,
    pub lp_shares_vested: u64,
    pub quote_fees_accumulated: u64,
}
