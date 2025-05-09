import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface LpPositionFields {
  rewardFactorSnapshot: BN
  lpShares: BN
  withdrawableLpShares: BN
  uncollectedFees: BN
  collectedFees: BN
  pendingSharesToVest: types.PendingSharesToVestFields
}

export interface LpPositionJSON {
  rewardFactorSnapshot: string
  lpShares: string
  withdrawableLpShares: string
  uncollectedFees: string
  collectedFees: string
  pendingSharesToVest: types.PendingSharesToVestJSON
}

export class LpPosition {
  readonly rewardFactorSnapshot: BN
  readonly lpShares: BN
  readonly withdrawableLpShares: BN
  readonly uncollectedFees: BN
  readonly collectedFees: BN
  readonly pendingSharesToVest: types.PendingSharesToVest

  constructor(fields: LpPositionFields) {
    this.rewardFactorSnapshot = fields.rewardFactorSnapshot
    this.lpShares = fields.lpShares
    this.withdrawableLpShares = fields.withdrawableLpShares
    this.uncollectedFees = fields.uncollectedFees
    this.collectedFees = fields.collectedFees
    this.pendingSharesToVest = new types.PendingSharesToVest({
      ...fields.pendingSharesToVest,
    })
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u128("rewardFactorSnapshot"),
        borsh.u64("lpShares"),
        borsh.u64("withdrawableLpShares"),
        borsh.u64("uncollectedFees"),
        borsh.u64("collectedFees"),
        types.PendingSharesToVest.layout("pendingSharesToVest"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new LpPosition({
      rewardFactorSnapshot: obj.rewardFactorSnapshot,
      lpShares: obj.lpShares,
      withdrawableLpShares: obj.withdrawableLpShares,
      uncollectedFees: obj.uncollectedFees,
      collectedFees: obj.collectedFees,
      pendingSharesToVest: types.PendingSharesToVest.fromDecoded(
        obj.pendingSharesToVest
      ),
    })
  }

  static toEncodable(fields: LpPositionFields) {
    return {
      rewardFactorSnapshot: fields.rewardFactorSnapshot,
      lpShares: fields.lpShares,
      withdrawableLpShares: fields.withdrawableLpShares,
      uncollectedFees: fields.uncollectedFees,
      collectedFees: fields.collectedFees,
      pendingSharesToVest: types.PendingSharesToVest.toEncodable(
        fields.pendingSharesToVest
      ),
    }
  }

  toJSON(): LpPositionJSON {
    return {
      rewardFactorSnapshot: this.rewardFactorSnapshot.toString(),
      lpShares: this.lpShares.toString(),
      withdrawableLpShares: this.withdrawableLpShares.toString(),
      uncollectedFees: this.uncollectedFees.toString(),
      collectedFees: this.collectedFees.toString(),
      pendingSharesToVest: this.pendingSharesToVest.toJSON(),
    }
  }

  static fromJSON(obj: LpPositionJSON): LpPosition {
    return new LpPosition({
      rewardFactorSnapshot: new BN(obj.rewardFactorSnapshot),
      lpShares: new BN(obj.lpShares),
      withdrawableLpShares: new BN(obj.withdrawableLpShares),
      uncollectedFees: new BN(obj.uncollectedFees),
      collectedFees: new BN(obj.collectedFees),
      pendingSharesToVest: types.PendingSharesToVest.fromJSON(
        obj.pendingSharesToVest
      ),
    })
  }

  toEncodable() {
    return LpPosition.toEncodable(this)
  }
}
