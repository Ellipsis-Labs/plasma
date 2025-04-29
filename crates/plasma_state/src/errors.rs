use std::fmt::Display;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PlasmaStateError {
    InvariantViolation(u128, u128),
    MismatchedFees(u128, u128),
    UninitializedPool,
    SwapAmountMismatch,
    Overflow,
    Underflow,
    UnexpectedArgument,
    MissingExpectedArgument,
    BelowMinimumLpSharesRequired,
    BelowMinimumWithdrawaRequired {
        quote_amount_to_withdraw: u64,
        base_amount_to_withdraw: u64,
    },
    VestingPeriodNotOver,
    IncorrectProtocolFeeRecipient,
    TooManyShares,
    SwapExactOutTooLarge,
    SwapExactInTooLarge,
    SwapOutputGreaterThanOrEqualToReserves(u128, u128),
}

impl Display for PlasmaStateError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PlasmaStateError::InvariantViolation(k_start, k_end) => {
                write!(
                    f,
                    "InvariantViolation: k_end {} is less than k_start {} ",
                    k_end, k_start
                )
            }
            PlasmaStateError::MismatchedFees(expected, actual) => {
                write!(
                    f,
                    "MismatchedFees: Expected {} but got {}",
                    expected, actual
                )
            }
            PlasmaStateError::UninitializedPool => write!(f, "Pool is uninitialized"),
            PlasmaStateError::SwapAmountMismatch => write!(f, "SwapAmountMismatch"),
            PlasmaStateError::Overflow => write!(f, "Calculation overflowed"),
            PlasmaStateError::Underflow => write!(f, "Difference underflowed"),
            PlasmaStateError::UnexpectedArgument => write!(f, "Unexpected argument"),
            PlasmaStateError::MissingExpectedArgument => write!(f, "Missing expected argument"),
            PlasmaStateError::BelowMinimumLpSharesRequired => {
                write!(f, "Must mint at least 1 LP share")
            }
            PlasmaStateError::BelowMinimumWithdrawaRequired {
                quote_amount_to_withdraw,
                base_amount_to_withdraw,
            } => write!(
                f,
                "Must withdraw at least 1 base token (actual: {} base) and 1 quote token (actual: {} quote)",
                base_amount_to_withdraw, quote_amount_to_withdraw
            ),
            PlasmaStateError::VestingPeriodNotOver => write!(f, "Previous vesting period not over"),
            PlasmaStateError::IncorrectProtocolFeeRecipient => {
                write!(
                    f,
                    "Given protocol fee recipient is not one of the protocol fee recipients"
                )
            }
            PlasmaStateError::TooManyShares => write!(f, "Too many shares supplied"),
            PlasmaStateError::SwapExactOutTooLarge => write!(f, "SwapExactOut amount too large"),
            PlasmaStateError::SwapExactInTooLarge => write!(f, "SwapExactIn amount too large"),
            PlasmaStateError::SwapOutputGreaterThanOrEqualToReserves(input, reserves) => {
                write!(
                    f,
                    "Swap output {} is greater than or equal to reserves {}",
                    input, reserves
                )
            }
        }
    }
}
