use arbitrary::Arbitrary;
use plasma_state::amm::Amm;
use plasma_state::errors::*;
use plasma_state::lp::LpPosition;
use std::env;
use std::fmt::Debug;

#[derive(Debug, Arbitrary, Clone, Copy)]
pub enum AmmAction {
    AddLiquidity(u8),
    RemoveLiquidity(u8),
    BuyExactIn(u8),
    SellExactIn(u8),
    BuyExactOut(u8),
    SellExactOut(u8),
    Tick,
}

#[derive(Debug, Arbitrary, Clone, Copy)]
pub enum LpAction {
    BuyExactIn(u8),
    SellExactIn(u8),
    BuyExactOut(u8),
    SellExactOut(u8),
    InitializeLpPosition(usize), // Index of the LP position to initialize
    AddLiquidity(u8),
    RemoveLiquidity(u8),
    CollectFees(usize),
    Tick,
}

const TOTAL_BASE_SUPPLY: u64 = 1_073_000_000_000_000;
const TOTAL_QUOTE_SUPPLY: u64 = 500_000_000_000_000_000;

pub fn perform_amm_action(amm: &mut Amm, action: AmmAction) {
    let verbose = env::var("RUST_FUZZ_VERBOSE").is_ok();
    if verbose {
        println!("Action: {:?}", action);
        println!("Pool: {:?}", amm);
    }
    match action {
        AmmAction::AddLiquidity(r) => {
            // generate a float between 0 and 1
            let pct = r as f64 / 255.;

            let max_pct_of_supply = 0.3;
            let base_supply_max =
                (TOTAL_BASE_SUPPLY.saturating_sub(amm.base_reserves) as f64) * max_pct_of_supply;
            let quote_supply_max =
                TOTAL_QUOTE_SUPPLY.saturating_sub(amm.quote_reserves) as f64 * max_pct_of_supply;

            let base_amount = ((amm.base_reserves as f64 * pct) as u64).min(base_supply_max as u64);
            let quote_amount =
                ((amm.quote_reserves as f64 * pct) as u64).min(quote_supply_max as u64);
            if verbose {
                println!(
                    "AddLiquidity: base_amount: {}, quote_amount: {}",
                    base_amount, quote_amount,
                );
            }
            match amm.mint(amm.get_slot(), base_amount, quote_amount, None) {
                Ok(_) => {}
                Err(PlasmaStateError::BelowMinimumLpSharesRequired) => {
                    {};
                }
                Err(e) => {
                    panic!("unexpected error: {}", e);
                }
            }
        }
        AmmAction::RemoveLiquidity(r) => {
            // generate a float between 0 and 0.5
            let pct = r as f64 / (2. * 255.0);
            let lp_shares = (amm.total_lp_shares as f64 * pct) as u64;
            if verbose {
                println!("RemoveLiquidity: lp_shares: {}", lp_shares);
            }
            match amm.burn(amm.get_slot(), lp_shares) {
                Ok(_) => {}
                Err(PlasmaStateError::BelowMinimumWithdrawaRequired) => {
                    {};
                }
                Err(_) => {
                    return;
                }
            }
        }
        AmmAction::BuyExactIn(r) => {
            let pct = (r as f64 + 1.) / (10. * 255.0);
            let quote_remaining = TOTAL_QUOTE_SUPPLY.saturating_sub(amm.quote_reserves);
            if quote_remaining == 0 {
                return;
            }
            let quote_amount = (pct * quote_remaining as f64) as u64;
            if verbose {
                println!("BuyExactIn: quote_amount: {}", quote_amount);
            }
            let pool_start = amm.clone();
            let res = match amm.buy_exact_in(amm.get_slot(), quote_amount) {
                Ok(res) => res,
                Err(PlasmaStateError::SwapExactInTooLarge)
                | Err(PlasmaStateError::SwapOutputGreaterThanOrEqualToReserves(_, _))
                | Err(PlasmaStateError::Overflow)
                | Err(PlasmaStateError::Underflow) => {
                    // Rollback
                    *amm = pool_start;
                    return;
                }
                Err(e) => {
                    panic!("unexpected error: {}", e);
                }
            };
            assert!(pool_start.base_reserves - res.base_amount_to_transfer == amm.base_reserves);
            assert_eq!(
                pool_start.quote_reserves + res.quote_amount_to_transfer - res.fee_in_quote,
                amm.quote_reserves
            );
            assert!(
                pool_start.cumulative_quote_lp_fees
                    + pool_start.cumulative_quote_protocol_fees
                    + res.fee_in_quote
                    == amm.cumulative_quote_lp_fees + amm.cumulative_quote_protocol_fees
            );

            let fee_ratio = res.fee_in_quote as f64 / (res.quote_amount_to_transfer as f64);
            if res.quote_amount_to_transfer > 1000000 {
                assert!(
                    (fee_ratio - (amm.fee_in_bps as f64 / 10000.)).abs() < 0.00001,
                    "{} {} {:?}",
                    fee_ratio,
                    amm.fee_in_bps,
                    res
                );
            }
        }
        AmmAction::SellExactIn(r) => {
            let pct = (r as f64 + 1.) / (10. * 255.0);
            let base_remaining = TOTAL_BASE_SUPPLY - amm.base_reserves;
            let base_amount = (pct * base_remaining as f64) as u64;
            if verbose {
                println!("SellExactIn: base_amount: {}", base_amount);
            }
            let pool_start = amm.clone();
            let res = match amm.sell_exact_in(amm.get_slot(), base_amount) {
                Ok(res) => res,
                Err(PlasmaStateError::SwapExactInTooLarge)
                | Err(PlasmaStateError::SwapOutputGreaterThanOrEqualToReserves(_, _))
                | Err(PlasmaStateError::Overflow)
                | Err(PlasmaStateError::Underflow) => {
                    // Rollback
                    *amm = pool_start;
                    return;
                }
                Err(e) => {
                    panic!("unexpected error: {}", e);
                }
            };
            assert_eq!(
                pool_start.base_reserves + res.base_amount_to_transfer,
                amm.base_reserves
            );
            assert_eq!(
                pool_start.quote_reserves - res.quote_amount_to_transfer - res.fee_in_quote,
                amm.quote_reserves
            );
            assert_eq!(
                pool_start.cumulative_quote_lp_fees
                    + pool_start.cumulative_quote_protocol_fees
                    + res.fee_in_quote,
                amm.cumulative_quote_lp_fees + amm.cumulative_quote_protocol_fees
            );

            let fee_ratio = res.fee_in_quote as f64
                / (res.quote_amount_to_transfer as f64 + res.fee_in_quote as f64);
            if res.quote_amount_to_transfer > 1000000 {
                assert!(
                    (fee_ratio - (amm.fee_in_bps as f64 / 10000.)).abs() < 0.00001,
                    "{} {} {:?}",
                    fee_ratio,
                    amm.fee_in_bps,
                    res
                );
            }
        }
        AmmAction::BuyExactOut(r) => {
            let pct = (r as f64 + 1.) / (10. * 255.0);
            let quote_remaining = amm.quote_reserves;
            let quote_amount = (pct * quote_remaining as f64) as u64;
            let pool_start = amm.clone();
            let Ok(simres) = amm.simulate_buy_exact_in(quote_amount) else {
                return;
            };
            let base_amount_out = simres.base_amount_to_transfer;
            if verbose {
                println!("Sim {:?}", simres);
                println!("BuyExactOut: base_amount: {}", base_amount_out);
            }
            let res = match amm.buy_exact_out(amm.get_slot(), base_amount_out) {
                Ok(res) => res,
                Err(PlasmaStateError::SwapExactOutTooLarge)
                | Err(PlasmaStateError::SwapOutputGreaterThanOrEqualToReserves(_, _))
                | Err(PlasmaStateError::Overflow)
                | Err(PlasmaStateError::Underflow) => {
                    // Rollback
                    *amm = pool_start;
                    return;
                }
                Err(e) => {
                    panic!("unexpected error: {}", e);
                }
            };
            assert!(
                pool_start.base_reserves - res.base_amount_to_transfer == amm.base_reserves,
                "base_reserves: {} + {} != {}",
                pool_start.base_reserves,
                res.base_amount_to_transfer,
                amm.base_reserves
            );
            assert!(
                pool_start.quote_reserves + (res.quote_amount_to_transfer - res.fee_in_quote)
                    == amm.quote_reserves
            );
            assert!(
                pool_start.cumulative_quote_lp_fees
                    + pool_start.cumulative_quote_protocol_fees
                    + res.fee_in_quote
                    == amm.cumulative_quote_lp_fees + amm.cumulative_quote_protocol_fees
            );

            assert!(simres.base_amount_to_transfer == res.base_amount_to_transfer);

            let fee_ratio = res.fee_in_quote as f64 / (res.quote_amount_to_transfer as f64);
            if res.quote_amount_to_transfer > 1000000 {
                assert!(
                    (fee_ratio - (amm.fee_in_bps as f64 / 10000.)).abs() < 0.00001,
                    "{} {} {:?}",
                    fee_ratio,
                    amm.fee_in_bps,
                    res
                );
            }
        }
        AmmAction::SellExactOut(r) => {
            let pct = (r as f64 + 1.) / (10. * 256.0);
            let base_remaining = TOTAL_BASE_SUPPLY - amm.base_reserves;
            let base_amount = (pct * base_remaining as f64) as u64;
            let pool_start = amm.clone();
            let Ok(simres) = amm.simulate_sell_exact_in(base_amount) else {
                return;
            };
            let quote_amount_out = simres.quote_amount_to_transfer;

            if quote_amount_out >= amm.quote_reserves {
                return;
            }
            if verbose {
                println!("SellExactOut: quote_amount: {}", quote_amount_out);
            }
            let res = match amm.sell_exact_out(amm.get_slot(), quote_amount_out) {
                Ok(res) => res,
                Err(PlasmaStateError::SwapExactOutTooLarge)
                | Err(PlasmaStateError::SwapOutputGreaterThanOrEqualToReserves(_, _))
                | Err(PlasmaStateError::Overflow)
                | Err(PlasmaStateError::Underflow) => {
                    // Rollback
                    *amm = pool_start;
                    return;
                }
                Err(e) => {
                    panic!("unexpected error: {}", e);
                }
            };
            assert!(pool_start.base_reserves + res.base_amount_to_transfer == amm.base_reserves);
            assert!(
                pool_start.quote_reserves - res.quote_amount_to_transfer - res.fee_in_quote
                    == amm.quote_reserves,
                "quote_reserves: {} - {} - {} != {}",
                pool_start.quote_reserves,
                res.quote_amount_to_transfer,
                res.fee_in_quote,
                amm.quote_reserves,
            );
            assert!(
                pool_start.cumulative_quote_lp_fees
                    + pool_start.cumulative_quote_protocol_fees
                    + res.fee_in_quote
                    == amm.cumulative_quote_lp_fees + amm.cumulative_quote_protocol_fees
            );
            assert_eq!(
                simres.quote_amount_to_transfer,
                res.quote_amount_to_transfer
            );

            let fee_ratio = res.fee_in_quote as f64
                / (res.quote_amount_to_transfer as f64 + res.fee_in_quote as f64);
            if res.quote_amount_to_transfer > 1000000 {
                assert!(
                    (fee_ratio - (amm.fee_in_bps as f64 / 10000.)).abs() < 0.00001,
                    "{} {} {:?}",
                    fee_ratio,
                    amm.fee_in_bps,
                    res
                );
            }
        }
        AmmAction::Tick => {
            if verbose {
                println!("Tick");
            }
            assert!(amm.maybe_update_snapshot(amm.get_slot() + 1));
        }
    }
}

