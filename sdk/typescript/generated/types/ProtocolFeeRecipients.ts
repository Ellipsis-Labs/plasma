import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export interface ProtocolFeeRecipientsFields {
  recipients: Array<types.ProtocolFeeRecipientFields>
  padding: Array<BN>
}

export interface ProtocolFeeRecipientsJSON {
  recipients: Array<types.ProtocolFeeRecipientJSON>
  padding: Array<string>
}

export class ProtocolFeeRecipients {
  readonly recipients: Array<types.ProtocolFeeRecipient>
  readonly padding: Array<BN>

  constructor(fields: ProtocolFeeRecipientsFields) {
    this.recipients = fields.recipients.map(
      (item) => new types.ProtocolFeeRecipient({ ...item })
    )
    this.padding = fields.padding
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.array(types.ProtocolFeeRecipient.layout(), 3, "recipients"),
        borsh.array(borsh.u64(), 12, "padding"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new ProtocolFeeRecipients({
      recipients: obj.recipients.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.ProtocolFeeRecipient.fromDecoded(item)
      ),
      padding: obj.padding,
    })
  }

  static toEncodable(fields: ProtocolFeeRecipientsFields) {
    return {
      recipients: fields.recipients.map((item) =>
        types.ProtocolFeeRecipient.toEncodable(item)
      ),
      padding: fields.padding,
    }
  }

  toJSON(): ProtocolFeeRecipientsJSON {
    return {
      recipients: this.recipients.map((item) => item.toJSON()),
      padding: this.padding.map((item) => item.toString()),
    }
  }

  static fromJSON(obj: ProtocolFeeRecipientsJSON): ProtocolFeeRecipients {
    return new ProtocolFeeRecipients({
      recipients: obj.recipients.map((item) =>
        types.ProtocolFeeRecipient.fromJSON(item)
      ),
      padding: obj.padding.map((item) => new BN(item)),
    })
  }

  toEncodable() {
    return ProtocolFeeRecipients.toEncodable(this)
  }
}
