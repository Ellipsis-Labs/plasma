import { PublicKey } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"

export type SwapFields = {
  header: types.PlasmaEventHeaderFields
  event: types.SwapEventFields
}
export type SwapValue = {
  header: types.PlasmaEventHeader
  event: types.SwapEvent
}

export interface SwapJSON {
  kind: "Swap"
  value: {
    header: types.PlasmaEventHeaderJSON
    event: types.SwapEventJSON
  }
}

export class Swap {
  static readonly discriminator = 0
  static readonly kind = "Swap"
  readonly discriminator = 0
  readonly kind = "Swap"
  readonly value: SwapValue

  constructor(value: SwapFields) {
    this.value = {
      header: new types.PlasmaEventHeader({ ...value.header }),
      event: new types.SwapEvent({ ...value.event }),
    }
  }

  toJSON(): SwapJSON {
    return {
      kind: "Swap",
      value: {
        header: this.value.header.toJSON(),
        event: this.value.event.toJSON(),
      },
    }
  }

  toEncodable() {
    return {
      Swap: {
        header: types.PlasmaEventHeader.toEncodable(this.value.header),
        event: types.SwapEvent.toEncodable(this.value.event),
      },
    }
  }
}

export type AddLiquidityFields = {
  header: types.PlasmaEventHeaderFields
  event: types.AddLiquidityEventFields
}
export type AddLiquidityValue = {
  header: types.PlasmaEventHeader
  event: types.AddLiquidityEvent
}

export interface AddLiquidityJSON {
  kind: "AddLiquidity"
  value: {
    header: types.PlasmaEventHeaderJSON
    event: types.AddLiquidityEventJSON
  }
}

export class AddLiquidity {
  static readonly discriminator = 1
  static readonly kind = "AddLiquidity"
  readonly discriminator = 1
  readonly kind = "AddLiquidity"
  readonly value: AddLiquidityValue

  constructor(value: AddLiquidityFields) {
    this.value = {
      header: new types.PlasmaEventHeader({ ...value.header }),
      event: new types.AddLiquidityEvent({ ...value.event }),
    }
  }

  toJSON(): AddLiquidityJSON {
    return {
      kind: "AddLiquidity",
      value: {
        header: this.value.header.toJSON(),
        event: this.value.event.toJSON(),
      },
    }
  }

  toEncodable() {
    return {
      AddLiquidity: {
        header: types.PlasmaEventHeader.toEncodable(this.value.header),
        event: types.AddLiquidityEvent.toEncodable(this.value.event),
      },
    }
  }
}

export type RemoveLiquidityFields = {
  header: types.PlasmaEventHeaderFields
  event: types.RemoveLiquidityEventFields
}
export type RemoveLiquidityValue = {
  header: types.PlasmaEventHeader
  event: types.RemoveLiquidityEvent
}

export interface RemoveLiquidityJSON {
  kind: "RemoveLiquidity"
  value: {
    header: types.PlasmaEventHeaderJSON
    event: types.RemoveLiquidityEventJSON
  }
}

export class RemoveLiquidity {
  static readonly discriminator = 2
  static readonly kind = "RemoveLiquidity"
  readonly discriminator = 2
  readonly kind = "RemoveLiquidity"
  readonly value: RemoveLiquidityValue

  constructor(value: RemoveLiquidityFields) {
    this.value = {
      header: new types.PlasmaEventHeader({ ...value.header }),
      event: new types.RemoveLiquidityEvent({ ...value.event }),
    }
  }

  toJSON(): RemoveLiquidityJSON {
    return {
      kind: "RemoveLiquidity",
      value: {
        header: this.value.header.toJSON(),
        event: this.value.event.toJSON(),
      },
    }
  }

  toEncodable() {
    return {
      RemoveLiquidity: {
        header: types.PlasmaEventHeader.toEncodable(this.value.header),
        event: types.RemoveLiquidityEvent.toEncodable(this.value.event),
      },
    }
  }
}

export type RenounceLiquidityFields = {
  header: types.PlasmaEventHeaderFields
  event: types.RenounceLiquidityEventFields
}
export type RenounceLiquidityValue = {
  header: types.PlasmaEventHeader
  event: types.RenounceLiquidityEvent
}

