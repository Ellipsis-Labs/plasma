import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface PlasmaEventHeaderFields {
  sequenceNumber: BN
  slot: BN
  timestamp: BN
  pool: PublicKey
  signer: PublicKey
  baseDecimals: number
  quoteDecimals: number
}

export interface PlasmaEventHeaderJSON {
  sequenceNumber: string
  slot: string
  timestamp: string
  pool: string
  signer: string
  baseDecimals: number
  quoteDecimals: number
}

export class PlasmaEventHeader {
  readonly sequenceNumber: BN
  readonly slot: BN
  readonly timestamp: BN
  readonly pool: PublicKey
  readonly signer: PublicKey
  readonly baseDecimals: number
  readonly quoteDecimals: number

  constructor(fields: PlasmaEventHeaderFields) {
    this.sequenceNumber = fields.sequenceNumber
    this.slot = fields.slot
    this.timestamp = fields.timestamp
    this.pool = fields.pool
    this.signer = fields.signer
    this.baseDecimals = fields.baseDecimals
    this.quoteDecimals = fields.quoteDecimals
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("sequenceNumber"),
        borsh.u64("slot"),
        borsh.i64("timestamp"),
        borsh.publicKey("pool"),
        borsh.publicKey("signer"),
        borsh.u8("baseDecimals"),
        borsh.u8("quoteDecimals"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new PlasmaEventHeader({
      sequenceNumber: obj.sequenceNumber,
      slot: obj.slot,
      timestamp: obj.timestamp,
      pool: obj.pool,
      signer: obj.signer,
      baseDecimals: obj.baseDecimals,
      quoteDecimals: obj.quoteDecimals,
    })
  }

  static toEncodable(fields: PlasmaEventHeaderFields) {
    return {
      sequenceNumber: fields.sequenceNumber,
      slot: fields.slot,
      timestamp: fields.timestamp,
      pool: fields.pool,
      signer: fields.signer,
      baseDecimals: fields.baseDecimals,
      quoteDecimals: fields.quoteDecimals,
    }
  }

  toJSON(): PlasmaEventHeaderJSON {
    return {
      sequenceNumber: this.sequenceNumber.toString(),
      slot: this.slot.toString(),
      timestamp: this.timestamp.toString(),
      pool: this.pool.toString(),
      signer: this.signer.toString(),
      baseDecimals: this.baseDecimals,
      quoteDecimals: this.quoteDecimals,
    }
  }

  static fromJSON(obj: PlasmaEventHeaderJSON): PlasmaEventHeader {
    return new PlasmaEventHeader({
      sequenceNumber: new BN(obj.sequenceNumber),
      slot: new BN(obj.slot),
      timestamp: new BN(obj.timestamp),
      pool: new PublicKey(obj.pool),
      signer: new PublicKey(obj.signer),
      baseDecimals: obj.baseDecimals,
      quoteDecimals: obj.quoteDecimals,
    })
  }

  toEncodable() {
    return PlasmaEventHeader.toEncodable(this)
  }
}
