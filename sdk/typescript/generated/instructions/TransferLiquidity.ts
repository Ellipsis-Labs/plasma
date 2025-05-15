import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface TransferLiquidityAccounts {
  /** Plasma program */
  plasmaProgram: PublicKey
  /** Plasma log authority */
  logAuthority: PublicKey
  /** This account holds the pool state */
  pool: PublicKey
  trader: PublicKey
  srcLpPosition: PublicKey
  dstLpPosition: PublicKey
}

export function TransferLiquidity(
  accounts: TransferLiquidityAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.plasmaProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.logAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.pool, isSigner: false, isWritable: true },
    { pubkey: accounts.trader, isSigner: true, isWritable: false },
    { pubkey: accounts.srcLpPosition, isSigner: false, isWritable: true },
    { pubkey: accounts.dstLpPosition, isSigner: false, isWritable: true },
  ]
  const identifier = Buffer.from([9])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
