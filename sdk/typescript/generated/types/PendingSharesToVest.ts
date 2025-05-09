import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface PendingSharesToVestFields {
  depositSlot: BN
  lpSharesToVest: BN
}

export interface PendingSharesToVestJSON {
  depositSlot: string
  lpSharesToVest: string
}

export class PendingSharesToVest {
  readonly depositSlot: BN
  readonly lpSharesToVest: BN

  constructor(fields: PendingSharesToVestFields) {
    this.depositSlot = fields.depositSlot
    this.lpSharesToVest = fields.lpSharesToVest
  }

  static layout(property?: string) {
    return borsh.struct(
      [borsh.u64("depositSlot"), borsh.u64("lpSharesToVest")],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new PendingSharesToVest({
      depositSlot: obj.depositSlot,
      lpSharesToVest: obj.lpSharesToVest,
    })
  }

  static toEncodable(fields: PendingSharesToVestFields) {
    return {
      depositSlot: fields.depositSlot,
      lpSharesToVest: fields.lpSharesToVest,
    }
  }

  toJSON(): PendingSharesToVestJSON {
    return {
      depositSlot: this.depositSlot.toString(),
      lpSharesToVest: this.lpSharesToVest.toString(),
    }
  }

  static fromJSON(obj: PendingSharesToVestJSON): PendingSharesToVest {
    return new PendingSharesToVest({
      depositSlot: new BN(obj.depositSlot),
      lpSharesToVest: new BN(obj.lpSharesToVest),
    })
  }

  toEncodable() {
    return PendingSharesToVest.toEncodable(this)
  }
}
