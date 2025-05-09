import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface SwapIxParamsFields {
  side: types.SideKind
  swapType: types.SwapTypeKind
}

export interface SwapIxParamsJSON {
  side: types.SideJSON
  swapType: types.SwapTypeJSON
}

export class SwapIxParams {
  readonly side: types.SideKind
  readonly swapType: types.SwapTypeKind

  constructor(fields: SwapIxParamsFields) {
    this.side = fields.side
    this.swapType = fields.swapType
  }

  static layout(property?: string) {
    return borsh.struct(
      [types.Side.layout("side"), types.SwapType.layout("swapType")],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new SwapIxParams({
      side: types.Side.fromDecoded(obj.side),
      swapType: types.SwapType.fromDecoded(obj.swapType),
    })
  }

  static toEncodable(fields: SwapIxParamsFields) {
    return {
      side: fields.side.toEncodable(),
      swapType: fields.swapType.toEncodable(),
    }
  }

  toJSON(): SwapIxParamsJSON {
    return {
      side: this.side.toJSON(),
      swapType: this.swapType.toJSON(),
    }
  }

  static fromJSON(obj: SwapIxParamsJSON): SwapIxParams {
    return new SwapIxParams({
      side: types.Side.fromJSON(obj.side),
      swapType: types.SwapType.fromJSON(obj.swapType),
    })
  }

  toEncodable() {
    return SwapIxParams.toEncodable(this)
  }
}
