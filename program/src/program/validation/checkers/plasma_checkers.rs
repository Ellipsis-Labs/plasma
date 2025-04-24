use crate::{
    assert_with_msg,
    program::{
        accounts::{
            LpPositionAccount, PoolHeader, LP_POSITION_ACCOUNT_DISCRIMINATOR,
            POOL_ACCOUNT_DISCRIMINATOR,
        },
        validation::loaders::get_lp_position_address,
    },
};
use bytemuck::try_from_bytes;
use solana_program::{account_info::AccountInfo, program_error::ProgramError, pubkey::Pubkey};
use std::{cell::Ref, mem::size_of, ops::Deref};

#[derive(Clone)]
pub(crate) struct PoolAccountInfo<'a, 'info> {
    pub(crate) info: &'a AccountInfo<'info>,
}

impl<'a, 'info> PoolAccountInfo<'a, 'info> {
    #[inline(always)]
    fn _new_unchecked(
        info: &'a AccountInfo<'info>,
    ) -> Result<PoolAccountInfo<'a, 'info>, ProgramError> {
        assert_with_msg(
            info.owner == &crate::ID,
            ProgramError::IllegalOwner,
            "Pool must be owned by the Plasma program",
        )?;
        Ok(Self { info })
    }

    pub(crate) fn new(
        info: &'a AccountInfo<'info>,
    ) -> Result<PoolAccountInfo<'a, 'info>, ProgramError> {
        let pool_info = Self::_new_unchecked(info)?;
        {
            let header = pool_info.get_header()?;
            assert_with_msg(
                header.discriminator == POOL_ACCOUNT_DISCRIMINATOR,
                ProgramError::InvalidAccountData,
                "Invalid pool discriminant",
            )?;
        }
        Ok(pool_info)
    }

    pub(crate) fn new_init(
        info: &'a AccountInfo<'info>,
    ) -> Result<PoolAccountInfo<'a, 'info>, ProgramError> {
        let pool_bytes = info.try_borrow_data()?;
        let (header_bytes, _) = pool_bytes.split_at(size_of::<PoolHeader>());
        let header = try_from_bytes::<PoolHeader>(header_bytes)
            .map_err(|_| ProgramError::InvalidAccountData)?;
        assert_with_msg(
            info.owner == &crate::ID,
            ProgramError::IllegalOwner,
            "Pool must be owned by the Plasma program",
        )?;
        // On initialization, the discriminant is not set yet.
        assert_with_msg(
            u64::from_le_bytes(header.discriminator) == 0,
            ProgramError::InvalidAccountData,
            "Expected uninitialized pool with discriminant 0",
        )?;
        assert_with_msg(
            header.sequence_number == 0,
            ProgramError::InvalidAccountData,
            "PoolStatus must be uninitialized (sequence_number = 0)",
        )?;
        Ok(Self { info })
    }

    pub(crate) fn get_header(&self) -> Result<Ref<'_, PoolHeader>, ProgramError> {
        let data = self.info.try_borrow_data()?;
        Ok(Ref::map(data, |data| {
            return try_from_bytes::<PoolHeader>(&data[..size_of::<PoolHeader>()]).unwrap();
        }))
    }
}

impl<'a, 'info> AsRef<AccountInfo<'info>> for PoolAccountInfo<'a, 'info> {
    fn as_ref(&self) -> &AccountInfo<'info> {
        self.info
    }
}

impl<'a, 'info> Deref for PoolAccountInfo<'a, 'info> {
    type Target = AccountInfo<'info>;

    fn deref(&self) -> &Self::Target {
        self.info
    }
}

#[derive(Clone)]
pub(crate) struct LpPositionAccountInfo<'a, 'info> {
    pub(crate) info: &'a AccountInfo<'info>,
}

impl<'a, 'info> LpPositionAccountInfo<'a, 'info> {
    pub(crate) fn new_from_pool(
        info: &'a AccountInfo<'info>,
        pool: &Pubkey,
    ) -> Result<LpPositionAccountInfo<'a, 'info>, ProgramError> {
        assert_with_msg(
            info.owner == &crate::ID,
            ProgramError::IllegalOwner,
            "LP position account must be owned by the Plasma program",
        )?;
        let lp_position_bytes = info.try_borrow_data()?;
        let lp_position = try_from_bytes::<LpPositionAccount>(&lp_position_bytes)
            .map_err(|_| ProgramError::InvalidAccountData)?;
        assert_with_msg(
            lp_position.discriminator == LP_POSITION_ACCOUNT_DISCRIMINATOR,
            ProgramError::InvalidAccountData,
            "Invalid discriminant for seat",
        )?;
        assert_with_msg(
            &lp_position.pool == pool,
            ProgramError::InvalidAccountData,
            "Invalid pool for LP position",
        )?;
        Ok(Self { info })
    }

    pub(crate) fn new(
        info: &'a AccountInfo<'info>,
        pool: &Pubkey,
        trader: &Pubkey,
    ) -> Result<LpPositionAccountInfo<'a, 'info>, ProgramError> {
        let (lp_position_address, _) = get_lp_position_address(pool, trader);
        assert_with_msg(
            info.owner == &crate::ID,
            ProgramError::IllegalOwner,
            "LP position account must be owned by the Plasma program",
        )?;
        assert_with_msg(
            &lp_position_address == info.key,
            ProgramError::InvalidInstructionData,
            "Invalid address for LP position",
        )?;
        let lp_position_bytes = info.try_borrow_data()?;
        let lp_position = try_from_bytes::<LpPositionAccount>(&lp_position_bytes)
            .map_err(|_| ProgramError::InvalidAccountData)?;
        assert_with_msg(
            lp_position.discriminator == LP_POSITION_ACCOUNT_DISCRIMINATOR,
            ProgramError::InvalidAccountData,
            "Invalid discriminant for seat",
        )?;
        assert_with_msg(
            &lp_position.authority == trader,
            ProgramError::InvalidAccountData,
            "Invalid authority for LP position",
        )?;
        assert_with_msg(
            &lp_position.pool == pool,
            ProgramError::InvalidAccountData,
            "Invalid pool for LP position",
        )?;
        Ok(Self { info })
    }
}

impl<'a, 'info> AsRef<AccountInfo<'info>> for LpPositionAccountInfo<'a, 'info> {
    fn as_ref(&self) -> &AccountInfo<'info> {
        self.info
    }
}

impl<'a, 'info> Deref for LpPositionAccountInfo<'a, 'info> {
    type Target = AccountInfo<'info>;

    fn deref(&self) -> &Self::Target {
        self.info
    }
}
