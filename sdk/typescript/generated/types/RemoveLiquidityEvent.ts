import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface RemoveLiquidityEventFields {
  poolTotalLpShares: BN
  poolTotalBaseLiquidity: BN
  poolTotalQuoteLiquitidy: BN
  snapshotBaseLiquidity: BN
  snapshotQuoteLiquidity: BN
  userLpSharesBurned: BN
  userLpSharesAvailable: BN
  userLpSharesLocked: BN
  userLpSharesUnlockedForWithdrawal: BN
  userBaseWithdrawn: BN
  userQuoteWithdrawn: BN
  userTotalWithdrawableBase: BN
  userTotalWithdrawableQuote: BN
}

export interface RemoveLiquidityEventJSON {
  poolTotalLpShares: string
  poolTotalBaseLiquidity: string
  poolTotalQuoteLiquitidy: string
  snapshotBaseLiquidity: string
  snapshotQuoteLiquidity: string
  userLpSharesBurned: string
  userLpSharesAvailable: string
  userLpSharesLocked: string
  userLpSharesUnlockedForWithdrawal: string
  userBaseWithdrawn: string
  userQuoteWithdrawn: string
  userTotalWithdrawableBase: string
  userTotalWithdrawableQuote: string
}

export class RemoveLiquidityEvent {
  readonly poolTotalLpShares: BN
  readonly poolTotalBaseLiquidity: BN
  readonly poolTotalQuoteLiquitidy: BN
  readonly snapshotBaseLiquidity: BN
  readonly snapshotQuoteLiquidity: BN
  readonly userLpSharesBurned: BN
  readonly userLpSharesAvailable: BN
  readonly userLpSharesLocked: BN
  readonly userLpSharesUnlockedForWithdrawal: BN
  readonly userBaseWithdrawn: BN
  readonly userQuoteWithdrawn: BN
  readonly userTotalWithdrawableBase: BN
  readonly userTotalWithdrawableQuote: BN

