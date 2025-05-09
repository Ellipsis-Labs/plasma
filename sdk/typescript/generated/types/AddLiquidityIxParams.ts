import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface AddLiquidityIxParamsFields {
  desiredBaseAmountIn: BN
  desiredQuoteAmountIn: BN
  initialLpShares: BN | null
}

export interface AddLiquidityIxParamsJSON {
  desiredBaseAmountIn: string
  desiredQuoteAmountIn: string
  initialLpShares: string | null
}

export class AddLiquidityIxParams {
  readonly desiredBaseAmountIn: BN
  readonly desiredQuoteAmountIn: BN
  readonly initialLpShares: BN | null

  constructor(fields: AddLiquidityIxParamsFields) {
    this.desiredBaseAmountIn = fields.desiredBaseAmountIn
    this.desiredQuoteAmountIn = fields.desiredQuoteAmountIn
    this.initialLpShares = fields.initialLpShares
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("desiredBaseAmountIn"),
        borsh.u64("desiredQuoteAmountIn"),
        borsh.option(borsh.u64(), "initialLpShares"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new AddLiquidityIxParams({
      desiredBaseAmountIn: obj.desiredBaseAmountIn,
      desiredQuoteAmountIn: obj.desiredQuoteAmountIn,
      initialLpShares: obj.initialLpShares,
    })
  }

  static toEncodable(fields: AddLiquidityIxParamsFields) {
    return {
      desiredBaseAmountIn: fields.desiredBaseAmountIn,
      desiredQuoteAmountIn: fields.desiredQuoteAmountIn,
      initialLpShares: fields.initialLpShares,
    }
  }

  toJSON(): AddLiquidityIxParamsJSON {
    return {
      desiredBaseAmountIn: this.desiredBaseAmountIn.toString(),
      desiredQuoteAmountIn: this.desiredQuoteAmountIn.toString(),
      initialLpShares:
        (this.initialLpShares && this.initialLpShares.toString()) || null,
    }
  }

  static fromJSON(obj: AddLiquidityIxParamsJSON): AddLiquidityIxParams {
    return new AddLiquidityIxParams({
      desiredBaseAmountIn: new BN(obj.desiredBaseAmountIn),
      desiredQuoteAmountIn: new BN(obj.desiredQuoteAmountIn),
      initialLpShares:
        (obj.initialLpShares && new BN(obj.initialLpShares)) || null,
    })
  }

  toEncodable() {
    return AddLiquidityIxParams.toEncodable(this)
  }
}
