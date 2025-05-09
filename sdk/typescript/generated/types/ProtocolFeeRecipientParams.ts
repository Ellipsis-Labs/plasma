import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface ProtocolFeeRecipientParamsFields {
  recipient: PublicKey
  shares: BN
}

export interface ProtocolFeeRecipientParamsJSON {
  recipient: string
  shares: string
}

export class ProtocolFeeRecipientParams {
  readonly recipient: PublicKey
  readonly shares: BN

  constructor(fields: ProtocolFeeRecipientParamsFields) {
    this.recipient = fields.recipient
    this.shares = fields.shares
  }

  static layout(property?: string) {
    return borsh.struct(
      [borsh.publicKey("recipient"), borsh.u64("shares")],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new ProtocolFeeRecipientParams({
      recipient: obj.recipient,
      shares: obj.shares,
    })
  }

  static toEncodable(fields: ProtocolFeeRecipientParamsFields) {
    return {
      recipient: fields.recipient,
      shares: fields.shares,
    }
  }

  toJSON(): ProtocolFeeRecipientParamsJSON {
    return {
      recipient: this.recipient.toString(),
      shares: this.shares.toString(),
    }
  }

  static fromJSON(
    obj: ProtocolFeeRecipientParamsJSON
  ): ProtocolFeeRecipientParams {
    return new ProtocolFeeRecipientParams({
      recipient: new PublicKey(obj.recipient),
      shares: new BN(obj.shares),
    })
  }

  toEncodable() {
    return ProtocolFeeRecipientParams.toEncodable(this)
  }
}
