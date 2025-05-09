import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface RenounceLiquidityEventFields {
  allowFeeWithdrawal: boolean
}

export interface RenounceLiquidityEventJSON {
  allowFeeWithdrawal: boolean
}

export class RenounceLiquidityEvent {
  readonly allowFeeWithdrawal: boolean

  constructor(fields: RenounceLiquidityEventFields) {
    this.allowFeeWithdrawal = fields.allowFeeWithdrawal
  }

  static layout(property?: string) {
    return borsh.struct([borsh.bool("allowFeeWithdrawal")], property)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new RenounceLiquidityEvent({
      allowFeeWithdrawal: obj.allowFeeWithdrawal,
    })
  }

  static toEncodable(fields: RenounceLiquidityEventFields) {
    return {
      allowFeeWithdrawal: fields.allowFeeWithdrawal,
    }
  }

  toJSON(): RenounceLiquidityEventJSON {
    return {
      allowFeeWithdrawal: this.allowFeeWithdrawal,
    }
  }

  static fromJSON(obj: RenounceLiquidityEventJSON): RenounceLiquidityEvent {
    return new RenounceLiquidityEvent({
      allowFeeWithdrawal: obj.allowFeeWithdrawal,
    })
  }

  toEncodable() {
    return RenounceLiquidityEvent.toEncodable(this)
  }
}
