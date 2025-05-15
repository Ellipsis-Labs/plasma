use borsh::{BorshDeserialize, BorshSerialize};
use bytemuck::{Pod, Zeroable};
use std::{
    fmt::{Debug, Display, Formatter},
    ops::{Add, AddAssign, Mul, Sub},
};

type FixedI80F48 = fixed::types::I80F48;

#[repr(C)]
#[derive(Clone, Copy, Zeroable, Pod, BorshDeserialize, BorshSerialize)]
pub struct I80F48 {
    inner: i128,
}

impl I80F48 {
    pub const ZERO: Self = Self { inner: 0 };

    pub fn from_num(value: u64) -> Self {
        let value = FixedI80F48::from_num(value);
        Self {
            inner: value.to_bits(),
        }
    }

    pub fn from_fraction(numerator: u64, denominator: u64) -> Self {
        let value = FixedI80F48::from_num(numerator) / FixedI80F48::from_num(denominator);
        Self {
            inner: value.to_bits(),
        }
    }

    pub fn floor(&self) -> u64 {
        let value = FixedI80F48::from_bits(self.inner);
        value.floor().to_num()
    }

    pub fn to_bits(&self) -> i128 {
        self.inner
    }

    pub fn from_bits(bits: i128) -> Self {
        Self { inner: bits }
    }
}

impl PartialEq for I80F48 {
    fn eq(&self, rhs: &Self) -> bool {
        let lhs = FixedI80F48::from_bits(self.inner);
        let rhs = FixedI80F48::from_bits(rhs.inner);
        lhs == rhs
    }
}

impl PartialOrd for I80F48 {
    fn partial_cmp(&self, rhs: &Self) -> Option<std::cmp::Ordering> {
        let lhs = FixedI80F48::from_bits(self.inner);
        let rhs = FixedI80F48::from_bits(rhs.inner);
        lhs.partial_cmp(&rhs)
    }
}

impl AddAssign for I80F48 {
    fn add_assign(&mut self, rhs: Self) {
        *self = *self + rhs;
    }
}

impl Add for I80F48 {
    type Output = Self;
    fn add(self, rhs: Self) -> Self {
        let lhs = FixedI80F48::from_bits(self.inner);
        let rhs = FixedI80F48::from_bits(rhs.inner);
        let sum = lhs + rhs;
        Self {
            inner: sum.to_bits(),
        }
    }
}

impl Sub for I80F48 {
    type Output = Self;
    fn sub(self, rhs: Self) -> Self {
        let lhs = FixedI80F48::from_bits(self.inner);
        let rhs = FixedI80F48::from_bits(rhs.inner);
        let diff = lhs - rhs;
        Self {
            inner: diff.to_bits(),
        }
    }
}

impl Mul for I80F48 {
    type Output = Self;
    fn mul(self, rhs: Self) -> Self {
        let lhs = FixedI80F48::from_bits(self.inner);
        let rhs = FixedI80F48::from_bits(rhs.inner);
        let product = lhs * rhs;
        Self {
            inner: product.to_bits(),
        }
    }
}

impl Display for I80F48 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        let value = FixedI80F48::from_bits(self.inner);
        write!(f, "{}", value)
    }
}

impl Debug for I80F48 {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        let value = FixedI80F48::from_bits(self.inner);
        write!(f, "{:?}", value)
    }
}

#[cfg(test)]
mod tests {
    use rand::{rngs::StdRng, Rng, SeedableRng};

    #[test]
    fn seeded_fixed_fuzz_test() {
        use crate::fixed::I80F48;
        use fixed::types::I80F48 as FixedI80F48;

        let mut r = StdRng::seed_from_u64(42);

        for _ in 0..1000 {
            let a = r.gen::<i64>() as i128;
            let b = r.gen::<i64>() as i128;
            for &(a, b) in &[(a, b), (b, a)] {
                let af_lib = FixedI80F48::from_bits(a);
                let bf_lib = FixedI80F48::from_bits(b);
                let af = I80F48::from_bits(a);
                let bf = I80F48::from_bits(b);

                // Test addition matches lib
                assert_eq!((af + bf).to_bits(), (af_lib + bf_lib).to_bits());
                // Test substraction matches lib
                assert_eq!((af - bf).to_bits(), (af_lib - bf_lib).to_bits());
                // Test multiplication matches lib
                assert_eq!((af * bf).to_bits(), (af_lib * bf_lib).to_bits());

                let mut c_lib = FixedI80F48::ZERO;
                let mut c = I80F48::ZERO;

                // Test add assign
                c_lib += af_lib;
                c += af;
                assert_eq!(c.to_bits(), c_lib.to_bits());

                // Test PartialEq
                assert_eq!(c, af);
                assert_eq!(c_lib, af_lib);
            }
        }
    }

    #[test]
    fn test_floor() {
        use crate::fixed::I80F48;
        let a = I80F48::from_fraction(1, 2);
        assert_eq!(a.floor(), 0);
        let b = I80F48::from_fraction(3, 2);
        assert_eq!(b.floor(), 1);
        let c = I80F48::from_fraction(5, 2);
        assert_eq!(c.floor(), 2);

        assert!(a < b);
        assert!(c > b);
    }
}
