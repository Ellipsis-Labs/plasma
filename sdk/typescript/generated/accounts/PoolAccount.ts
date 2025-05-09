import { PublicKey, Connection } from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface PoolAccountFields {
  poolHeader: types.PoolHeaderFields
  amm: types.AmmFields
}

export interface PoolAccountJSON {
  poolHeader: types.PoolHeaderJSON
  amm: types.AmmJSON
}

export class PoolAccount {
  readonly poolHeader: types.PoolHeader
  readonly amm: types.Amm

  static readonly discriminator = Buffer.from([
    116, 210, 187, 119, 196, 196, 52, 137,
  ])

  static readonly layout = borsh.struct([
    types.PoolHeader.layout("poolHeader"),
    types.Amm.layout("amm"),
  ])

  constructor(fields: PoolAccountFields) {
    this.poolHeader = new types.PoolHeader({ ...fields.poolHeader })
    this.amm = new types.Amm({ ...fields.amm })
  }

  static async fetch(
    c: Connection,
    address: PublicKey,
    programId: PublicKey = PROGRAM_ID
  ): Promise<PoolAccount | null> {
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
  ): Promise<Array<PoolAccount | null>> {
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

  static decode(data: Buffer): PoolAccount {
    if (!data.slice(0, 8).equals(PoolAccount.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = PoolAccount.layout.decode(data.slice(8))

    return new PoolAccount({
      poolHeader: types.PoolHeader.fromDecoded(dec.poolHeader),
      amm: types.Amm.fromDecoded(dec.amm),
    })
  }

  toJSON(): PoolAccountJSON {
    return {
      poolHeader: this.poolHeader.toJSON(),
      amm: this.amm.toJSON(),
    }
  }

  static fromJSON(obj: PoolAccountJSON): PoolAccount {
    return new PoolAccount({
      poolHeader: types.PoolHeader.fromJSON(obj.poolHeader),
      amm: types.Amm.fromJSON(obj.amm),
    })
  }
}
