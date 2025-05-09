import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface TokenParamsFields {
  decimals: number
  vaultBump: number
  mintKey: PublicKey
  vaultKey: PublicKey
}

export interface TokenParamsJSON {
  decimals: number
  vaultBump: number
  mintKey: string
  vaultKey: string
}

export class TokenParams {
  readonly decimals: number
  readonly vaultBump: number
  readonly mintKey: PublicKey
  readonly vaultKey: PublicKey

  constructor(fields: TokenParamsFields) {
    this.decimals = fields.decimals
    this.vaultBump = fields.vaultBump
    this.mintKey = fields.mintKey
    this.vaultKey = fields.vaultKey
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u32("decimals"),
        borsh.u32("vaultBump"),
        borsh.publicKey("mintKey"),
        borsh.publicKey("vaultKey"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new TokenParams({
      decimals: obj.decimals,
      vaultBump: obj.vaultBump,
      mintKey: obj.mintKey,
      vaultKey: obj.vaultKey,
    })
  }

  static toEncodable(fields: TokenParamsFields) {
    return {
      decimals: fields.decimals,
      vaultBump: fields.vaultBump,
      mintKey: fields.mintKey,
      vaultKey: fields.vaultKey,
    }
  }

  toJSON(): TokenParamsJSON {
    return {
      decimals: this.decimals,
      vaultBump: this.vaultBump,
      mintKey: this.mintKey.toString(),
      vaultKey: this.vaultKey.toString(),
    }
  }

  static fromJSON(obj: TokenParamsJSON): TokenParams {
    return new TokenParams({
      decimals: obj.decimals,
      vaultBump: obj.vaultBump,
      mintKey: new PublicKey(obj.mintKey),
      vaultKey: new PublicKey(obj.vaultKey),
    })
  }

  toEncodable() {
    return TokenParams.toEncodable(this)
  }
}
