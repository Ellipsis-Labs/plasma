import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface AmmFields {
  feeInBps: number
  protocolAllocationInPct: number
  lpVestingWindow: BN
  rewardFactor: BN
  totalLpShares: BN
  slotSnapshot: BN
  baseReservesSnapshot: BN
  quoteReservesSnapshot: BN
  baseReserves: BN
  quoteReserves: BN
  cumulativeQuoteLpFees: BN
  cumulativeQuoteProtocolFees: BN
}

export interface AmmJSON {
  feeInBps: number
  protocolAllocationInPct: number
  lpVestingWindow: string
  rewardFactor: string
  totalLpShares: string
  slotSnapshot: string
  baseReservesSnapshot: string
  quoteReservesSnapshot: string
  baseReserves: string
  quoteReserves: string
  cumulativeQuoteLpFees: string
  cumulativeQuoteProtocolFees: string
}

export class Amm {
  readonly feeInBps: number
  readonly protocolAllocationInPct: number
  readonly lpVestingWindow: BN
  readonly rewardFactor: BN
  readonly totalLpShares: BN
  readonly slotSnapshot: BN
  readonly baseReservesSnapshot: BN
  readonly quoteReservesSnapshot: BN
  readonly baseReserves: BN
  readonly quoteReserves: BN
  readonly cumulativeQuoteLpFees: BN
  readonly cumulativeQuoteProtocolFees: BN

  constructor(fields: AmmFields) {
    this.feeInBps = fields.feeInBps
    this.protocolAllocationInPct = fields.protocolAllocationInPct
    this.lpVestingWindow = fields.lpVestingWindow
    this.rewardFactor = fields.rewardFactor
    this.totalLpShares = fields.totalLpShares
    this.slotSnapshot = fields.slotSnapshot
    this.baseReservesSnapshot = fields.baseReservesSnapshot
    this.quoteReservesSnapshot = fields.quoteReservesSnapshot
    this.baseReserves = fields.baseReserves
    this.quoteReserves = fields.quoteReserves
    this.cumulativeQuoteLpFees = fields.cumulativeQuoteLpFees
    this.cumulativeQuoteProtocolFees = fields.cumulativeQuoteProtocolFees
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u32("feeInBps"),
        borsh.u32("protocolAllocationInPct"),
        borsh.u64("lpVestingWindow"),
        borsh.u128("rewardFactor"),
        borsh.u64("totalLpShares"),
        borsh.u64("slotSnapshot"),
        borsh.u64("baseReservesSnapshot"),
        borsh.u64("quoteReservesSnapshot"),
        borsh.u64("baseReserves"),
        borsh.u64("quoteReserves"),
        borsh.u64("cumulativeQuoteLpFees"),
        borsh.u64("cumulativeQuoteProtocolFees"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new Amm({
      feeInBps: obj.feeInBps,
      protocolAllocationInPct: obj.protocolAllocationInPct,
      lpVestingWindow: obj.lpVestingWindow,
      rewardFactor: obj.rewardFactor,
      totalLpShares: obj.totalLpShares,
      slotSnapshot: obj.slotSnapshot,
      baseReservesSnapshot: obj.baseReservesSnapshot,
      quoteReservesSnapshot: obj.quoteReservesSnapshot,
      baseReserves: obj.baseReserves,
      quoteReserves: obj.quoteReserves,
      cumulativeQuoteLpFees: obj.cumulativeQuoteLpFees,
      cumulativeQuoteProtocolFees: obj.cumulativeQuoteProtocolFees,
    })
  }

  static toEncodable(fields: AmmFields) {
    return {
      feeInBps: fields.feeInBps,
      protocolAllocationInPct: fields.protocolAllocationInPct,
      lpVestingWindow: fields.lpVestingWindow,
      rewardFactor: fields.rewardFactor,
      totalLpShares: fields.totalLpShares,
      slotSnapshot: fields.slotSnapshot,
      baseReservesSnapshot: fields.baseReservesSnapshot,
      quoteReservesSnapshot: fields.quoteReservesSnapshot,
      baseReserves: fields.baseReserves,
      quoteReserves: fields.quoteReserves,
      cumulativeQuoteLpFees: fields.cumulativeQuoteLpFees,
      cumulativeQuoteProtocolFees: fields.cumulativeQuoteProtocolFees,
    }
  }

  toJSON(): AmmJSON {
    return {
      feeInBps: this.feeInBps,
      protocolAllocationInPct: this.protocolAllocationInPct,
      lpVestingWindow: this.lpVestingWindow.toString(),
      rewardFactor: this.rewardFactor.toString(),
      totalLpShares: this.totalLpShares.toString(),
      slotSnapshot: this.slotSnapshot.toString(),
      baseReservesSnapshot: this.baseReservesSnapshot.toString(),
      quoteReservesSnapshot: this.quoteReservesSnapshot.toString(),
      baseReserves: this.baseReserves.toString(),
      quoteReserves: this.quoteReserves.toString(),
      cumulativeQuoteLpFees: this.cumulativeQuoteLpFees.toString(),
      cumulativeQuoteProtocolFees: this.cumulativeQuoteProtocolFees.toString(),
    }
  }

  static fromJSON(obj: AmmJSON): Amm {
    return new Amm({
      feeInBps: obj.feeInBps,
      protocolAllocationInPct: obj.protocolAllocationInPct,
      lpVestingWindow: new BN(obj.lpVestingWindow),
      rewardFactor: new BN(obj.rewardFactor),
      totalLpShares: new BN(obj.totalLpShares),
      slotSnapshot: new BN(obj.slotSnapshot),
      baseReservesSnapshot: new BN(obj.baseReservesSnapshot),
      quoteReservesSnapshot: new BN(obj.quoteReservesSnapshot),
      baseReserves: new BN(obj.baseReserves),
      quoteReserves: new BN(obj.quoteReserves),
      cumulativeQuoteLpFees: new BN(obj.cumulativeQuoteLpFees),
      cumulativeQuoteProtocolFees: new BN(obj.cumulativeQuoteProtocolFees),
    })
  }

  toEncodable() {
    return Amm.toEncodable(this)
  }
}
