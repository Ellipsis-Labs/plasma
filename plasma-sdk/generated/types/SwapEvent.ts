import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface SwapEventFields {
  swapSequenceNumber: BN
  preBaseLiquidity: BN
  preQuoteLiquidity: BN
  postBaseLiquidity: BN
  postQuoteLiquidity: BN
  snapshotBaseLiquidity: BN
  snapshotQuoteLiquidity: BN
  swapResult: types.SwapResultFields
}

export interface SwapEventJSON {
  swapSequenceNumber: string
  preBaseLiquidity: string
  preQuoteLiquidity: string
  postBaseLiquidity: string
  postQuoteLiquidity: string
  snapshotBaseLiquidity: string
  snapshotQuoteLiquidity: string
  swapResult: types.SwapResultJSON
}

export class SwapEvent {
  readonly swapSequenceNumber: BN
  readonly preBaseLiquidity: BN
  readonly preQuoteLiquidity: BN
  readonly postBaseLiquidity: BN
  readonly postQuoteLiquidity: BN
  readonly snapshotBaseLiquidity: BN
  readonly snapshotQuoteLiquidity: BN
  readonly swapResult: types.SwapResult

  constructor(fields: SwapEventFields) {
    this.swapSequenceNumber = fields.swapSequenceNumber
    this.preBaseLiquidity = fields.preBaseLiquidity
    this.preQuoteLiquidity = fields.preQuoteLiquidity
    this.postBaseLiquidity = fields.postBaseLiquidity
    this.postQuoteLiquidity = fields.postQuoteLiquidity
    this.snapshotBaseLiquidity = fields.snapshotBaseLiquidity
    this.snapshotQuoteLiquidity = fields.snapshotQuoteLiquidity
    this.swapResult = new types.SwapResult({ ...fields.swapResult })
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("swapSequenceNumber"),
        borsh.u64("preBaseLiquidity"),
        borsh.u64("preQuoteLiquidity"),
        borsh.u64("postBaseLiquidity"),
        borsh.u64("postQuoteLiquidity"),
        borsh.u64("snapshotBaseLiquidity"),
        borsh.u64("snapshotQuoteLiquidity"),
        types.SwapResult.layout("swapResult"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new SwapEvent({
      swapSequenceNumber: obj.swapSequenceNumber,
      preBaseLiquidity: obj.preBaseLiquidity,
      preQuoteLiquidity: obj.preQuoteLiquidity,
      postBaseLiquidity: obj.postBaseLiquidity,
      postQuoteLiquidity: obj.postQuoteLiquidity,
      snapshotBaseLiquidity: obj.snapshotBaseLiquidity,
      snapshotQuoteLiquidity: obj.snapshotQuoteLiquidity,
      swapResult: types.SwapResult.fromDecoded(obj.swapResult),
    })
  }

  static toEncodable(fields: SwapEventFields) {
    return {
      swapSequenceNumber: fields.swapSequenceNumber,
      preBaseLiquidity: fields.preBaseLiquidity,
      preQuoteLiquidity: fields.preQuoteLiquidity,
      postBaseLiquidity: fields.postBaseLiquidity,
      postQuoteLiquidity: fields.postQuoteLiquidity,
      snapshotBaseLiquidity: fields.snapshotBaseLiquidity,
      snapshotQuoteLiquidity: fields.snapshotQuoteLiquidity,
      swapResult: types.SwapResult.toEncodable(fields.swapResult),
    }
  }

  toJSON(): SwapEventJSON {
    return {
      swapSequenceNumber: this.swapSequenceNumber.toString(),
      preBaseLiquidity: this.preBaseLiquidity.toString(),
      preQuoteLiquidity: this.preQuoteLiquidity.toString(),
      postBaseLiquidity: this.postBaseLiquidity.toString(),
      postQuoteLiquidity: this.postQuoteLiquidity.toString(),
      snapshotBaseLiquidity: this.snapshotBaseLiquidity.toString(),
      snapshotQuoteLiquidity: this.snapshotQuoteLiquidity.toString(),
      swapResult: this.swapResult.toJSON(),
    }
  }

  static fromJSON(obj: SwapEventJSON): SwapEvent {
    return new SwapEvent({
      swapSequenceNumber: new BN(obj.swapSequenceNumber),
      preBaseLiquidity: new BN(obj.preBaseLiquidity),
      preQuoteLiquidity: new BN(obj.preQuoteLiquidity),
      postBaseLiquidity: new BN(obj.postBaseLiquidity),
      postQuoteLiquidity: new BN(obj.postQuoteLiquidity),
      snapshotBaseLiquidity: new BN(obj.snapshotBaseLiquidity),
      snapshotQuoteLiquidity: new BN(obj.snapshotQuoteLiquidity),
      swapResult: types.SwapResult.fromJSON(obj.swapResult),
    })
  }

  toEncodable() {
    return SwapEvent.toEncodable(this)
  }
}
