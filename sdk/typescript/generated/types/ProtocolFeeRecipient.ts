import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface ProtocolFeeRecipientFields {
  recipient: PublicKey
  shares: BN
  totalAccumulatedQuoteFees: BN
  collectedQuoteFees: BN
}

export interface ProtocolFeeRecipientJSON {
  recipient: string
  shares: string
  totalAccumulatedQuoteFees: string
  collectedQuoteFees: string
}

export class ProtocolFeeRecipient {
  readonly recipient: PublicKey
  readonly shares: BN
  readonly totalAccumulatedQuoteFees: BN
  readonly collectedQuoteFees: BN

  constructor(fields: ProtocolFeeRecipientFields) {
    this.recipient = fields.recipient
    this.shares = fields.shares
    this.totalAccumulatedQuoteFees = fields.totalAccumulatedQuoteFees
    this.collectedQuoteFees = fields.collectedQuoteFees
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.publicKey("recipient"),
        borsh.u64("shares"),
        borsh.u64("totalAccumulatedQuoteFees"),
        borsh.u64("collectedQuoteFees"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new ProtocolFeeRecipient({
      recipient: obj.recipient,
      shares: obj.shares,
      totalAccumulatedQuoteFees: obj.totalAccumulatedQuoteFees,
      collectedQuoteFees: obj.collectedQuoteFees,
    })
  }

  static toEncodable(fields: ProtocolFeeRecipientFields) {
    return {
      recipient: fields.recipient,
      shares: fields.shares,
      totalAccumulatedQuoteFees: fields.totalAccumulatedQuoteFees,
      collectedQuoteFees: fields.collectedQuoteFees,
    }
  }

  toJSON(): ProtocolFeeRecipientJSON {
    return {
      recipient: this.recipient.toString(),
      shares: this.shares.toString(),
      totalAccumulatedQuoteFees: this.totalAccumulatedQuoteFees.toString(),
      collectedQuoteFees: this.collectedQuoteFees.toString(),
    }
  }

  static fromJSON(obj: ProtocolFeeRecipientJSON): ProtocolFeeRecipient {
    return new ProtocolFeeRecipient({
      recipient: new PublicKey(obj.recipient),
      shares: new BN(obj.shares),
      totalAccumulatedQuoteFees: new BN(obj.totalAccumulatedQuoteFees),
      collectedQuoteFees: new BN(obj.collectedQuoteFees),
    })
  }

  toEncodable() {
    return ProtocolFeeRecipient.toEncodable(this)
  }
}
