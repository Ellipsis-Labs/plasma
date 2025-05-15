import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export type ExactInFields = {
  amountIn: BN
  minAmountOut: BN
}
export type ExactInValue = {
  amountIn: BN
  minAmountOut: BN
}

export interface ExactInJSON {
  kind: "ExactIn"
  value: {
    amountIn: string
    minAmountOut: string
  }
}

export class ExactIn {
  static readonly discriminator = 0
  static readonly kind = "ExactIn"
  readonly discriminator = 0
  readonly kind = "ExactIn"
  readonly value: ExactInValue

  constructor(value: ExactInFields) {
    this.value = {
      amountIn: value.amountIn,
      minAmountOut: value.minAmountOut,
    }
  }

  toJSON(): ExactInJSON {
    return {
      kind: "ExactIn",
      value: {
        amountIn: this.value.amountIn.toString(),
        minAmountOut: this.value.minAmountOut.toString(),
      },
    }
  }

  toEncodable() {
    return {
      ExactIn: {
        amount_in: this.value.amountIn,
        min_amount_out: this.value.minAmountOut,
      },
    }
  }
}

export type ExactOutFields = {
  amountOut: BN
  maxAmountIn: BN
}
export type ExactOutValue = {
  amountOut: BN
  maxAmountIn: BN
}

export interface ExactOutJSON {
  kind: "ExactOut"
  value: {
    amountOut: string
    maxAmountIn: string
  }
}

export class ExactOut {
  static readonly discriminator = 1
  static readonly kind = "ExactOut"
  readonly discriminator = 1
  readonly kind = "ExactOut"
  readonly value: ExactOutValue

  constructor(value: ExactOutFields) {
    this.value = {
      amountOut: value.amountOut,
      maxAmountIn: value.maxAmountIn,
    }
  }

  toJSON(): ExactOutJSON {
    return {
      kind: "ExactOut",
      value: {
        amountOut: this.value.amountOut.toString(),
        maxAmountIn: this.value.maxAmountIn.toString(),
      },
    }
  }

  toEncodable() {
    return {
      ExactOut: {
        amount_out: this.value.amountOut,
        max_amount_in: this.value.maxAmountIn,
      },
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.SwapTypeKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("ExactIn" in obj) {
    const val = obj["ExactIn"]
    return new ExactIn({
      amountIn: val["amount_in"],
      minAmountOut: val["min_amount_out"],
    })
  }
  if ("ExactOut" in obj) {
    const val = obj["ExactOut"]
    return new ExactOut({
      amountOut: val["amount_out"],
      maxAmountIn: val["max_amount_in"],
    })
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(obj: types.SwapTypeJSON): types.SwapTypeKind {
  switch (obj.kind) {
    case "ExactIn": {
      return new ExactIn({
        amountIn: new BN(obj.value.amountIn),
        minAmountOut: new BN(obj.value.minAmountOut),
      })
    }
    case "ExactOut": {
      return new ExactOut({
        amountOut: new BN(obj.value.amountOut),
        maxAmountIn: new BN(obj.value.maxAmountIn),
      })
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct(
      [borsh.u64("amount_in"), borsh.u64("min_amount_out")],
      "ExactIn"
    ),
    borsh.struct(
      [borsh.u64("amount_out"), borsh.u64("max_amount_in")],
      "ExactOut"
    ),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