  constructor(fields: RemoveLiquidityEventFields) {
    this.poolTotalLpShares = fields.poolTotalLpShares
    this.poolTotalBaseLiquidity = fields.poolTotalBaseLiquidity
    this.poolTotalQuoteLiquitidy = fields.poolTotalQuoteLiquitidy
    this.snapshotBaseLiquidity = fields.snapshotBaseLiquidity
    this.snapshotQuoteLiquidity = fields.snapshotQuoteLiquidity
    this.userLpSharesBurned = fields.userLpSharesBurned
    this.userLpSharesAvailable = fields.userLpSharesAvailable
    this.userLpSharesLocked = fields.userLpSharesLocked
    this.userLpSharesUnlockedForWithdrawal =
      fields.userLpSharesUnlockedForWithdrawal
    this.userBaseWithdrawn = fields.userBaseWithdrawn
    this.userQuoteWithdrawn = fields.userQuoteWithdrawn
    this.userTotalWithdrawableBase = fields.userTotalWithdrawableBase
    this.userTotalWithdrawableQuote = fields.userTotalWithdrawableQuote
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("poolTotalLpShares"),
        borsh.u64("poolTotalBaseLiquidity"),
        borsh.u64("poolTotalQuoteLiquitidy"),
        borsh.u64("snapshotBaseLiquidity"),
        borsh.u64("snapshotQuoteLiquidity"),
        borsh.u64("userLpSharesBurned"),
        borsh.u64("userLpSharesAvailable"),
        borsh.u64("userLpSharesLocked"),
        borsh.u64("userLpSharesUnlockedForWithdrawal"),
        borsh.u64("userBaseWithdrawn"),
        borsh.u64("userQuoteWithdrawn"),
        borsh.u64("userTotalWithdrawableBase"),
        borsh.u64("userTotalWithdrawableQuote"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new RemoveLiquidityEvent({
      poolTotalLpShares: obj.poolTotalLpShares,
      poolTotalBaseLiquidity: obj.poolTotalBaseLiquidity,
      poolTotalQuoteLiquitidy: obj.poolTotalQuoteLiquitidy,
      snapshotBaseLiquidity: obj.snapshotBaseLiquidity,
      snapshotQuoteLiquidity: obj.snapshotQuoteLiquidity,
      userLpSharesBurned: obj.userLpSharesBurned,
      userLpSharesAvailable: obj.userLpSharesAvailable,
      userLpSharesLocked: obj.userLpSharesLocked,
      userLpSharesUnlockedForWithdrawal: obj.userLpSharesUnlockedForWithdrawal,
      userBaseWithdrawn: obj.userBaseWithdrawn,
      userQuoteWithdrawn: obj.userQuoteWithdrawn,
      userTotalWithdrawableBase: obj.userTotalWithdrawableBase,
      userTotalWithdrawableQuote: obj.userTotalWithdrawableQuote,
    })
  }

  static toEncodable(fields: RemoveLiquidityEventFields) {
    return {
      poolTotalLpShares: fields.poolTotalLpShares,
      poolTotalBaseLiquidity: fields.poolTotalBaseLiquidity,
      poolTotalQuoteLiquitidy: fields.poolTotalQuoteLiquitidy,
      snapshotBaseLiquidity: fields.snapshotBaseLiquidity,
      snapshotQuoteLiquidity: fields.snapshotQuoteLiquidity,
      userLpSharesBurned: fields.userLpSharesBurned,
      userLpSharesAvailable: fields.userLpSharesAvailable,
      userLpSharesLocked: fields.userLpSharesLocked,
      userLpSharesUnlockedForWithdrawal:
        fields.userLpSharesUnlockedForWithdrawal,
      userBaseWithdrawn: fields.userBaseWithdrawn,
      userQuoteWithdrawn: fields.userQuoteWithdrawn,
      userTotalWithdrawableBase: fields.userTotalWithdrawableBase,
      userTotalWithdrawableQuote: fields.userTotalWithdrawableQuote,
    }
  }

  toJSON(): RemoveLiquidityEventJSON {
    return {
      poolTotalLpShares: this.poolTotalLpShares.toString(),
      poolTotalBaseLiquidity: this.poolTotalBaseLiquidity.toString(),
      poolTotalQuoteLiquitidy: this.poolTotalQuoteLiquitidy.toString(),
      snapshotBaseLiquidity: this.snapshotBaseLiquidity.toString(),
      snapshotQuoteLiquidity: this.snapshotQuoteLiquidity.toString(),
      userLpSharesBurned: this.userLpSharesBurned.toString(),
      userLpSharesAvailable: this.userLpSharesAvailable.toString(),
      userLpSharesLocked: this.userLpSharesLocked.toString(),
      userLpSharesUnlockedForWithdrawal:
        this.userLpSharesUnlockedForWithdrawal.toString(),
      userBaseWithdrawn: this.userBaseWithdrawn.toString(),
      userQuoteWithdrawn: this.userQuoteWithdrawn.toString(),
      userTotalWithdrawableBase: this.userTotalWithdrawableBase.toString(),
      userTotalWithdrawableQuote: this.userTotalWithdrawableQuote.toString(),
    }
  }

  static fromJSON(obj: RemoveLiquidityEventJSON): RemoveLiquidityEvent {
    return new RemoveLiquidityEvent({
      poolTotalLpShares: new BN(obj.poolTotalLpShares),
      poolTotalBaseLiquidity: new BN(obj.poolTotalBaseLiquidity),
      poolTotalQuoteLiquitidy: new BN(obj.poolTotalQuoteLiquitidy),
      snapshotBaseLiquidity: new BN(obj.snapshotBaseLiquidity),
      snapshotQuoteLiquidity: new BN(obj.snapshotQuoteLiquidity),
      userLpSharesBurned: new BN(obj.userLpSharesBurned),
      userLpSharesAvailable: new BN(obj.userLpSharesAvailable),
      userLpSharesLocked: new BN(obj.userLpSharesLocked),
      userLpSharesUnlockedForWithdrawal: new BN(
        obj.userLpSharesUnlockedForWithdrawal
      ),
      userBaseWithdrawn: new BN(obj.userBaseWithdrawn),
      userQuoteWithdrawn: new BN(obj.userQuoteWithdrawn),
      userTotalWithdrawableBase: new BN(obj.userTotalWithdrawableBase),
      userTotalWithdrawableQuote: new BN(obj.userTotalWithdrawableQuote),
    })
  }

  toEncodable() {
    return RemoveLiquidityEvent.toEncodable(this)
  }
}