pub fn perform_lp_action(amm: &mut Amm, lps: &mut [Option<LpPosition>], action: LpAction) {
    match action {
        LpAction::InitializeLpPosition(index) => {
            let lp_index = index % lps.len();
            let lp_position = &mut lps[lp_index];
            if let None = lp_position {
                let current_reward_factor = amm.reward_factor;
                *lp_position = Some(LpPosition::new_with_reward_factor_snapshot(
                    current_reward_factor,
                ));
            }
        }
        LpAction::AddLiquidity(r) => {
            let pct = r as f64 / 255.;
            let lp_index = r as usize % lps.len();

            // Map r to a supply ranging from 0.001 to 1.0
            let max_pct_of_supply = 0.001 + (r as f64 / 255.0) * 0.999;

            let base_supply_max =
                (TOTAL_BASE_SUPPLY.saturating_sub(amm.base_reserves) as f64) * max_pct_of_supply;
            let quote_supply_max =
                TOTAL_QUOTE_SUPPLY.saturating_sub(amm.quote_reserves) as f64 * max_pct_of_supply;

            let base_amount = ((amm.base_reserves as f64 * pct) as u64).min(base_supply_max as u64);
            let quote_amount =
                ((amm.quote_reserves as f64 * pct) as u64).min(quote_supply_max as u64);

            if let Some(lp_position) = &mut lps[lp_index] {
                match lp_position.add_liquidity(
                    amm.get_slot(),
                    amm,
                    base_amount,
                    quote_amount,
                    None,
                ) {
                    Ok(_) => {}
                    Err(PlasmaStateError::VestingPeriodNotOver) => {
                        // Check that a deposit already exists for this slot
                        let current_slot = amm.get_slot();
                        assert!(
                            lp_position.pending_shares_to_vest.deposit_slot + amm.lp_vesting_window
                                > current_slot
                        );
                    }
                    Err(PlasmaStateError::BelowMinimumLpSharesRequired) => {}
                    Err(e) => {
                        panic!("unexpected error: {}", e);
                    }
                }
            }
        }
        LpAction::RemoveLiquidity(r) => {
            let lp_index = r as usize % lps.len();
            let lp_position = &mut lps[lp_index];
            let pct = r as f64 / 255.;
            if let Some(lp_position) = lp_position {
                match lp_position.remove_liquidity(
                    amm.get_slot(),
                    amm,
                    (pct * lp_position.lp_shares as f64) as u64,
                ) {
                    Ok(_) => {}
                    Err(PlasmaStateError::BelowMinimumWithdrawaRequired) => {}
                    Err(e) => {
                        panic!("unexpected error: {}", e);
                    }
                }
            }
        }
        LpAction::CollectFees(index) => {
            let lp_index = index % lps.len();
            let lp_position = &mut lps[lp_index];
            if let Some(lp_position) = lp_position {
                match lp_position.collect_fees(amm.get_slot(), amm) {
                    Ok(_) => {}
                    Err(e) => {
                        panic!("unexpected error: {}", e);
                    }
                }
            }
        }
        LpAction::BuyExactIn(r) => {
            perform_amm_action(amm, AmmAction::BuyExactIn(r));
        }
        LpAction::SellExactIn(r) => {
            perform_amm_action(amm, AmmAction::SellExactIn(r));
        }
        LpAction::BuyExactOut(r) => {
            perform_amm_action(amm, AmmAction::BuyExactOut(r));
        }
        LpAction::SellExactOut(r) => {
            perform_amm_action(amm, AmmAction::SellExactOut(r));
        }
        LpAction::Tick => {
            perform_amm_action(amm, AmmAction::Tick);
        }
    }
}
