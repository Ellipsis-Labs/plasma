import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface RenounceLiquidityArgs {
  params: types.RenounceLiquidityIxParamsFields
}

export interface RenounceLiquidityAccounts {
  /** Plasma program */
  plasmaProgram: PublicKey
  /** Plasma log authority */
  logAuthority: PublicKey
  /** This account holds the pool state */
  pool: PublicKey
  trader: PublicKey
  lpPosition: PublicKey
}

export const layout = borsh.struct([
  types.RenounceLiquidityIxParams.layout("params"),
])

export function RenounceLiquidity(
  args: RenounceLiquidityArgs,
  accounts: RenounceLiquidityAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.plasmaProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.logAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.pool, isSigner: false, isWritable: true },
    { pubkey: accounts.trader, isSigner: true, isWritable: false },
    { pubkey: accounts.lpPosition, isSigner: false, isWritable: true },
  ]
  const identifier = Buffer.from([3])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      params: types.RenounceLiquidityIxParams.toEncodable(args.params),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 1 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
