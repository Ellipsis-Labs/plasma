import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface AddLiquidityEventFields {
  poolTotalLpShares: BN
  poolTotalBaseLiquidity: BN
  poolTotalQuoteLiquitidy: BN
  snapshotBaseLiquidity: BN
  snapshotQuoteLiquidity: BN
  userLpSharesReceived: BN
  userLpSharesAvailable: BN
  userLpSharesLocked: BN
  userLpSharesUnlockedForWithdrawal: BN
  userBaseDeposited: BN
  userQuoteDeposited: BN
  userTotalWithdrawableBase: BN
  userTotalWithdrawableQuote: BN
}

export interface AddLiquidityEventJSON {
  poolTotalLpShares: string
  poolTotalBaseLiquidity: string
  poolTotalQuoteLiquitidy: string
  snapshotBaseLiquidity: string
  snapshotQuoteLiquidity: string
  userLpSharesReceived: string
  userLpSharesAvailable: string
  userLpSharesLocked: string
  userLpSharesUnlockedForWithdrawal: string
  userBaseDeposited: string
  userQuoteDeposited: string
  userTotalWithdrawableBase: string
  userTotalWithdrawableQuote: string
}

export class AddLiquidityEvent {
  readonly poolTotalLpShares: BN
  readonly poolTotalBaseLiquidity: BN
  readonly poolTotalQuoteLiquitidy: BN
  readonly snapshotBaseLiquidity: BN
  readonly snapshotQuoteLiquidity: BN
  readonly userLpSharesReceived: BN
  readonly userLpSharesAvailable: BN
  readonly userLpSharesLocked: BN
  readonly userLpSharesUnlockedForWithdrawal: BN
  readonly userBaseDeposited: BN
  readonly userQuoteDeposited: BN
  readonly userTotalWithdrawableBase: BN
  readonly userTotalWithdrawableQuote: BN

