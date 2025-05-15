import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface WithdrawProtocolFeesEventFields {
  protocolFeeRecipient: PublicKey
  feesWithdrawn: BN
}

export interface WithdrawProtocolFeesEventJSON {
  protocolFeeRecipient: string
  feesWithdrawn: string
}

export class WithdrawProtocolFeesEvent {
  readonly protocolFeeRecipient: PublicKey
  readonly feesWithdrawn: BN

  constructor(fields: WithdrawProtocolFeesEventFields) {
    this.protocolFeeRecipient = fields.protocolFeeRecipient
    this.feesWithdrawn = fields.feesWithdrawn
  }

  static layout(property?: string) {
    return borsh.struct(
      [borsh.publicKey("protocolFeeRecipient"), borsh.u64("feesWithdrawn")],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new WithdrawProtocolFeesEvent({
      protocolFeeRecipient: obj.protocolFeeRecipient,
      feesWithdrawn: obj.feesWithdrawn,
    })
  }

  static toEncodable(fields: WithdrawProtocolFeesEventFields) {
    return {
      protocolFeeRecipient: fields.protocolFeeRecipient,
      feesWithdrawn: fields.feesWithdrawn,
    }
  }

  toJSON(): WithdrawProtocolFeesEventJSON {
    return {
      protocolFeeRecipient: this.protocolFeeRecipient.toString(),
      feesWithdrawn: this.feesWithdrawn.toString(),
    }
  }

  static fromJSON(
    obj: WithdrawProtocolFeesEventJSON
  ): WithdrawProtocolFeesEvent {
    return new WithdrawProtocolFeesEvent({
      protocolFeeRecipient: new PublicKey(obj.protocolFeeRecipient),
      feesWithdrawn: new BN(obj.feesWithdrawn),
    })
  }

  toEncodable() {
    return WithdrawProtocolFeesEvent.toEncodable(this)
  }
}
