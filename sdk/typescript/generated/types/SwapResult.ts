import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface SwapResultFields {
  side: types.SideKind
  baseMatched: BN
  quoteMatched: BN
  baseMatchedAsLimitOrder: BN
  quoteMatchedAsLimitOrder: BN
  baseMatchedAsSwap: BN
  quoteMatchedAsSwap: BN
  feeInQuote: BN
}

export interface SwapResultJSON {
  side: types.SideJSON
  baseMatched: string
  quoteMatched: string
  baseMatchedAsLimitOrder: string
  quoteMatchedAsLimitOrder: string
  baseMatchedAsSwap: string
  quoteMatchedAsSwap: string
  feeInQuote: string
}

export class SwapResult {
  readonly side: types.SideKind
  readonly baseMatched: BN
  readonly quoteMatched: BN
  readonly baseMatchedAsLimitOrder: BN
  readonly quoteMatchedAsLimitOrder: BN
  readonly baseMatchedAsSwap: BN
  readonly quoteMatchedAsSwap: BN
  readonly feeInQuote: BN

  constructor(fields: SwapResultFields) {
    this.side = fields.side
    this.baseMatched = fields.baseMatched
    this.quoteMatched = fields.quoteMatched
    this.baseMatchedAsLimitOrder = fields.baseMatchedAsLimitOrder
    this.quoteMatchedAsLimitOrder = fields.quoteMatchedAsLimitOrder
    this.baseMatchedAsSwap = fields.baseMatchedAsSwap
    this.quoteMatchedAsSwap = fields.quoteMatchedAsSwap
    this.feeInQuote = fields.feeInQuote
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        types.Side.layout("side"),
        borsh.u64("baseMatched"),
        borsh.u64("quoteMatched"),
        borsh.u64("baseMatchedAsLimitOrder"),
        borsh.u64("quoteMatchedAsLimitOrder"),
        borsh.u64("baseMatchedAsSwap"),
        borsh.u64("quoteMatchedAsSwap"),
        borsh.u64("feeInQuote"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new SwapResult({
      side: types.Side.fromDecoded(obj.side),
      baseMatched: obj.baseMatched,
      quoteMatched: obj.quoteMatched,
      baseMatchedAsLimitOrder: obj.baseMatchedAsLimitOrder,
      quoteMatchedAsLimitOrder: obj.quoteMatchedAsLimitOrder,
      baseMatchedAsSwap: obj.baseMatchedAsSwap,
      quoteMatchedAsSwap: obj.quoteMatchedAsSwap,
      feeInQuote: obj.feeInQuote,
    })
  }

  static toEncodable(fields: SwapResultFields) {
    return {
      side: fields.side.toEncodable(),
      baseMatched: fields.baseMatched,
      quoteMatched: fields.quoteMatched,
      baseMatchedAsLimitOrder: fields.baseMatchedAsLimitOrder,
      quoteMatchedAsLimitOrder: fields.quoteMatchedAsLimitOrder,
      baseMatchedAsSwap: fields.baseMatchedAsSwap,
      quoteMatchedAsSwap: fields.quoteMatchedAsSwap,
      feeInQuote: fields.feeInQuote,
    }
  }

  toJSON(): SwapResultJSON {
    return {
      side: this.side.toJSON(),
      baseMatched: this.baseMatched.toString(),
      quoteMatched: this.quoteMatched.toString(),
      baseMatchedAsLimitOrder: this.baseMatchedAsLimitOrder.toString(),
      quoteMatchedAsLimitOrder: this.quoteMatchedAsLimitOrder.toString(),
      baseMatchedAsSwap: this.baseMatchedAsSwap.toString(),
      quoteMatchedAsSwap: this.quoteMatchedAsSwap.toString(),
      feeInQuote: this.feeInQuote.toString(),
    }
  }

  static fromJSON(obj: SwapResultJSON): SwapResult {
    return new SwapResult({
      side: types.Side.fromJSON(obj.side),
      baseMatched: new BN(obj.baseMatched),
      quoteMatched: new BN(obj.quoteMatched),
      baseMatchedAsLimitOrder: new BN(obj.baseMatchedAsLimitOrder),
      quoteMatchedAsLimitOrder: new BN(obj.quoteMatchedAsLimitOrder),
      baseMatchedAsSwap: new BN(obj.baseMatchedAsSwap),
      quoteMatchedAsSwap: new BN(obj.quoteMatchedAsSwap),
      feeInQuote: new BN(obj.feeInQuote),
    })
  }

  toEncodable() {
    return SwapResult.toEncodable(this)
  }
}