export interface RenounceLiquidityJSON {
  kind: "RenounceLiquidity"
  value: {
    header: types.PlasmaEventHeaderJSON
    event: types.RenounceLiquidityEventJSON
  }
}

export class RenounceLiquidity {
  static readonly discriminator = 3
  static readonly kind = "RenounceLiquidity"
  readonly discriminator = 3
  readonly kind = "RenounceLiquidity"
  readonly value: RenounceLiquidityValue

  constructor(value: RenounceLiquidityFields) {
    this.value = {
      header: new types.PlasmaEventHeader({ ...value.header }),
      event: new types.RenounceLiquidityEvent({ ...value.event }),
    }
  }

  toJSON(): RenounceLiquidityJSON {
    return {
      kind: "RenounceLiquidity",
      value: {
        header: this.value.header.toJSON(),
        event: this.value.event.toJSON(),
      },
    }
  }

  toEncodable() {
    return {
      RenounceLiquidity: {
        header: types.PlasmaEventHeader.toEncodable(this.value.header),
        event: types.RenounceLiquidityEvent.toEncodable(this.value.event),
      },
    }
  }
}

export type WithdrawLpFeesFields = {
  header: types.PlasmaEventHeaderFields
  event: types.WithdrawLpFeesEventFields
}
export type WithdrawLpFeesValue = {
  header: types.PlasmaEventHeader
  event: types.WithdrawLpFeesEvent
}

export interface WithdrawLpFeesJSON {
  kind: "WithdrawLpFees"
  value: {
    header: types.PlasmaEventHeaderJSON
    event: types.WithdrawLpFeesEventJSON
  }
}

export class WithdrawLpFees {
  static readonly discriminator = 4
  static readonly kind = "WithdrawLpFees"
  readonly discriminator = 4
  readonly kind = "WithdrawLpFees"
  readonly value: WithdrawLpFeesValue

  constructor(value: WithdrawLpFeesFields) {
    this.value = {
      header: new types.PlasmaEventHeader({ ...value.header }),
      event: new types.WithdrawLpFeesEvent({ ...value.event }),
    }
  }

  toJSON(): WithdrawLpFeesJSON {
    return {
      kind: "WithdrawLpFees",
      value: {
        header: this.value.header.toJSON(),
        event: this.value.event.toJSON(),
      },
    }
  }

  toEncodable() {
    return {
      WithdrawLpFees: {
        header: types.PlasmaEventHeader.toEncodable(this.value.header),
        event: types.WithdrawLpFeesEvent.toEncodable(this.value.event),
      },
    }
  }
}

export type InitializeLpPositionFields = {
  header: types.PlasmaEventHeaderFields
  event: types.InitializeLpPositionEventFields
}
export type InitializeLpPositionValue = {
  header: types.PlasmaEventHeader
  event: types.InitializeLpPositionEvent
}

export interface InitializeLpPositionJSON {
  kind: "InitializeLpPosition"
  value: {
    header: types.PlasmaEventHeaderJSON
    event: types.InitializeLpPositionEventJSON
  }
}

export class InitializeLpPosition {
  static readonly discriminator = 5
  static readonly kind = "InitializeLpPosition"
  readonly discriminator = 5
  readonly kind = "InitializeLpPosition"
  readonly value: InitializeLpPositionValue

  constructor(value: InitializeLpPositionFields) {
    this.value = {
      header: new types.PlasmaEventHeader({ ...value.header }),
      event: new types.InitializeLpPositionEvent({ ...value.event }),
    }
  }

  toJSON(): InitializeLpPositionJSON {
    return {
      kind: "InitializeLpPosition",
      value: {
        header: this.value.header.toJSON(),
        event: this.value.event.toJSON(),
      },
    }
  }

  toEncodable() {
    return {
      InitializeLpPosition: {
        header: types.PlasmaEventHeader.toEncodable(this.value.header),
        event: types.InitializeLpPositionEvent.toEncodable(this.value.event),
      },
    }
  }
}

export type InitializePoolFields = {
  header: types.PlasmaEventHeaderFields
  event: types.InitializePoolEventFields
}
export type InitializePoolValue = {
  header: types.PlasmaEventHeader
  event: types.InitializePoolEvent
}

