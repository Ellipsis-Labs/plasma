use std::fmt::Display;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PlasmaError {
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

impl Display for PlasmaError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PlasmaError::InvariantViolation(k_start, k_end) => {
                write!(
                    f,
                    "InvariantViolation: k_end {} is less than k_start {} ",
                    k_end, k_start
                )
            }
            PlasmaError::MismatchedFees(expected, actual) => {
                write!(
                    f,
                    "MismatchedFees: Expected {} but got {}",
                    expected, actual
                )
            }
            PlasmaError::UninitializedPool => write!(f, "Pool is uninitialized"),
            PlasmaError::SwapAmountMismatch => write!(f, "SwapAmountMismatch"),
            PlasmaError::Overflow => write!(f, "Calculation overflowed"),
            PlasmaError::Underflow => write!(f, "Difference underflowed"),
            PlasmaError::UnexpectedArgument => write!(f, "Unexpected argument"),
            PlasmaError::MissingExpectedArgument => write!(f, "Missing expected argument"),
            PlasmaError::BelowMinimumLpSharesRequired => {
                write!(f, "Must mint at least 1 LP share")
            }
            PlasmaError::BelowMinimumWithdrawaRequired {
                quote_amount_to_withdraw,
                base_amount_to_withdraw,
            } => write!(
                f,
                "Must withdraw at least 1 base token (actual: {} base) and 1 quote token (actual: {} quote)",
                base_amount_to_withdraw, quote_amount_to_withdraw
            ),
            PlasmaError::VestingPeriodNotOver => write!(f, "Previous vesting period not over"),
            PlasmaError::IncorrectProtocolFeeRecipient => {
                write!(
                    f,
                    "Given protocol fee recipient is not one of the protocol fee recipients"
                )
            }
            PlasmaError::TooManyShares => write!(f, "Too many shares supplied"),
            PlasmaError::SwapExactOutTooLarge => write!(f, "SwapExactOut amount too large"),
            PlasmaError::SwapExactInTooLarge => write!(f, "SwapExactIn amount too large"),
            PlasmaError::SwapOutputGreaterThanOrEqualToReserves(input, reserves) => {
                write!(
                    f,
                    "Swap output {} is greater than or equal to reserves {}",
                    input, reserves
                )
            }
        }
    }
}
