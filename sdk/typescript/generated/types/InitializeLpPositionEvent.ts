import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface InitializeLpPositionEventFields {
  owner: PublicKey
}

export interface InitializeLpPositionEventJSON {
  owner: string
}

export class InitializeLpPositionEvent {
  readonly owner: PublicKey

  constructor(fields: InitializeLpPositionEventFields) {
    this.owner = fields.owner
  }

  static layout(property?: string) {
    return borsh.struct([borsh.publicKey("owner")], property)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new InitializeLpPositionEvent({
      owner: obj.owner,
    })
  }

  static toEncodable(fields: InitializeLpPositionEventFields) {
    return {
      owner: fields.owner,
    }
  }

  toJSON(): InitializeLpPositionEventJSON {
    return {
      owner: this.owner.toString(),
    }
  }

  static fromJSON(
    obj: InitializeLpPositionEventJSON
  ): InitializeLpPositionEvent {
    return new InitializeLpPositionEvent({
      owner: new PublicKey(obj.owner),
    })
  }

  toEncodable() {
    return InitializeLpPositionEvent.toEncodable(this)
  }
}