export interface InitializePoolJSON {
  kind: "InitializePool"
  value: {
    header: types.PlasmaEventHeaderJSON
    event: types.InitializePoolEventJSON
  }
}

export class InitializePool {
  static readonly discriminator = 6
  static readonly kind = "InitializePool"
  readonly discriminator = 6
  readonly kind = "InitializePool"
  readonly value: InitializePoolValue

  constructor(value: InitializePoolFields) {
    this.value = {
      header: new types.PlasmaEventHeader({ ...value.header }),
      event: new types.InitializePoolEvent({ ...value.event }),
    }
  }

  toJSON(): InitializePoolJSON {
    return {
      kind: "InitializePool",
      value: {
        header: this.value.header.toJSON(),
        event: this.value.event.toJSON(),
      },
    }
  }

  toEncodable() {
    return {
      InitializePool: {
        header: types.PlasmaEventHeader.toEncodable(this.value.header),
        event: types.InitializePoolEvent.toEncodable(this.value.event),
      },
    }
  }
}

export type WithdrawProtocolFeesFields = {
  header: types.PlasmaEventHeaderFields
  event: types.WithdrawProtocolFeesEventFields
}
export type WithdrawProtocolFeesValue = {
  header: types.PlasmaEventHeader
  event: types.WithdrawProtocolFeesEvent
}

export interface WithdrawProtocolFeesJSON {
  kind: "WithdrawProtocolFees"
  value: {
    header: types.PlasmaEventHeaderJSON
    event: types.WithdrawProtocolFeesEventJSON
  }
}

export class WithdrawProtocolFees {
  static readonly discriminator = 7
  static readonly kind = "WithdrawProtocolFees"
  readonly discriminator = 7
  readonly kind = "WithdrawProtocolFees"
  readonly value: WithdrawProtocolFeesValue

  constructor(value: WithdrawProtocolFeesFields) {
    this.value = {
      header: new types.PlasmaEventHeader({ ...value.header }),
      event: new types.WithdrawProtocolFeesEvent({ ...value.event }),
    }
  }

  toJSON(): WithdrawProtocolFeesJSON {
    return {
      kind: "WithdrawProtocolFees",
      value: {
        header: this.value.header.toJSON(),
        event: this.value.event.toJSON(),
      },
    }
  }

