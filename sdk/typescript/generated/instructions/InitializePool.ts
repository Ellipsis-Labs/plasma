import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface InitializePoolArgs {
  params: types.InitializePoolIxParamsFields
}

export interface InitializePoolAccounts {
  /** Plasma program */
  plasmaProgram: PublicKey
  /** Plasma log authority */
  logAuthority: PublicKey
  /** This account holds the pool state */
  pool: PublicKey
  /** The pool_creator account must sign for the creation of new vaults */
  poolCreator: PublicKey
  /** Base mint account */
  baseMint: PublicKey
  /** Quote mint account */
  quoteMint: PublicKey
  /** Base vault PDA, seeds are [b'vault', pool_address, base_mint_address] */
  baseVault: PublicKey
  /** Quote vault PDA, seeds are [b'vault', pool_address, quote_mint_address] */
  quoteVault: PublicKey
  /** System program */
  systemProgram: PublicKey
  /** Token program */
  tokenProgram: PublicKey
}

export const layout = borsh.struct([
  types.InitializePoolIxParams.layout("params"),
])

export function InitializePool(
  args: InitializePoolArgs,
  accounts: InitializePoolAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.plasmaProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.logAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.pool, isSigner: false, isWritable: true },
    { pubkey: accounts.poolCreator, isSigner: true, isWritable: true },
    { pubkey: accounts.baseMint, isSigner: false, isWritable: false },
    { pubkey: accounts.quoteMint, isSigner: false, isWritable: false },
    { pubkey: accounts.baseVault, isSigner: false, isWritable: true },
    { pubkey: accounts.quoteVault, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([6])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      params: types.InitializePoolIxParams.toEncodable(args.params),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 1 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
