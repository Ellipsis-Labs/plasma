import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface RenounceLiquidityIxParamsFields {
  allowFeeWithdrawal: boolean
}

export interface RenounceLiquidityIxParamsJSON {
  allowFeeWithdrawal: boolean
}

export class RenounceLiquidityIxParams {
  readonly allowFeeWithdrawal: boolean

  constructor(fields: RenounceLiquidityIxParamsFields) {
    this.allowFeeWithdrawal = fields.allowFeeWithdrawal
  }

  static layout(property?: string) {
    return borsh.struct([borsh.bool("allowFeeWithdrawal")], property)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new RenounceLiquidityIxParams({
      allowFeeWithdrawal: obj.allowFeeWithdrawal,
    })
  }

  static toEncodable(fields: RenounceLiquidityIxParamsFields) {
    return {
      allowFeeWithdrawal: fields.allowFeeWithdrawal,
    }
  }

  toJSON(): RenounceLiquidityIxParamsJSON {
    return {
      allowFeeWithdrawal: this.allowFeeWithdrawal,
    }
  }

  static fromJSON(
    obj: RenounceLiquidityIxParamsJSON
  ): RenounceLiquidityIxParams {
    return new RenounceLiquidityIxParams({
      allowFeeWithdrawal: obj.allowFeeWithdrawal,
    })
  }

  toEncodable() {
    return RenounceLiquidityIxParams.toEncodable(this)
  }
}
