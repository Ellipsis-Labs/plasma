import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface RemoveLiquidityIxParamsFields {
  lpShares: BN
}

export interface RemoveLiquidityIxParamsJSON {
  lpShares: string
}

export class RemoveLiquidityIxParams {
  readonly lpShares: BN

  constructor(fields: RemoveLiquidityIxParamsFields) {
    this.lpShares = fields.lpShares
  }

  static layout(property?: string) {
    return borsh.struct([borsh.u64("lpShares")], property)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new RemoveLiquidityIxParams({
      lpShares: obj.lpShares,
    })
  }

  static toEncodable(fields: RemoveLiquidityIxParamsFields) {
    return {
      lpShares: fields.lpShares,
    }
  }

  toJSON(): RemoveLiquidityIxParamsJSON {
    return {
      lpShares: this.lpShares.toString(),
    }
  }

  static fromJSON(obj: RemoveLiquidityIxParamsJSON): RemoveLiquidityIxParams {
    return new RemoveLiquidityIxParams({
      lpShares: new BN(obj.lpShares),
    })
  }

  toEncodable() {
    return RemoveLiquidityIxParams.toEncodable(this)
  }
}
