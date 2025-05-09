import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface WithdrawLpFeesEventFields {
  feesWithdrawn: BN
}

export interface WithdrawLpFeesEventJSON {
  feesWithdrawn: string
}

export class WithdrawLpFeesEvent {
  readonly feesWithdrawn: BN

  constructor(fields: WithdrawLpFeesEventFields) {
    this.feesWithdrawn = fields.feesWithdrawn
  }

  static layout(property?: string) {
    return borsh.struct([borsh.u64("feesWithdrawn")], property)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new WithdrawLpFeesEvent({
      feesWithdrawn: obj.feesWithdrawn,
    })
  }

  static toEncodable(fields: WithdrawLpFeesEventFields) {
    return {
      feesWithdrawn: fields.feesWithdrawn,
    }
  }

  toJSON(): WithdrawLpFeesEventJSON {
    return {
      feesWithdrawn: this.feesWithdrawn.toString(),
    }
  }

  static fromJSON(obj: WithdrawLpFeesEventJSON): WithdrawLpFeesEvent {
    return new WithdrawLpFeesEvent({
      feesWithdrawn: new BN(obj.feesWithdrawn),
    })
  }

  toEncodable() {
    return WithdrawLpFeesEvent.toEncodable(this)
  }
}
