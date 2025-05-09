import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface LpPositionAccountFields {
  authority: PublicKey
  pool: PublicKey
  status: BN
  lpPosition: types.LpPositionFields
}

export interface LpPositionAccountJSON {
  authority: string
  pool: string
  status: string
  lpPosition: types.LpPositionJSON
}

export class LpPositionAccount {
  readonly authority: PublicKey
  readonly pool: PublicKey
  readonly status: BN
  readonly lpPosition: types.LpPosition

  static readonly discriminator = Buffer.from([
    101, 177, 26, 44, 161, 242, 87, 136,
  ])

  static readonly layout = borsh.struct([
    borsh.publicKey("authority"),
    borsh.publicKey("pool"),
    borsh.u64("status"),
    types.LpPosition.layout("lpPosition"),
  ])

  constructor(fields: LpPositionAccountFields) {
    this.authority = fields.authority
    this.pool = fields.pool
    this.status = fields.status
    this.lpPosition = new types.LpPosition({ ...fields.lpPosition })
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<LpPositionAccount | null> {
    const info = await c.getAccountInfo(address)

    if (info === null) {
      return null
    }
    if (!info.owner.equals(programId)) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(info.data)
  }

  static async fetchMultiple(
    c: Connection,
    addresses: PublicKey[],
    programId: PublicKey = PROGRAM_ID
  ): Promise<Array<LpPositionAccount | null>> {
    const infos = await c.getMultipleAccountsInfo(addresses)

    return infos.map((info) => {
      if (info === null) {
        return null
      }
      if (!info.owner.equals(programId)) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(info.data)
    })
  }

  static decode(data: Buffer): LpPositionAccount {
    if (!data.slice(0, 8).equals(LpPositionAccount.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = LpPositionAccount.layout.decode(data.slice(8))

    return new LpPositionAccount({
      authority: dec.authority,
      pool: dec.pool,
      status: dec.status,
      lpPosition: types.LpPosition.fromDecoded(dec.lpPosition),
    })
  }

  toJSON(): LpPositionAccountJSON {
    return {
      authority: this.authority.toString(),
      pool: this.pool.toString(),
      status: this.status.toString(),
      lpPosition: this.lpPosition.toJSON(),
    }
  }

  static fromJSON(obj: LpPositionAccountJSON): LpPositionAccount {
    return new LpPositionAccount({
      authority: new PublicKey(obj.authority),
      pool: new PublicKey(obj.pool),
      status: new BN(obj.status),
      lpPosition: types.LpPosition.fromJSON(obj.lpPosition),
    })
  }
}
