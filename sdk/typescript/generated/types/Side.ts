import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface BuyJSON {
  kind: "Buy"
}

export class Buy {
  static readonly discriminator = 0
  static readonly kind = "Buy"
  readonly discriminator = 0
  readonly kind = "Buy"

  toJSON(): BuyJSON {
    return {
      kind: "Buy",
    }
  }

  toEncodable() {
    return {
      Buy: {},
    }
  }
}

export interface SellJSON {
  kind: "Sell"
}

export class Sell {
  static readonly discriminator = 1
  static readonly kind = "Sell"
  readonly discriminator = 1
  readonly kind = "Sell"

  toJSON(): SellJSON {
    return {
      kind: "Sell",
    }
  }

  toEncodable() {
    return {
      Sell: {},
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.SideKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("Buy" in obj) {
    return new Buy()
  }
  if ("Sell" in obj) {
    return new Sell()
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(obj: types.SideJSON): types.SideKind {
  switch (obj.kind) {
    case "Buy": {
      return new Buy()
    }
    case "Sell": {
      return new Sell()
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([], "Buy"),
    borsh.struct([], "Sell"),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
