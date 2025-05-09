import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface SwapArgs {
  params: types.SwapIxParamsFields
}

export interface SwapAccounts {
  /** Plasma program */
  plasmaProgram: PublicKey
  /** Plasma log authority */
  logAuthority: PublicKey
  /** This account holds the pool state */
  pool: PublicKey
  trader: PublicKey
  /** Trader base token account */
  baseAccount: PublicKey
  /** Trader quote token account */
  quoteAccount: PublicKey
  /** Base vault PDA, seeds are [b'vault', pool_address, base_mint_address] */
  baseVault: PublicKey
  /** Quote vault PDA, seeds are [b'vault', pool_address, quote_mint_address] */
  quoteVault: PublicKey
  /** Token program */
  tokenProgram: PublicKey
}

export const layout = borsh.struct([types.SwapIxParams.layout("params")])

export function Swap(
  args: SwapArgs,
  accounts: SwapAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.plasmaProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.logAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.pool, isSigner: false, isWritable: true },
    { pubkey: accounts.trader, isSigner: true, isWritable: false },
    { pubkey: accounts.baseAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.quoteAccount, isSigner: false, isWritable: true },
    { pubkey: accounts.baseVault, isSigner: false, isWritable: true },
    { pubkey: accounts.quoteVault, isSigner: false, isWritable: true },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([0])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      params: types.SwapIxParams.toEncodable(args.params),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 1 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
