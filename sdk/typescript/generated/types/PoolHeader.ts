import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface PoolHeaderFields {
  sequenceNumber: BN
  baseParams: types.TokenParamsFields
  quoteParams: types.TokenParamsFields
  feeRecipients: types.ProtocolFeeRecipientsFields
  swapSequenceNumber: BN
  padding: Array<BN>
}

export interface PoolHeaderJSON {
  sequenceNumber: string
  baseParams: types.TokenParamsJSON
  quoteParams: types.TokenParamsJSON
  feeRecipients: types.ProtocolFeeRecipientsJSON
  swapSequenceNumber: string
  padding: Array<string>
}

export class PoolHeader {
  readonly sequenceNumber: BN
  readonly baseParams: types.TokenParams
  readonly quoteParams: types.TokenParams
  readonly feeRecipients: types.ProtocolFeeRecipients
  readonly swapSequenceNumber: BN
  readonly padding: Array<BN>

  constructor(fields: PoolHeaderFields) {
    this.sequenceNumber = fields.sequenceNumber
    this.baseParams = new types.TokenParams({ ...fields.baseParams })
    this.quoteParams = new types.TokenParams({ ...fields.quoteParams })
    this.feeRecipients = new types.ProtocolFeeRecipients({
      ...fields.feeRecipients,
    })
    this.swapSequenceNumber = fields.swapSequenceNumber
    this.padding = fields.padding
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("sequenceNumber"),
        types.TokenParams.layout("baseParams"),
        types.TokenParams.layout("quoteParams"),
        types.ProtocolFeeRecipients.layout("feeRecipients"),
        borsh.u64("swapSequenceNumber"),
        borsh.array(borsh.u64(), 12, "padding"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new PoolHeader({
      sequenceNumber: obj.sequenceNumber,
      baseParams: types.TokenParams.fromDecoded(obj.baseParams),
      quoteParams: types.TokenParams.fromDecoded(obj.quoteParams),
      feeRecipients: types.ProtocolFeeRecipients.fromDecoded(obj.feeRecipients),
      swapSequenceNumber: obj.swapSequenceNumber,
      padding: obj.padding,
    })
  }

  static toEncodable(fields: PoolHeaderFields) {
    return {
      sequenceNumber: fields.sequenceNumber,
      baseParams: types.TokenParams.toEncodable(fields.baseParams),
      quoteParams: types.TokenParams.toEncodable(fields.quoteParams),
      feeRecipients: types.ProtocolFeeRecipients.toEncodable(
        fields.feeRecipients
      ),
      swapSequenceNumber: fields.swapSequenceNumber,
      padding: fields.padding,
    }
  }

  toJSON(): PoolHeaderJSON {
    return {
      sequenceNumber: this.sequenceNumber.toString(),
      baseParams: this.baseParams.toJSON(),
      quoteParams: this.quoteParams.toJSON(),
      feeRecipients: this.feeRecipients.toJSON(),
      swapSequenceNumber: this.swapSequenceNumber.toString(),
      padding: this.padding.map((item) => item.toString()),
    }
  }

  static fromJSON(obj: PoolHeaderJSON): PoolHeader {
    return new PoolHeader({
      sequenceNumber: new BN(obj.sequenceNumber),
      baseParams: types.TokenParams.fromJSON(obj.baseParams),
      quoteParams: types.TokenParams.fromJSON(obj.quoteParams),
      feeRecipients: types.ProtocolFeeRecipients.fromJSON(obj.feeRecipients),
      swapSequenceNumber: new BN(obj.swapSequenceNumber),
      padding: obj.padding.map((item) => new BN(item)),
    })
  }

  toEncodable() {
    return PoolHeader.toEncodable(this)
  }
}
