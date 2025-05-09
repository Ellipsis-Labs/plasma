import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface InitializeLpPositionAccounts {
  /** Plasma program */
  plasmaProgram: PublicKey
  /** Plasma log authority */
  logAuthority: PublicKey
  /** This account holds the pool state */
  pool: PublicKey
  payer: PublicKey
  lpPositionOwner: PublicKey
  lpPosition: PublicKey
  /** System program */
  systemProgram: PublicKey
}

export function InitializeLpPosition(
  accounts: InitializeLpPositionAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.plasmaProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.logAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.pool, isSigner: false, isWritable: true },
    { pubkey: accounts.payer, isSigner: true, isWritable: true },
    { pubkey: accounts.lpPositionOwner, isSigner: false, isWritable: false },
    { pubkey: accounts.lpPosition, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([5])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
