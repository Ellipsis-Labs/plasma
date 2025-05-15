import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface WithdrawProtocolFeesAccounts {
  /** Plasma program */
  plasmaProgram: PublicKey
  /** Plasma log authority */
  logAuthority: PublicKey
  /** This account holds the pool state */
  pool: PublicKey
  /** Recipient of protocol fees */
  protocolFeeRecipient: PublicKey
  /** Trader quote token account */
  quoteAccount: PublicKey
  /** Quote vault PDA, seeds are [b'vault', pool_address, quote_mint_address] */
  quoteVault: PublicKey
  /** Token program */
  tokenProgram: PublicKey
}

export function WithdrawProtocolFees(
  accounts: WithdrawProtocolFeesAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.plasmaProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.logAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.pool, isSigner: false, isWritable: true },
    {
      pubkey: accounts.protocolFeeRecipient,
      isSigner: true,
      isWritable: false,
    },
    { pubkey: accounts.quoteAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.quoteVault, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([7])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