  toEncodable() {
    return {
      WithdrawProtocolFees: {
        header: types.PlasmaEventHeader.toEncodable(this.value.header),
        event: types.WithdrawProtocolFeesEvent.toEncodable(this.value.event),
      },
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.PlasmaEventKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("Swap" in obj) {
    const val = obj["Swap"]
    return new Swap({
      header: types.PlasmaEventHeader.fromDecoded(val["header"]),
      event: types.SwapEvent.fromDecoded(val["event"]),
    })
  }
  if ("AddLiquidity" in obj) {
    const val = obj["AddLiquidity"]
    return new AddLiquidity({
      header: types.PlasmaEventHeader.fromDecoded(val["header"]),
      event: types.AddLiquidityEvent.fromDecoded(val["event"]),
    })
  }
  if ("RemoveLiquidity" in obj) {
    const val = obj["RemoveLiquidity"]
    return new RemoveLiquidity({
      header: types.PlasmaEventHeader.fromDecoded(val["header"]),
      event: types.RemoveLiquidityEvent.fromDecoded(val["event"]),
    })
  }
  if ("RenounceLiquidity" in obj) {
    const val = obj["RenounceLiquidity"]
    return new RenounceLiquidity({
      header: types.PlasmaEventHeader.fromDecoded(val["header"]),
      event: types.RenounceLiquidityEvent.fromDecoded(val["event"]),
    })
  }
  if ("WithdrawLpFees" in obj) {
    const val = obj["WithdrawLpFees"]
    return new WithdrawLpFees({
      header: types.PlasmaEventHeader.fromDecoded(val["header"]),
      event: types.WithdrawLpFeesEvent.fromDecoded(val["event"]),
    })
  }
  if ("InitializeLpPosition" in obj) {
    const val = obj["InitializeLpPosition"]
    return new InitializeLpPosition({
      header: types.PlasmaEventHeader.fromDecoded(val["header"]),
      event: types.InitializeLpPositionEvent.fromDecoded(val["event"]),
    })
  }
  if ("InitializePool" in obj) {
    const val = obj["InitializePool"]
    return new InitializePool({
      header: types.PlasmaEventHeader.fromDecoded(val["header"]),
      event: types.InitializePoolEvent.fromDecoded(val["event"]),
    })
  }
  if ("WithdrawProtocolFees" in obj) {
    const val = obj["WithdrawProtocolFees"]
    return new WithdrawProtocolFees({
      header: types.PlasmaEventHeader.fromDecoded(val["header"]),
      event: types.WithdrawProtocolFeesEvent.fromDecoded(val["event"]),
    })
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(obj: types.PlasmaEventJSON): types.PlasmaEventKind {
  switch (obj.kind) {
    case "Swap": {
      return new Swap({
        header: types.PlasmaEventHeader.fromJSON(obj.value.header),
        event: types.SwapEvent.fromJSON(obj.value.event),
      })
    }
    case "AddLiquidity": {
      return new AddLiquidity({
        header: types.PlasmaEventHeader.fromJSON(obj.value.header),
        event: types.AddLiquidityEvent.fromJSON(obj.value.event),
      })
    }
    case "RemoveLiquidity": {
      return new RemoveLiquidity({
        header: types.PlasmaEventHeader.fromJSON(obj.value.header),
        event: types.RemoveLiquidityEvent.fromJSON(obj.value.event),
      })
    }
    case "RenounceLiquidity": {
      return new RenounceLiquidity({
        header: types.PlasmaEventHeader.fromJSON(obj.value.header),
        event: types.RenounceLiquidityEvent.fromJSON(obj.value.event),
      })
    }
    case "WithdrawLpFees": {
      return new WithdrawLpFees({
        header: types.PlasmaEventHeader.fromJSON(obj.value.header),
        event: types.WithdrawLpFeesEvent.fromJSON(obj.value.event),
      })
    }
    case "InitializeLpPosition": {
      return new InitializeLpPosition({
        header: types.PlasmaEventHeader.fromJSON(obj.value.header),
        event: types.InitializeLpPositionEvent.fromJSON(obj.value.event),
      })
    }
    case "InitializePool": {
      return new InitializePool({
        header: types.PlasmaEventHeader.fromJSON(obj.value.header),
        event: types.InitializePoolEvent.fromJSON(obj.value.event),
      })
    }
    case "WithdrawProtocolFees": {
      return new WithdrawProtocolFees({
        header: types.PlasmaEventHeader.fromJSON(obj.value.header),
        event: types.WithdrawProtocolFeesEvent.fromJSON(obj.value.event),
      })
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct(
      [
        types.PlasmaEventHeader.layout("header"),
        types.SwapEvent.layout("event"),
      ],
      "Swap"
    ),
    borsh.struct(
      [
        types.PlasmaEventHeader.layout("header"),
        types.AddLiquidityEvent.layout("event"),
      ],
      "AddLiquidity"
    ),
    borsh.struct(
      [
        types.PlasmaEventHeader.layout("header"),
        types.RemoveLiquidityEvent.layout("event"),
      ],
      "RemoveLiquidity"
    ),
    borsh.struct(
      [
        types.PlasmaEventHeader.layout("header"),
        types.RenounceLiquidityEvent.layout("event"),
      ],
      "RenounceLiquidity"
    ),
    borsh.struct(
      [
        types.PlasmaEventHeader.layout("header"),
        types.WithdrawLpFeesEvent.layout("event"),
      ],
      "WithdrawLpFees"
    ),
    borsh.struct(
      [
        types.PlasmaEventHeader.layout("header"),
        types.InitializeLpPositionEvent.layout("event"),
      ],
      "InitializeLpPosition"
    ),
    borsh.struct(
      [
        types.PlasmaEventHeader.layout("header"),
        types.InitializePoolEvent.layout("event"),
      ],
      "InitializePool"
    ),
    borsh.struct(
      [
        types.PlasmaEventHeader.layout("header"),
        types.WithdrawProtocolFeesEvent.layout("event"),
      ],
      "WithdrawProtocolFees"
    ),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