  constructor(fields: AddLiquidityEventFields) {
    this.poolTotalLpShares = fields.poolTotalLpShares
    this.poolTotalBaseLiquidity = fields.poolTotalBaseLiquidity
    this.poolTotalQuoteLiquitidy = fields.poolTotalQuoteLiquitidy
    this.snapshotBaseLiquidity = fields.snapshotBaseLiquidity
    this.snapshotQuoteLiquidity = fields.snapshotQuoteLiquidity
    this.userLpSharesReceived = fields.userLpSharesReceived
    this.userLpSharesAvailable = fields.userLpSharesAvailable
    this.userLpSharesLocked = fields.userLpSharesLocked
    this.userLpSharesUnlockedForWithdrawal =
      fields.userLpSharesUnlockedForWithdrawal
    this.userBaseDeposited = fields.userBaseDeposited
    this.userQuoteDeposited = fields.userQuoteDeposited
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
        borsh.u64("userLpSharesReceived"),
        borsh.u64("userLpSharesAvailable"),
        borsh.u64("userLpSharesLocked"),
        borsh.u64("userLpSharesUnlockedForWithdrawal"),
        borsh.u64("userBaseDeposited"),
        borsh.u64("userQuoteDeposited"),
        borsh.u64("userTotalWithdrawableBase"),
        borsh.u64("userTotalWithdrawableQuote"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new AddLiquidityEvent({
      poolTotalLpShares: obj.poolTotalLpShares,
      poolTotalBaseLiquidity: obj.poolTotalBaseLiquidity,
      poolTotalQuoteLiquitidy: obj.poolTotalQuoteLiquitidy,
      snapshotBaseLiquidity: obj.snapshotBaseLiquidity,
      snapshotQuoteLiquidity: obj.snapshotQuoteLiquidity,
      userLpSharesReceived: obj.userLpSharesReceived,
      userLpSharesAvailable: obj.userLpSharesAvailable,
      userLpSharesLocked: obj.userLpSharesLocked,
      userLpSharesUnlockedForWithdrawal: obj.userLpSharesUnlockedForWithdrawal,
      userBaseDeposited: obj.userBaseDeposited,
      userQuoteDeposited: obj.userQuoteDeposited,
      userTotalWithdrawableBase: obj.userTotalWithdrawableBase,
      userTotalWithdrawableQuote: obj.userTotalWithdrawableQuote,
    })
  }

  static toEncodable(fields: AddLiquidityEventFields) {
    return {
      poolTotalLpShares: fields.poolTotalLpShares,
      poolTotalBaseLiquidity: fields.poolTotalBaseLiquidity,
      poolTotalQuoteLiquitidy: fields.poolTotalQuoteLiquitidy,
      snapshotBaseLiquidity: fields.snapshotBaseLiquidity,
      snapshotQuoteLiquidity: fields.snapshotQuoteLiquidity,
      userLpSharesReceived: fields.userLpSharesReceived,
      userLpSharesAvailable: fields.userLpSharesAvailable,
      userLpSharesLocked: fields.userLpSharesLocked,
      userLpSharesUnlockedForWithdrawal:
        fields.userLpSharesUnlockedForWithdrawal,
      userBaseDeposited: fields.userBaseDeposited,
      userQuoteDeposited: fields.userQuoteDeposited,
      userTotalWithdrawableBase: fields.userTotalWithdrawableBase,
      userTotalWithdrawableQuote: fields.userTotalWithdrawableQuote,
    }
  }

  toJSON(): AddLiquidityEventJSON {
    return {
      poolTotalLpShares: this.poolTotalLpShares.toString(),
      poolTotalBaseLiquidity: this.poolTotalBaseLiquidity.toString(),
      poolTotalQuoteLiquitidy: this.poolTotalQuoteLiquitidy.toString(),
      snapshotBaseLiquidity: this.snapshotBaseLiquidity.toString(),
      snapshotQuoteLiquidity: this.snapshotQuoteLiquidity.toString(),
      userLpSharesReceived: this.userLpSharesReceived.toString(),
      userLpSharesAvailable: this.userLpSharesAvailable.toString(),
      userLpSharesLocked: this.userLpSharesLocked.toString(),
      userLpSharesUnlockedForWithdrawal:
        this.userLpSharesUnlockedForWithdrawal.toString(),
      userBaseDeposited: this.userBaseDeposited.toString(),
      userQuoteDeposited: this.userQuoteDeposited.toString(),
      userTotalWithdrawableBase: this.userTotalWithdrawableBase.toString(),
      userTotalWithdrawableQuote: this.userTotalWithdrawableQuote.toString(),
    }
  }

  static fromJSON(obj: AddLiquidityEventJSON): AddLiquidityEvent {
    return new AddLiquidityEvent({
      poolTotalLpShares: new BN(obj.poolTotalLpShares),
      poolTotalBaseLiquidity: new BN(obj.poolTotalBaseLiquidity),
      poolTotalQuoteLiquitidy: new BN(obj.poolTotalQuoteLiquitidy),
      snapshotBaseLiquidity: new BN(obj.snapshotBaseLiquidity),
      snapshotQuoteLiquidity: new BN(obj.snapshotQuoteLiquidity),
      userLpSharesReceived: new BN(obj.userLpSharesReceived),
      userLpSharesAvailable: new BN(obj.userLpSharesAvailable),
      userLpSharesLocked: new BN(obj.userLpSharesLocked),
      userLpSharesUnlockedForWithdrawal: new BN(
        obj.userLpSharesUnlockedForWithdrawal
      ),
      userBaseDeposited: new BN(obj.userBaseDeposited),
      userQuoteDeposited: new BN(obj.userQuoteDeposited),
      userTotalWithdrawableBase: new BN(obj.userTotalWithdrawableBase),
      userTotalWithdrawableQuote: new BN(obj.userTotalWithdrawableQuote),
    })
  }

  toEncodable() {
    return AddLiquidityEvent.toEncodable(this)
  }
}
