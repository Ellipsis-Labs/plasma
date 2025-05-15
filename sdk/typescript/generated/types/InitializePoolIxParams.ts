import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface InitializePoolIxParamsFields {
  lpFeeInBps: BN
  protocolLpFeeAllocationInPct: BN
  feeRecipientsParams: Array<types.ProtocolFeeRecipientParamsFields>
  numSlotsToVestLpShares: BN | null
}

export interface InitializePoolIxParamsJSON {
  lpFeeInBps: string
  protocolLpFeeAllocationInPct: string
  feeRecipientsParams: Array<types.ProtocolFeeRecipientParamsJSON>
  numSlotsToVestLpShares: string | null
}

export class InitializePoolIxParams {
  readonly lpFeeInBps: BN
  readonly protocolLpFeeAllocationInPct: BN
  readonly feeRecipientsParams: Array<types.ProtocolFeeRecipientParams>
  readonly numSlotsToVestLpShares: BN | null

  constructor(fields: InitializePoolIxParamsFields) {
    this.lpFeeInBps = fields.lpFeeInBps
    this.protocolLpFeeAllocationInPct = fields.protocolLpFeeAllocationInPct
    this.feeRecipientsParams = fields.feeRecipientsParams.map(
      (item) => new types.ProtocolFeeRecipientParams({ ...item })
    )
    this.numSlotsToVestLpShares = fields.numSlotsToVestLpShares
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("lpFeeInBps"),
        borsh.u64("protocolLpFeeAllocationInPct"),
        borsh.array(
          types.ProtocolFeeRecipientParams.layout(),
          3,
          "feeRecipientsParams"
        ),
        borsh.option(borsh.u64(), "numSlotsToVestLpShares"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new InitializePoolIxParams({
      lpFeeInBps: obj.lpFeeInBps,
      protocolLpFeeAllocationInPct: obj.protocolLpFeeAllocationInPct,
      feeRecipientsParams: obj.feeRecipientsParams.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.ProtocolFeeRecipientParams.fromDecoded(item)
      ),
      numSlotsToVestLpShares: obj.numSlotsToVestLpShares,
    })
  }

  static toEncodable(fields: InitializePoolIxParamsFields) {
    return {
      lpFeeInBps: fields.lpFeeInBps,
      protocolLpFeeAllocationInPct: fields.protocolLpFeeAllocationInPct,
      feeRecipientsParams: fields.feeRecipientsParams.map((item) =>
        types.ProtocolFeeRecipientParams.toEncodable(item)
      ),
      numSlotsToVestLpShares: fields.numSlotsToVestLpShares,
    }
  }

  toJSON(): InitializePoolIxParamsJSON {
    return {
      lpFeeInBps: this.lpFeeInBps.toString(),
      protocolLpFeeAllocationInPct:
        this.protocolLpFeeAllocationInPct.toString(),
      feeRecipientsParams: this.feeRecipientsParams.map((item) =>
        item.toJSON()
      ),
      numSlotsToVestLpShares:
        (this.numSlotsToVestLpShares &&
          this.numSlotsToVestLpShares.toString()) ||
        null,
    }
  }

  static fromJSON(obj: InitializePoolIxParamsJSON): InitializePoolIxParams {
    return new InitializePoolIxParams({
      lpFeeInBps: new BN(obj.lpFeeInBps),
      protocolLpFeeAllocationInPct: new BN(obj.protocolLpFeeAllocationInPct),
      feeRecipientsParams: obj.feeRecipientsParams.map((item) =>
        types.ProtocolFeeRecipientParams.fromJSON(item)
      ),
      numSlotsToVestLpShares:
        (obj.numSlotsToVestLpShares && new BN(obj.numSlotsToVestLpShares)) ||
        null,
    })
  }

  toEncodable() {
    return InitializePoolIxParams.toEncodable(this)
  }
}
