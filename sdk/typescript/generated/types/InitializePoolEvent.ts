import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface InitializePoolEventFields {
  lpFeeInBps: BN
  protocolFeeInPct: BN
  feeRecipientParams: Array<types.ProtocolFeeRecipientParamsFields>
}

export interface InitializePoolEventJSON {
  lpFeeInBps: string
  protocolFeeInPct: string
  feeRecipientParams: Array<types.ProtocolFeeRecipientParamsJSON>
}

export class InitializePoolEvent {
  readonly lpFeeInBps: BN
  readonly protocolFeeInPct: BN
  readonly feeRecipientParams: Array<types.ProtocolFeeRecipientParams>

  constructor(fields: InitializePoolEventFields) {
    this.lpFeeInBps = fields.lpFeeInBps
    this.protocolFeeInPct = fields.protocolFeeInPct
    this.feeRecipientParams = fields.feeRecipientParams.map(
      (item) => new types.ProtocolFeeRecipientParams({ ...item })
    )
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u64("lpFeeInBps"),
        borsh.u64("protocolFeeInPct"),
        borsh.array(
          types.ProtocolFeeRecipientParams.layout(),
          3,
          "feeRecipientParams"
        ),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new InitializePoolEvent({
      lpFeeInBps: obj.lpFeeInBps,
      protocolFeeInPct: obj.protocolFeeInPct,
      feeRecipientParams: obj.feeRecipientParams.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.ProtocolFeeRecipientParams.fromDecoded(item)
      ),
    })
  }

  static toEncodable(fields: InitializePoolEventFields) {
    return {
      lpFeeInBps: fields.lpFeeInBps,
      protocolFeeInPct: fields.protocolFeeInPct,
      feeRecipientParams: fields.feeRecipientParams.map((item) =>
        types.ProtocolFeeRecipientParams.toEncodable(item)
      ),
    }
  }

  toJSON(): InitializePoolEventJSON {
    return {
      lpFeeInBps: this.lpFeeInBps.toString(),
      protocolFeeInPct: this.protocolFeeInPct.toString(),
      feeRecipientParams: this.feeRecipientParams.map((item) => item.toJSON()),
    }
  }

  static fromJSON(obj: InitializePoolEventJSON): InitializePoolEvent {
    return new InitializePoolEvent({
      lpFeeInBps: new BN(obj.lpFeeInBps),
      protocolFeeInPct: new BN(obj.protocolFeeInPct),
      feeRecipientParams: obj.feeRecipientParams.map((item) =>
        types.ProtocolFeeRecipientParams.fromJSON(item)
      ),
    })
  }

  toEncodable() {
    return InitializePoolEvent.toEncodable(this)
  }
}
