import { PROGRAM_ID } from "../generated/programId";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  MintLayout,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  AddLiquidity,
  InitializeLpPosition,
  InitializePool,
  RemoveLiquidity,
  RenounceLiquidity,
  Swap,
  WithdrawProtocolFees,
  WithdrawLpFees,
} from "../generated/instructions";
import { LpPositionAccount, PoolAccount } from "../generated/accounts";
import BN from "bn.js";
import { ProtocolFeeRecipientParams, Side } from "../generated/types";
import assert from "assert";
import { ExactIn } from "../generated/types/SwapType";
import { FixedPoint } from "../util/FixedPoint";

// We'll assume the following constants for the the initial liquidity deposit
const GRADUATION_AMOUNT = 279_900_000_000_000;
const GRADUATION_SOL_AMOUNT = 100_000_000_000;
const AMM_SIZE = 8 + 8 + 16 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8; // fee, protocol allocation, reward factor, total lp shares, slot snapshot, base reserves snapshot, quote reserves snapshot, base reserves, quote reserves, cumulative quote lp fees, cumulative quote protocol fees
const TOKEN_PARAMS_SIZE = 4 + 4 + 32 + 32; // decimals, vault bump, mint key, vault key
const PROTOCOL_FEE_RECIPIENTS_SIZE = (32 + 8 + 8 + 8) * 3 + 12 * 8; // Recipient, shares, total fees, collected fees times 3 plus 12 u64s padding
const POOL_HEADER_SIZE =
  8 + 8 + 2 * TOKEN_PARAMS_SIZE + PROTOCOL_FEE_RECIPIENTS_SIZE + 13 * 8; // Discriminator, sequence number, base params, quote params, fee recipients, padding

const LOG_AUTHORITY = PublicKey.findProgramAddressSync(
  [Buffer.from("log")],
  PROGRAM_ID
)[0];

export const sqrt = (num: BN): BN => {
  if (num.lt(new BN(0))) {
    throw new Error("Sqrt only works on non-negative inputs");
  }
  if (num.lt(new BN(2))) {
    return num;
  }

  const smallCand = sqrt(num.shrn(2)).shln(1);
  const largeCand = smallCand.add(new BN(1));

  if (largeCand.mul(largeCand).gt(num)) {
    return smallCand;
  } else {
    return largeCand;
  }
};

const bootstrapTrader = async (
  c: Connection,
  mintPubkey: PublicKey
): Promise<[Keypair, PublicKey, PublicKey]> => {
  const trader = Keypair.generate();
  const airdropTx = await c.requestAirdrop(trader.publicKey, 500_000_000_000);
  await c.confirmTransaction(airdropTx, "confirmed");

  const mintAtaTrader = await getAssociatedTokenAddress(
    mintPubkey,
    trader.publicKey
  );
  const wSolAtaTrader = await getAssociatedTokenAddress(
    NATIVE_MINT,
    trader.publicKey
  );
  const initTraderTx = new Transaction()
    .add(
      createAssociatedTokenAccountInstruction(
        trader.publicKey,
        mintAtaTrader,
        trader.publicKey,
        mintPubkey
      )
    )
    .add(
      createAssociatedTokenAccountInstruction(
        trader.publicKey,
        wSolAtaTrader,
        trader.publicKey,
        NATIVE_MINT
      )
    )
    .add(
      SystemProgram.transfer({
        fromPubkey: trader.publicKey,
        toPubkey: wSolAtaTrader,
        lamports: 100_000_000_000, // 100 SOL
      })
    )
    .add(createSyncNativeInstruction(wSolAtaTrader));
  await sendAndConfirmTransaction(c, initTraderTx, [trader], {
    commitment: "confirmed",
    skipPreflight: true,
  });
  return [trader, mintAtaTrader, wSolAtaTrader];
};

const initPool = async (
  c: Connection,
  poolKeypair: Keypair,
  payer: Keypair,
  mintPubkey: PublicKey,
  mintAtaPayer: PublicKey,
  wSolAtaPayer: PublicKey,
  initialLpShares: BN,
  feeRecipients: ProtocolFeeRecipientParams[]
) => {
  const initTx = new Transaction()
    .add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: poolKeypair.publicKey,
        lamports: await c.getMinimumBalanceForRentExemption(
          POOL_HEADER_SIZE + AMM_SIZE
        ),
        space: POOL_HEADER_SIZE + AMM_SIZE,
        programId: PROGRAM_ID,
      })
    )
    .add(
      InitializePool(
        {
          params: {
            lpFeeInBps: new BN(25),
            protocolLpFeeAllocationInPct: new BN(10),
            feeRecipientsParams: feeRecipients,
            numSlotsToVestLpShares: new BN(1),
          },
        },
        {
          plasmaProgram: PROGRAM_ID,
          logAuthority: LOG_AUTHORITY,
          pool: poolKeypair.publicKey,
          poolCreator: payer.publicKey,
          baseMint: mintPubkey,
          quoteMint: NATIVE_MINT,
          baseVault: PublicKey.findProgramAddressSync(
            [
              Buffer.from("vault"),
              poolKeypair.publicKey.toBuffer(),
              mintPubkey.toBuffer(),
            ],
            PROGRAM_ID
          )[0],
          quoteVault: PublicKey.findProgramAddressSync(
            [
              Buffer.from("vault"),
              poolKeypair.publicKey.toBuffer(),
              NATIVE_MINT.toBuffer(),
            ],
            PROGRAM_ID
          )[0],
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      )
    )
    .add(
      InitializeLpPosition({
        plasmaProgram: PROGRAM_ID,
        logAuthority: LOG_AUTHORITY,
        pool: poolKeypair.publicKey,
        payer: payer.publicKey,
        lpPositionOwner: payer.publicKey,
        lpPosition: PublicKey.findProgramAddressSync(
          [
            Buffer.from("lp_position"),
            poolKeypair.publicKey.toBuffer(),
            payer.publicKey.toBuffer(),
          ],
          PROGRAM_ID
        )[0],
        systemProgram: SystemProgram.programId,
      })
    )
    .add(
      AddLiquidity(
        {
          params: {
            desiredBaseAmountIn: new BN(GRADUATION_AMOUNT),
            desiredQuoteAmountIn: new BN(GRADUATION_SOL_AMOUNT),
            initialLpShares,
          },
        },
        {
          plasmaProgram: PROGRAM_ID,
          logAuthority: LOG_AUTHORITY,
          pool: poolKeypair.publicKey,
          trader: payer.publicKey,
          lpPosition: PublicKey.findProgramAddressSync(
            [
              Buffer.from("lp_position"),
              poolKeypair.publicKey.toBuffer(),
              payer.publicKey.toBuffer(),
            ],
            PROGRAM_ID
          )[0],
          baseAccount: mintAtaPayer,
          quoteAccount: wSolAtaPayer,
          baseVault: PublicKey.findProgramAddressSync(
            [
              Buffer.from("vault"),
              poolKeypair.publicKey.toBuffer(),
              mintPubkey.toBuffer(),
            ],
            PROGRAM_ID
          )[0],
          quoteVault: PublicKey.findProgramAddressSync(
            [
              Buffer.from("vault"),
              poolKeypair.publicKey.toBuffer(),
              NATIVE_MINT.toBuffer(),
            ],
            PROGRAM_ID
          )[0],
          tokenProgram: TOKEN_PROGRAM_ID,
        }
      )
    )
    .add(
      RenounceLiquidity(
        {
          params: {
            allowFeeWithdrawal: true,
          },
        },
        {
          plasmaProgram: PROGRAM_ID,
          logAuthority: LOG_AUTHORITY,
          pool: poolKeypair.publicKey,
          trader: payer.publicKey,
          lpPosition: PublicKey.findProgramAddressSync(
            [
              Buffer.from("lp_position"),
              poolKeypair.publicKey.toBuffer(),
              payer.publicKey.toBuffer(),
            ],
            PROGRAM_ID
          )[0],
        }
      )
    );
  await sendAndConfirmTransaction(c, initTx, [payer, poolKeypair], {
    commitment: "confirmed",
    skipPreflight: true,
  });
  return [mintPubkey, mintAtaPayer, wSolAtaPayer];
};

const setupMint = async (
  c: Connection,
  payer: Keypair
): Promise<[PublicKey, PublicKey, PublicKey]> => {
  const mintKeypair = Keypair.generate();
  const mintAtaPayer = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    payer.publicKey
  );
  const wSolAtaPayer = await getAssociatedTokenAddress(
    NATIVE_MINT,
    payer.publicKey
  );
  const initMintTx = new Transaction()
    .add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports: await c.getMinimumBalanceForRentExemption(MintLayout.span),
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
      })
    )
    .add(
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        6,
        payer.publicKey,
        null
      )
    )
    .add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        mintAtaPayer,
        payer.publicKey,
        mintKeypair.publicKey
      )
    )
    .add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        wSolAtaPayer,
        payer.publicKey,
        NATIVE_MINT
      )
    )
    .add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: wSolAtaPayer,
        lamports: GRADUATION_SOL_AMOUNT * 2,
      })
    )
    .add(createSyncNativeInstruction(wSolAtaPayer))
    .add(
      createMintToInstruction(
        mintKeypair.publicKey,
        mintAtaPayer,
        payer.publicKey,
        GRADUATION_AMOUNT * 2
      )
    );
  await sendAndConfirmTransaction(c, initMintTx, [payer, mintKeypair], {
    commitment: "confirmed",
  });
  return [mintKeypair.publicKey, mintAtaPayer, wSolAtaPayer];
};

describe("Plasma AMM", async () => {
  const c = new Connection("http://127.0.0.1:8899", "confirmed");
  const payer = Keypair.generate();
  const traders: [Keypair, PublicKey, PublicKey][] = [];
  let mintPubkey: PublicKey;
  let mintAtaPayer: PublicKey;
  let wSolAtaPayer: PublicKey;
  let poolKey: PublicKey;
  let poolKeyCopy: PublicKey;

  before(async () => {
    console.log("Airdropping to payer");
    const airdropTx = await c.requestAirdrop(
      payer.publicKey,
      1_000_000_000_000
    );
    console.log("Confirming airdrop");
    await c.confirmTransaction(airdropTx, "confirmed");
    [mintPubkey, mintAtaPayer, wSolAtaPayer] = await setupMint(c, payer);
    for (let i = 0; i < 4; i++) {
      traders.push(await bootstrapTrader(c, mintPubkey));
    }
  });

  describe("Pool Initialization", () => {
    it("should fail to initialize the pool if protocol fee recipients are the same", async () => {
      const initialLpShares = sqrt(
        new BN(GRADUATION_AMOUNT).mul(new BN(GRADUATION_SOL_AMOUNT))
      );
      const feeRecipients = [
        new ProtocolFeeRecipientParams({
          recipient: traders[0][0].publicKey,
          shares: new BN(100),
        }),
        new ProtocolFeeRecipientParams({
          recipient: traders[0][0].publicKey,
          shares: new BN(100),
        }),
        new ProtocolFeeRecipientParams({
          recipient: traders[0][0].publicKey,
          shares: new BN(100),
        }),
      ];

      const poolKeypair = Keypair.generate();
      try {
        await initPool(
          c,
          poolKeypair,
          payer,
          mintPubkey,
          mintAtaPayer,
          wSolAtaPayer,
          initialLpShares,
          feeRecipients
        );

        assert(false);
      } catch (err) {}
    });

    it("should initialize the pool and deposit initial liquidity", async () => {
      const initialLpShares = sqrt(
        new BN(GRADUATION_AMOUNT).mul(new BN(GRADUATION_SOL_AMOUNT))
      );

      const feeRecipients = [
        new ProtocolFeeRecipientParams({
          recipient: traders[0][0].publicKey,
          shares: new BN(100),
        }),
        new ProtocolFeeRecipientParams({
          recipient: traders[1][0].publicKey,
          shares: new BN(100),
        }),
        new ProtocolFeeRecipientParams({
          recipient: traders[2][0].publicKey,
          shares: new BN(100),
        }),
      ];

      const poolKeypair = Keypair.generate();
      await initPool(
        c,
        poolKeypair,
        payer,
        mintPubkey,
        mintAtaPayer,
        wSolAtaPayer,
        initialLpShares,
        feeRecipients
      );

      poolKey = poolKeypair.publicKey;

      // Create a copy of the pool to test sandwich attacks
      const poolKeypairCopy = Keypair.generate();
      await initPool(
        c,
        poolKeypairCopy,
        payer,
        mintPubkey,
        mintAtaPayer,
        wSolAtaPayer,
        initialLpShares,
        feeRecipients
      );

      poolKeyCopy = poolKeypairCopy.publicKey;

      try {
        const removeLiqTx = new Transaction().add(
          RemoveLiquidity(
            {
              params: {
                lpShares: initialLpShares,
              },
            },
            {
              plasmaProgram: PROGRAM_ID,
              logAuthority: LOG_AUTHORITY,
              pool: poolKeypair.publicKey,
              trader: payer.publicKey,
              lpPosition: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("lp_position"),
                  poolKeypair.publicKey.toBuffer(),
                  payer.publicKey.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              baseAccount: mintAtaPayer,
              quoteAccount: wSolAtaPayer,
              baseVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKeypair.publicKey.toBuffer(),
                  mintPubkey.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              quoteVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKeypair.publicKey.toBuffer(),
                  NATIVE_MINT.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              tokenProgram: TOKEN_PROGRAM_ID,
            }
          )
        );
        await sendAndConfirmTransaction(c, removeLiqTx, [payer], {
          commitment: "confirmed",
        });
        assert(false);
      } catch (err) {}
    });
  });

  describe("Test Sandwich Attack Prevention", () => {
    it("TEST: show that sandwiches across slot windows are still profitable", async () => {
      const [attacker, mintAtaAttacker, wSolAtaAttacker] = traders[0];
      const [victim, mintAtaVictim, wSolAtaVictim] = traders[1];

      const attackerStartingBalance = new BN(
        (
          await c.getTokenAccountBalance(wSolAtaAttacker, "confirmed")
        ).value.amount
      );

      console.log(
        `\t 😈 Attacker starting balance: ${(
          attackerStartingBalance.toNumber() / 1e9
        ).toString()} SOL`
      );

      console.log();
      console.log(`\t ---- BEGIN ATTACK ----`);
      console.log();

      let atomicFrontrunTx = new Transaction()
        .add(
          Swap(
            {
              params: {
                side: new Side.Buy(),
                swapType: new ExactIn({
                  amountIn: new BN(2_000_000_000),
                  minAmountOut: new BN(0),
                }),
              },
            },
            {
              plasmaProgram: PROGRAM_ID,
              logAuthority: LOG_AUTHORITY,
              pool: poolKey,
              trader: attacker.publicKey,
              baseAccount: mintAtaAttacker,
              quoteAccount: wSolAtaAttacker,
              baseVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKey.toBuffer(),
                  mintPubkey.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              quoteVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKey.toBuffer(),
                  NATIVE_MINT.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              tokenProgram: TOKEN_PROGRAM_ID,
            }
          )
        )
        .add(
          Swap(
            {
              params: {
                side: new Side.Buy(),
                swapType: new ExactIn({
                  amountIn: new BN(1000_000_000),
                  minAmountOut: new BN(0),
                }),
              },
            },
            {
              plasmaProgram: PROGRAM_ID,
              logAuthority: LOG_AUTHORITY,
              pool: poolKey,
              trader: victim.publicKey,
              baseAccount: mintAtaVictim,
              quoteAccount: wSolAtaVictim,
              baseVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKey.toBuffer(),
                  mintPubkey.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              quoteVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKey.toBuffer(),
                  NATIVE_MINT.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              tokenProgram: TOKEN_PROGRAM_ID,
            }
          )
        );

      const txId = await sendAndConfirmTransaction(
        c,
        atomicFrontrunTx,
        [attacker, victim],
        {
          commitment: "confirmed",
          skipPreflight: true,
        }
      );

      const attackerMintBalance = new BN(
        (
          await c.getTokenAccountBalance(mintAtaAttacker, "confirmed")
        ).value.amount
      );

      const currentSlot = await c.getSlot("confirmed");
      console.log(
        `\t Current slot: ${currentSlot} (next slot window: ${
          ((currentSlot + 4) / 4) * 4
        })`
      );
      const attackerIntermidiateSolBalance = new BN(
        (
          await c.getTokenAccountBalance(wSolAtaAttacker, "confirmed")
        ).value.amount
      );

      const victimMintBalance = new BN(
        (
          await c.getTokenAccountBalance(mintAtaVictim, "confirmed")
        ).value.amount
      );

      console.log(
        `\t 😈 Attacker swapped 2 SOL for ${
          attackerMintBalance.toNumber() / 1e6
        } tokens`
      );
      console.log(
        `\t 😇 Victim swapped 1 SOL for ${
          victimMintBalance.toNumber() / 1e6
        } tokens`
      );

      const txContents = await c.getTransaction(txId, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      if (txContents === null || !txContents?.slot) {
        new Error("Transaction not found");
      }
      const txSnapshotSlot = ((txContents?.slot || 0) >> 2) << 2;

      // Spin until we are confident that the pool has reset
      while ((await c.getSlot("confirmed")) < txSnapshotSlot + 4) {}

      let atomicBackrunTx = new Transaction().add(
        Swap(
          {
            params: {
              side: new Side.Sell(),
              swapType: new ExactIn({
                amountIn: attackerMintBalance,
                minAmountOut: new BN(2_000_000_000),
              }),
            },
          },
          {
            plasmaProgram: PROGRAM_ID,
            logAuthority: LOG_AUTHORITY,
            pool: poolKey,
            trader: attacker.publicKey,
            baseAccount: mintAtaAttacker,
            quoteAccount: wSolAtaAttacker,
            baseVault: PublicKey.findProgramAddressSync(
              [Buffer.from("vault"), poolKey.toBuffer(), mintPubkey.toBuffer()],
              PROGRAM_ID
            )[0],
            quoteVault: PublicKey.findProgramAddressSync(
              [
                Buffer.from("vault"),
                poolKey.toBuffer(),
                NATIVE_MINT.toBuffer(),
              ],
              PROGRAM_ID
            )[0],
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        )
      );

      await sendAndConfirmTransaction(c, atomicBackrunTx, [attacker], {
        commitment: "confirmed",
        skipPreflight: true,
      });

      const attackerRemainingMintBalance = new BN(
        (
          await c.getTokenAccountBalance(mintAtaAttacker, "confirmed")
        ).value.amount
      );

      assert(attackerRemainingMintBalance.eq(new BN(0)));

      const attackerEndingBalance = new BN(
        (
          await c.getTokenAccountBalance(wSolAtaAttacker, "confirmed")
        ).value.amount
      );

      console.log();
      console.log(`\t ---- WAIT UNTIL THE NEXT SLOT WINDOW ----`);
      console.log();

      console.log(`\t Current slot: ${txSnapshotSlot + 4}`);
      console.log(
        `\t 😈 Attacker swapped ${
          attackerMintBalance.toNumber() / 1e6
        } tokens for ${
          attackerEndingBalance.sub(attackerIntermidiateSolBalance).toNumber() /
          1e9
        } SOL`
      );

      console.log();
      console.log(`\t ---- FINAL RESULT ----`);
      console.log();

      console.log(
        `\t 😈 Attacker ending balance: ${
          attackerEndingBalance.toNumber() / 1e9
        } SOL`
      );

      console.log(
        `\t 😈 Attacker made a profit of ${
          (attackerEndingBalance.toNumber() -
            attackerStartingBalance.toNumber()) /
          1e9
        } SOL`
      );

      console.log();
      console.log("\t ❌❌❌ 🙅🙅🙅 😭😭😭");

      assert(attackerEndingBalance.gt(attackerStartingBalance));
    });
    it("TEST: show that sandwiches in the same slot window are no longer profitable", async () => {
      const [attacker, mintAtaAttacker, wSolAtaAttacker] = traders[2];
      const [victim, mintAtaVictim, wSolAtaVictim] = traders[3];

      // Wait until the current slot is divisible by 4 (on the boundary).
      // Note that this is a bit of a hack and it would be far better to test this behavior in a more controlled environment
      // like solana-program-test or bankrun where we can control the clock
      while ((await c.getSlot("confirmed")) % 4 != 0) {}

      const attackerStartingBalance = new BN(
        (
          await c.getTokenAccountBalance(wSolAtaAttacker, "confirmed")
        ).value.amount
      );

      console.log(
        `\t 😈 Attacker starting balance: ${(
          attackerStartingBalance.toNumber() / 1e9
        ).toString()} SOL`
      );

      console.log();
      console.log(`\t ---- BEGIN ATTACK ----`);
      console.log();

      const slot = await c.getSlot("confirmed");

      let atomicFrontrunTx = new Transaction()
        .add(
          Swap(
            {
              params: {
                side: new Side.Buy(),
                swapType: new ExactIn({
                  amountIn: new BN(2_000_000_000),
                  minAmountOut: new BN(0),
                }),
              },
            },
            {
              plasmaProgram: PROGRAM_ID,
              logAuthority: LOG_AUTHORITY,
              pool: poolKeyCopy,
              trader: attacker.publicKey,
              baseAccount: mintAtaAttacker,
              quoteAccount: wSolAtaAttacker,
              baseVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKeyCopy.toBuffer(),
                  mintPubkey.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              quoteVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKeyCopy.toBuffer(),
                  NATIVE_MINT.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              tokenProgram: TOKEN_PROGRAM_ID,
            }
          )
        )
        .add(
          Swap(
            {
              params: {
                side: new Side.Buy(),
                swapType: new ExactIn({
                  amountIn: new BN(1_000_000_000),
                  minAmountOut: new BN(0),
                }),
              },
            },
            {
              plasmaProgram: PROGRAM_ID,
              logAuthority: LOG_AUTHORITY,
              pool: poolKeyCopy,
              trader: victim.publicKey,
              baseAccount: mintAtaVictim,
              quoteAccount: wSolAtaVictim,
              baseVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKeyCopy.toBuffer(),
                  mintPubkey.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              quoteVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKeyCopy.toBuffer(),
                  NATIVE_MINT.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              tokenProgram: TOKEN_PROGRAM_ID,
            }
          )
        );
      await sendAndConfirmTransaction(c, atomicFrontrunTx, [attacker, victim], {
        commitment: "confirmed",
        skipPreflight: true,
      });

      const attackerMintBalance = new BN(
        (
          await c.getTokenAccountBalance(mintAtaAttacker, "confirmed")
        ).value.amount
      );

      console.log(
        `\t Current slot: ${slot} (next slot window: ${((slot + 4) / 4) * 4})`
      );
      const attackerIntermidiateSolBalance = new BN(
        (
          await c.getTokenAccountBalance(wSolAtaAttacker, "confirmed")
        ).value.amount
      );

      const victimMintBalance = new BN(
        (
          await c.getTokenAccountBalance(mintAtaVictim, "confirmed")
        ).value.amount
      );

      console.log(
        `\t 😈 Attacker swapped 2 SOL for ${
          attackerMintBalance.toNumber() / 1e6
        } tokens`
      );
      console.log(
        `\t 😇 Victim swapped 1 SOL for ${
          victimMintBalance.toNumber() / 1e6
        } tokens`
      );

      let atomicBackrunTx = new Transaction().add(
        Swap(
          {
            params: {
              side: new Side.Sell(),
              swapType: new ExactIn({
                amountIn: attackerMintBalance,
                minAmountOut: new BN(0),
              }),
            },
          },
          {
            plasmaProgram: PROGRAM_ID,
            logAuthority: LOG_AUTHORITY,
            pool: poolKeyCopy,
            trader: attacker.publicKey,
            baseAccount: mintAtaAttacker,
            quoteAccount: wSolAtaAttacker,
            baseVault: PublicKey.findProgramAddressSync(
              [
                Buffer.from("vault"),
                poolKeyCopy.toBuffer(),
                mintPubkey.toBuffer(),
              ],
              PROGRAM_ID
            )[0],
            quoteVault: PublicKey.findProgramAddressSync(
              [
                Buffer.from("vault"),
                poolKeyCopy.toBuffer(),
                NATIVE_MINT.toBuffer(),
              ],
              PROGRAM_ID
            )[0],
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        )
      );

      await sendAndConfirmTransaction(c, atomicBackrunTx, [attacker], {
        commitment: "confirmed",
        skipPreflight: true,
      });

      const attackerRemainingMintBalance = new BN(
        (
          await c.getTokenAccountBalance(mintAtaAttacker, "confirmed")
        ).value.amount
      );

      assert(attackerRemainingMintBalance.eq(new BN(0)));

      const attackerEndingBalance = new BN(
        (
          await c.getTokenAccountBalance(wSolAtaAttacker, "confirmed")
        ).value.amount
      );

      console.log();
      console.log(`\t ---- ATTEMPT TO IMMEDIATELY SANDWICH VICTIM ----`);
      console.log();

      console.log(
        `\t 😈 Attacker swapped ${
          attackerMintBalance.toNumber() / 1e6
        } tokens for ${
          attackerEndingBalance.sub(attackerIntermidiateSolBalance).toNumber() /
          1e9
        } SOL`
      );

      console.log();
      console.log(`\t ---- FINAL RESULT ----`);
      console.log();

      console.log(
        `\t 😈 Attacker ending balance: ${
          attackerEndingBalance.toNumber() / 1e9
        } SOL`
      );

      console.log(
        `\t 😈 Attacker lost ${
          (attackerStartingBalance.toNumber() -
            attackerEndingBalance.toNumber()) /
          1e9
        } SOL`
      );

      console.log();
      console.log("\t ✅✅✅ 🥳🥳🥳 🖕🖕🖕");

      assert(attackerEndingBalance.lt(attackerStartingBalance));
    });
  });

  describe("Fees", () => {
    it("should accumulate fees for a LP", async () => {
      // Perform some swaps to generate fees
      const swapper = traders[0][0];
      const swapperMintAta = traders[0][1];
      const swapperWsolAta = traders[0][2];

      for (let i = 0; i < 5; i++) {
        const swapTx = new Transaction().add(
          Swap(
            {
              params: {
                side: new Side.Buy(),
                swapType: new ExactIn({
                  amountIn: new BN(2_000_000_000),
                  minAmountOut: new BN(0),
                }),
              },
            },

            {
              plasmaProgram: PROGRAM_ID,
              logAuthority: LOG_AUTHORITY,
              pool: poolKey,
              trader: swapper.publicKey,
              baseAccount: swapperMintAta,
              quoteAccount: swapperWsolAta,
              baseVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKey.toBuffer(),
                  mintPubkey.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              quoteVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKey.toBuffer(),
                  NATIVE_MINT.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              tokenProgram: TOKEN_PROGRAM_ID,
            }
          )
        );
        await sendAndConfirmTransaction(c, swapTx, [swapper], {
          commitment: "confirmed",
        });
      }

      // Check if fees have accumulated
      const poolAccount = await PoolAccount.fetch(c, poolKey);
      if (!poolAccount) {
        throw new Error("Pool account not found");
      }

      const lpPositionAddress = PublicKey.findProgramAddressSync(
        [
          Buffer.from("lp_position"),
          poolKey.toBuffer(),
          payer.publicKey.toBuffer(),
        ],
        PROGRAM_ID
      )[0];

      const lpPositionBefore = await LpPositionAccount.fetch(
        c,
        lpPositionAddress
      );

      // Check fees accumulated for the LP
      if (!lpPositionBefore) {
        throw new Error("LP position account not found");
      }

      const poolRewardFactor = new FixedPoint(poolAccount.amm.rewardFactor);
      const lpRewardFactorSnapshot = new FixedPoint(
        lpPositionBefore.lpPosition.rewardFactorSnapshot
      );

      const rewardDiff =
        poolRewardFactor.toNumber() - lpRewardFactorSnapshot.toNumber();
      const expectedReward =
        rewardDiff * lpPositionBefore.lpPosition.lpShares.toNumber();

      // Claim fees
      const withdrawLpFeesTx = new Transaction().add(
        WithdrawLpFees(
          {
            plasmaProgram: PROGRAM_ID,
            logAuthority: LOG_AUTHORITY,
            pool: poolKey,
            trader: payer.publicKey,
            lpPositionOwner: payer.publicKey,
            lpPosition: lpPositionAddress,
            quoteAccount: wSolAtaPayer,
            quoteVault: PublicKey.findProgramAddressSync(
              [
                Buffer.from("vault"),
                poolKey.toBuffer(),
                NATIVE_MINT.toBuffer(),
              ],
              PROGRAM_ID
            )[0],
            tokenProgram: TOKEN_PROGRAM_ID,
          },
          PROGRAM_ID
        )
      );

      await sendAndConfirmTransaction(c, withdrawLpFeesTx, [payer], {
        commitment: "confirmed",
      });

      // Fetch the LP position account
      const lpPositionAfter = await LpPositionAccount.fetch(
        c,
        lpPositionAddress
      );
      if (!lpPositionAfter) {
        throw new Error("LP position account not found");
      }

      assert(
        lpPositionAfter.lpPosition.rewardFactorSnapshot.eq(
          poolAccount.amm.rewardFactor
        ),
        "LP position reward factor should be updated"
      );

      const collectedFees = lpPositionAfter.lpPosition.collectedFees.toNumber();
      const difference = collectedFees - expectedReward;

      const poolAfter = await PoolAccount.fetch(c, poolKey);
      if (!poolAfter) {
        throw new Error("Pool account not found");
      }

      const tolerance = 1000;
      assert(
        difference <= tolerance,
        "Collected fees should be close to expected reward"
      );
    });

    it("should allow withdrawal of protocol fees", async () => {
      const quoteVault = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), poolKey.toBuffer(), NATIVE_MINT.toBuffer()],
        PROGRAM_ID
      )[0];
      const poolAccount = await PoolAccount.fetch(c, poolKey);
      const protocolFeeRecipients =
        poolAccount?.poolHeader.feeRecipients.recipients;

      const traderZeroQuotePreBalance = await c.getTokenAccountBalance(
        traders[0][2],
        "confirmed"
      );
      const traderOneQuotePreBalance = await c.getTokenAccountBalance(
        traders[1][2],
        "confirmed"
      );
      const traderTwoQuotePreBalance = await c.getTokenAccountBalance(
        traders[2][2],
        "confirmed"
      );

      const traderZeroExpectedFees =
        protocolFeeRecipients?.[0].totalAccumulatedQuoteFees ?? new BN(0);
      const traderOneExpectedFees =
        protocolFeeRecipients?.[1].totalAccumulatedQuoteFees ?? new BN(0);
      const traderTwoExpectedFees =
        protocolFeeRecipients?.[2].totalAccumulatedQuoteFees ?? new BN(0);

      const totalProtocolFees =
        poolAccount?.amm.cumulativeQuoteProtocolFees ?? new BN(0);

      console.log(`\t Total protocol fees: ${totalProtocolFees.toNumber()}`);
      console.log(
        `\t Trader 0 Expected fees: ${traderZeroExpectedFees.toNumber()}`
      );
      console.log(
        `\t Trader 1 Expected fees: ${traderOneExpectedFees.toNumber()}`
      );
      console.log(
        `\t Trader 2 Expected fees: ${traderTwoExpectedFees.toNumber()}`
      );

      assert(
        totalProtocolFees
          .sub(
            traderZeroExpectedFees
              .add(traderOneExpectedFees)
              .add(traderTwoExpectedFees)
          )
          .abs()
          .lt(new BN(3))
      );

      let traderZeroWithdrawTx = new Transaction().add(
        WithdrawProtocolFees({
          plasmaProgram: PROGRAM_ID,
          logAuthority: LOG_AUTHORITY,
          pool: poolKey,
          protocolFeeRecipient: traders[0][0].publicKey,
          quoteAccount: traders[0][2],
          quoteVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
      );
      await sendAndConfirmTransaction(
        c,
        traderZeroWithdrawTx,
        [traders[0][0]],
        {
          commitment: "confirmed",
        }
      );

      let traderOneWithdrawTx = new Transaction().add(
        WithdrawProtocolFees({
          plasmaProgram: PROGRAM_ID,
          logAuthority: LOG_AUTHORITY,
          pool: poolKey,
          protocolFeeRecipient: traders[1][0].publicKey,
          quoteAccount: traders[1][2],
          quoteVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
      );
      await sendAndConfirmTransaction(c, traderOneWithdrawTx, [traders[1][0]], {
        commitment: "confirmed",
      });

      let traderTwoWithdrawTx = new Transaction().add(
        WithdrawProtocolFees({
          plasmaProgram: PROGRAM_ID,
          logAuthority: LOG_AUTHORITY,
          pool: poolKey,
          protocolFeeRecipient: traders[2][0].publicKey,
          quoteAccount: traders[2][2],
          quoteVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
      );
      await sendAndConfirmTransaction(c, traderTwoWithdrawTx, [traders[2][0]], {
        commitment: "confirmed",
      });

      const traderZeroQuotePostBalance = await c.getTokenAccountBalance(
        traders[0][2],
        "confirmed"
      );
      const traderOneQuotePostBalance = await c.getTokenAccountBalance(
        traders[1][2],
        "confirmed"
      );
      const traderTwoQuotePostBalance = await c.getTokenAccountBalance(
        traders[2][2],
        "confirmed"
      );

      assert(
        Number(traderZeroQuotePostBalance.value.amount) -
          Number(traderZeroQuotePreBalance.value.amount) ==
          traderZeroExpectedFees.toNumber()
      );
      assert(
        Number(traderOneQuotePostBalance.value.amount) -
          Number(traderOneQuotePreBalance.value.amount) ==
          traderOneExpectedFees.toNumber()
      );
      assert(
        Number(traderTwoQuotePostBalance.value.amount) -
          Number(traderTwoQuotePreBalance.value.amount) ==
          traderTwoExpectedFees.toNumber()
      );

      try {
        // Non-recipient trader trying to receive fees should fail
        let traderThreeWithdrawTx = new Transaction().add(
          WithdrawProtocolFees({
            plasmaProgram: PROGRAM_ID,
            logAuthority: LOG_AUTHORITY,
            pool: poolKey,
            protocolFeeRecipient: traders[3][0].publicKey,
            quoteAccount: traders[3][2],
            quoteVault,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
        );
        await sendAndConfirmTransaction(
          c,
          traderThreeWithdrawTx,
          [traders[3][0]],
          {
            commitment: "confirmed",
          }
        );
        assert(false);
      } catch (err) {}

      // Fetch pool again and make sure the collected fees are updated
      const poolAccountPostWithdraw = await PoolAccount.fetch(c, poolKey);
      const protocolFeeRecipientsPostWithdraw =
        poolAccountPostWithdraw?.poolHeader.feeRecipients.recipients;
      const recipientOne = protocolFeeRecipientsPostWithdraw?.[0];
      const recipientTwo = protocolFeeRecipientsPostWithdraw?.[1];
      const recipientThree = protocolFeeRecipientsPostWithdraw?.[2];

      assert(
        recipientOne?.collectedQuoteFees.eq(
          recipientOne?.totalAccumulatedQuoteFees
        )
      );
      assert(
        recipientTwo?.collectedQuoteFees.eq(
          recipientTwo?.totalAccumulatedQuoteFees
        )
      );
      assert(
        recipientThree?.collectedQuoteFees.eq(
          recipientThree?.totalAccumulatedQuoteFees
        )
      );
    });
  });

  describe("Liquidity Provider Operations", () => {
    it("should allow a LP to add more liquidity", async () => {
      // Initialize a new LP position
      const lpTrader = Keypair.generate();
      const airdropTx = await c.requestAirdrop(
        lpTrader.publicKey,
        500_000_000_000
      );
      await c.confirmTransaction(airdropTx, "confirmed");

      const mintAtaLpTrader = await getAssociatedTokenAddress(
        mintPubkey,
        lpTrader.publicKey
      );

      const wSolAtaLpTrader = await getAssociatedTokenAddress(
        NATIVE_MINT,
        lpTrader.publicKey
      );

      const initTraderTx = new Transaction()
        .add(
          createAssociatedTokenAccountInstruction(
            lpTrader.publicKey,
            mintAtaLpTrader,
            lpTrader.publicKey,
            mintPubkey
          )
        )
        .add(
          createAssociatedTokenAccountInstruction(
            lpTrader.publicKey,
            wSolAtaLpTrader,
            lpTrader.publicKey,
            NATIVE_MINT
          )
        )
        .add(
          SystemProgram.transfer({
            fromPubkey: lpTrader.publicKey,
            toPubkey: wSolAtaLpTrader,
            lamports: 100_000_000_000, // 100 SOL
          })
        )
        .add(createSyncNativeInstruction(wSolAtaLpTrader));

      await sendAndConfirmTransaction(c, initTraderTx, [lpTrader], {
        commitment: "confirmed",
      });

      // Mint tokens to the lpTrader's token account
      const mintToLpTraderTx = new Transaction().add(
        createMintToInstruction(
          mintPubkey,
          mintAtaLpTrader,
          payer.publicKey, // Assuming payer is the mint authority
          100_000_000_000
        )
      );

      await sendAndConfirmTransaction(c, mintToLpTraderTx, [payer], {
        commitment: "confirmed",
      });

      const poolAccountBefore = await PoolAccount.fetch(c, poolKey);

      const lpPositionKey = PublicKey.findProgramAddressSync(
        [
          Buffer.from("lp_position"),
          poolKey.toBuffer(),
          lpTrader.publicKey.toBuffer(),
        ],
        PROGRAM_ID
      )[0];

      // Initialize LP position
      const initLpPositionTx = new Transaction().add(
        InitializeLpPosition({
          plasmaProgram: PROGRAM_ID,
          logAuthority: LOG_AUTHORITY,
          pool: poolKey,
          payer: lpTrader.publicKey,
          lpPositionOwner: lpTrader.publicKey,
          lpPosition: lpPositionKey,
          systemProgram: SystemProgram.programId,
        })
      );

      await sendAndConfirmTransaction(c, initLpPositionTx, [lpTrader], {
        commitment: "confirmed",
      });

      // Add liquidity
      const addLiquidityTx = new Transaction().add(
        AddLiquidity(
          {
            params: {
              desiredBaseAmountIn: new BN(10_000_000),
              desiredQuoteAmountIn: new BN(5_000_000),
              initialLpShares: null,
            },
          },
          {
            plasmaProgram: PROGRAM_ID,
            logAuthority: LOG_AUTHORITY,
            pool: poolKey,
            trader: lpTrader.publicKey,
            lpPosition: lpPositionKey,
            baseAccount: mintAtaLpTrader,
            quoteAccount: wSolAtaLpTrader,
            baseVault: PublicKey.findProgramAddressSync(
              [Buffer.from("vault"), poolKey.toBuffer(), mintPubkey.toBuffer()],
              PROGRAM_ID
            )[0],
            quoteVault: PublicKey.findProgramAddressSync(
              [
                Buffer.from("vault"),
                poolKey.toBuffer(),
                NATIVE_MINT.toBuffer(),
              ],
              PROGRAM_ID
            )[0],
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        )
      );

      await sendAndConfirmTransaction(c, addLiquidityTx, [lpTrader], {
        commitment: "confirmed",
      });

      const poolAccountAfter = await PoolAccount.fetch(c, poolKey);
      if (!poolAccountAfter || !poolAccountBefore) {
        throw new Error("Failed to fetch pool account");
      }
      assert(
        poolAccountAfter.amm.slotSnapshot.gt(poolAccountBefore.amm.slotSnapshot)
      );
    });

    it("should allow a LP to withdraw accumulated fees", async () => {
      // Initialize a new LP position
      const lpTrader = Keypair.generate();
      const airdropTx = await c.requestAirdrop(
        lpTrader.publicKey,
        500_000_000_000
      );
      await c.confirmTransaction(airdropTx, "confirmed");

      const mintAtaLpTrader = await getAssociatedTokenAddress(
        mintPubkey,
        lpTrader.publicKey
      );

      const wSolAtaLpTrader = await getAssociatedTokenAddress(
        NATIVE_MINT,
        lpTrader.publicKey
      );

      const initTraderTx = new Transaction()
        .add(
          createAssociatedTokenAccountInstruction(
            lpTrader.publicKey,
            mintAtaLpTrader,
            lpTrader.publicKey,
            mintPubkey
          )
        )
        .add(
          createAssociatedTokenAccountInstruction(
            lpTrader.publicKey,
            wSolAtaLpTrader,
            lpTrader.publicKey,
            NATIVE_MINT
          )
        )
        .add(
          SystemProgram.transfer({
            fromPubkey: lpTrader.publicKey,
            toPubkey: wSolAtaLpTrader,
            lamports: 100_000_000_000, // 100 SOL
          })
        )
        .add(createSyncNativeInstruction(wSolAtaLpTrader));

      await sendAndConfirmTransaction(c, initTraderTx, [lpTrader], {
        commitment: "confirmed",
      });

      // Mint tokens to the lpTrader's token account
      const mintToLpTraderTx = new Transaction().add(
        createMintToInstruction(
          mintPubkey,
          mintAtaLpTrader,
          payer.publicKey, // Assuming payer is the mint authority
          100_000_000_000
        )
      );

      await sendAndConfirmTransaction(c, mintToLpTraderTx, [payer], {
        commitment: "confirmed",
      });

      const lpPositionKey = PublicKey.findProgramAddressSync(
        [
          Buffer.from("lp_position"),
          poolKey.toBuffer(),
          lpTrader.publicKey.toBuffer(),
        ],
        PROGRAM_ID
      )[0];

      // Initialize LP position
      const initLpPositionTx = new Transaction().add(
        InitializeLpPosition({
          plasmaProgram: PROGRAM_ID,
          logAuthority: LOG_AUTHORITY,
          pool: poolKey,
          payer: lpTrader.publicKey,
          lpPositionOwner: lpTrader.publicKey,
          lpPosition: lpPositionKey,
          systemProgram: SystemProgram.programId,
        })
      );

      await sendAndConfirmTransaction(c, initLpPositionTx, [lpTrader], {
        commitment: "confirmed",
      });

      // Add liquidity
      const addLiquidityTx = new Transaction().add(
        AddLiquidity(
          {
            params: {
              desiredBaseAmountIn: new BN(100_000_000_000),
              desiredQuoteAmountIn: new BN(50_000_000_000),
              initialLpShares: null,
            },
          },
          {
            plasmaProgram: PROGRAM_ID,
            logAuthority: LOG_AUTHORITY,
            pool: poolKey,
            trader: lpTrader.publicKey,
            lpPosition: lpPositionKey,
            baseAccount: mintAtaLpTrader,
            quoteAccount: wSolAtaLpTrader,
            baseVault: PublicKey.findProgramAddressSync(
              [Buffer.from("vault"), poolKey.toBuffer(), mintPubkey.toBuffer()],
              PROGRAM_ID
            )[0],
            quoteVault: PublicKey.findProgramAddressSync(
              [
                Buffer.from("vault"),
                poolKey.toBuffer(),
                NATIVE_MINT.toBuffer(),
              ],
              PROGRAM_ID
            )[0],
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        )
      );

      await sendAndConfirmTransaction(c, addLiquidityTx, [lpTrader], {
        commitment: "confirmed",
      });

      // Perform some swaps to generate fees
      const swapper = traders[3][0];
      const swapperMintAta = traders[3][1];
      const swapperWsolAta = traders[3][2];

      for (let i = 0; i < 5; i++) {
        const swapTx = new Transaction().add(
          Swap(
            {
              params: {
                side: new Side.Buy(),
                swapType: new ExactIn({
                  amountIn: new BN(1_000_000),
                  minAmountOut: new BN(0),
                }),
              },
            },
            {
              plasmaProgram: PROGRAM_ID,
              logAuthority: LOG_AUTHORITY,
              pool: poolKey,
              trader: swapper.publicKey,
              baseAccount: swapperMintAta,
              quoteAccount: swapperWsolAta,
              baseVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKey.toBuffer(),
                  mintPubkey.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              quoteVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKey.toBuffer(),
                  NATIVE_MINT.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              tokenProgram: TOKEN_PROGRAM_ID,
            }
          )
        );
        await sendAndConfirmTransaction(c, swapTx, [swapper], {
          commitment: "confirmed",
        });
      }

      const withdrawFeesTx = new Transaction().add(
        WithdrawLpFees({
          plasmaProgram: PROGRAM_ID,
          logAuthority: LOG_AUTHORITY,
          pool: poolKey,
          trader: lpTrader.publicKey,
          lpPositionOwner: lpTrader.publicKey,
          lpPosition: lpPositionKey,
          quoteAccount: wSolAtaLpTrader,
          quoteVault: PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), poolKey.toBuffer(), NATIVE_MINT.toBuffer()],
            PROGRAM_ID
          )[0],
          tokenProgram: TOKEN_PROGRAM_ID,
        })
      );

      await sendAndConfirmTransaction(c, withdrawFeesTx, [lpTrader], {
        commitment: "confirmed",
      });

      const lpPositionAfter = await LpPositionAccount.fetch(c, lpPositionKey);
      assert(lpPositionAfter);
      assert(lpPositionAfter.lpPosition.collectedFees.gt(new BN(0)));
    });

    it("should correctly distribute fees among multiple LPs", async () => {
      // Initialize two LP traders
      const lpTrader1 = Keypair.generate();
      const lpTrader2 = Keypair.generate();

      // Airdrop SOL to both traders
      for (const trader of [lpTrader1, lpTrader2]) {
        const airdropTx = await c.requestAirdrop(
          trader.publicKey,
          500_000_000_000
        );
        await c.confirmTransaction(airdropTx, "confirmed");
      }

      // Initialize token accounts for both traders
      const initAccounts = async (trader: Keypair) => {
        const mintAta = await getAssociatedTokenAddress(
          mintPubkey,
          trader.publicKey
        );
        const wSolAta = await getAssociatedTokenAddress(
          NATIVE_MINT,
          trader.publicKey
        );

        const initTx = new Transaction()
          .add(
            createAssociatedTokenAccountInstruction(
              trader.publicKey,
              mintAta,
              trader.publicKey,
              mintPubkey
            )
          )
          .add(
            createAssociatedTokenAccountInstruction(
              trader.publicKey,
              wSolAta,
              trader.publicKey,
              NATIVE_MINT
            )
          )
          .add(
            SystemProgram.transfer({
              fromPubkey: trader.publicKey,
              toPubkey: wSolAta,
              lamports: 100_000_000_000, // 100 SOL
            })
          )
          .add(createSyncNativeInstruction(wSolAta))
          .add(
            createMintToInstruction(
              mintPubkey,
              mintAta,
              payer.publicKey,
              100_000_000_000
            )
          );

        await sendAndConfirmTransaction(c, initTx, [trader, payer], {
          commitment: "confirmed",
        });

        return { mintAta, wSolAta };
      };

      const accounts1 = await initAccounts(lpTrader1);
      const accounts2 = await initAccounts(lpTrader2);

      // Initialize LP positions for both traders
      const initLpPosition = async (trader: Keypair) => {
        const lpPositionKey = PublicKey.findProgramAddressSync(
          [
            Buffer.from("lp_position"),
            poolKey.toBuffer(),
            trader.publicKey.toBuffer(),
          ],
          PROGRAM_ID
        )[0];

        const initLpPositionTx = new Transaction().add(
          InitializeLpPosition({
            plasmaProgram: PROGRAM_ID,
            logAuthority: LOG_AUTHORITY,
            pool: poolKey,
            payer: trader.publicKey,
            lpPositionOwner: trader.publicKey,
            lpPosition: lpPositionKey,
            systemProgram: SystemProgram.programId,
          })
        );

        await sendAndConfirmTransaction(c, initLpPositionTx, [trader], {
          commitment: "confirmed",
        });

        return lpPositionKey;
      };

      const lpPosition1 = await initLpPosition(lpTrader1);
      const lpPosition2 = await initLpPosition(lpTrader2);

      // Add liquidity for both LPs
      const addLiquidity = async (
        trader: Keypair,
        accounts: { mintAta: PublicKey; wSolAta: PublicKey },
        lpPosition: PublicKey
      ) => {
        const addLiquidityTx = new Transaction().add(
          AddLiquidity(
            {
              params: {
                desiredBaseAmountIn: new BN(50_000_000_000),
                desiredQuoteAmountIn: new BN(50_000_000_000),
                initialLpShares: null,
              },
            },
            {
              plasmaProgram: PROGRAM_ID,
              logAuthority: LOG_AUTHORITY,
              pool: poolKey,
              trader: trader.publicKey,
              lpPosition: lpPosition,
              baseAccount: accounts.mintAta,
              quoteAccount: accounts.wSolAta,
              baseVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKey.toBuffer(),
                  mintPubkey.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              quoteVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKey.toBuffer(),
                  NATIVE_MINT.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              tokenProgram: TOKEN_PROGRAM_ID,
            }
          )
        );

        await sendAndConfirmTransaction(c, addLiquidityTx, [trader], {
          commitment: "confirmed",
        });
      };

      await addLiquidity(lpTrader1, accounts1, lpPosition1);
      await addLiquidity(lpTrader2, accounts2, lpPosition2);

      // Perform swaps to generate fees
      const swapper = traders[3][0];
      const swapperMintAta = traders[3][1];
      const swapperWsolAta = traders[3][2];

      for (let i = 0; i < 20; i++) {
        const swapTx = new Transaction().add(
          Swap(
            {
              params: {
                side: i % 2 === 0 ? new Side.Buy() : new Side.Sell(),
                swapType: new ExactIn({
                  amountIn: new BN(1_000_000_000),
                  minAmountOut: new BN(0),
                }),
              },
            },
            {
              plasmaProgram: PROGRAM_ID,
              logAuthority: LOG_AUTHORITY,
              pool: poolKey,
              trader: swapper.publicKey,
              baseAccount: swapperMintAta,
              quoteAccount: swapperWsolAta,
              baseVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKey.toBuffer(),
                  mintPubkey.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              quoteVault: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("vault"),
                  poolKey.toBuffer(),
                  NATIVE_MINT.toBuffer(),
                ],
                PROGRAM_ID
              )[0],
              tokenProgram: TOKEN_PROGRAM_ID,
            }
          )
        );
        await sendAndConfirmTransaction(c, swapTx, [swapper], {
          commitment: "confirmed",
        });
      }

      // Withdraw fees for both LPs
      const withdrawFees = async (
        trader: Keypair,
        accounts: { mintAta: PublicKey; wSolAta: PublicKey },
        lpPosition: PublicKey
      ) => {
        const balanceBefore = await c.getTokenAccountBalance(accounts.wSolAta);

        const withdrawFeesTx = new Transaction().add(
          WithdrawLpFees({
            plasmaProgram: PROGRAM_ID,
            logAuthority: LOG_AUTHORITY,
            pool: poolKey,
            trader: trader.publicKey,
            lpPositionOwner: trader.publicKey,
            lpPosition: lpPosition,
            quoteAccount: accounts.wSolAta,
            quoteVault: PublicKey.findProgramAddressSync(
              [
                Buffer.from("vault"),
                poolKey.toBuffer(),
                NATIVE_MINT.toBuffer(),
              ],
              PROGRAM_ID
            )[0],
            tokenProgram: TOKEN_PROGRAM_ID,
          })
        );

        await sendAndConfirmTransaction(c, withdrawFeesTx, [trader], {
          commitment: "confirmed",
        });

        const balanceAfter = await c.getTokenAccountBalance(accounts.wSolAta);
        return new BN(balanceAfter.value.amount).sub(
          new BN(balanceBefore.value.amount)
        );
      };

      const feesLP1 = await withdrawFees(lpTrader1, accounts1, lpPosition1);
      const feesLP2 = await withdrawFees(lpTrader2, accounts2, lpPosition2);

      // Assert that both LPs received fees
      assert(feesLP1.gt(new BN(0)), "LP1 did not receive any fees");
      assert(feesLP2.gt(new BN(0)), "LP2 did not receive any fees");

      // Assert that fees are distributed roughly equally (within 1% difference)
      const feeDifference = feesLP1.sub(feesLP2).abs();
      const feeTotal = feesLP1.add(feesLP2);
      assert(
        feeDifference.muln(100).div(feeTotal).lten(1),
        "Fee distribution is not roughly equal"
      );
    });

    it("should handle adding liquidity with uneven ratios", async () => {
      // Initialize a new LP position
      const lpTrader = Keypair.generate();
      const airdropTx = await c.requestAirdrop(
        lpTrader.publicKey,
        500_000_000_000
      );
      await c.confirmTransaction(airdropTx, "confirmed");

      const mintAtaLpTrader = await getAssociatedTokenAddress(
        mintPubkey,
        lpTrader.publicKey
      );

      const wSolAtaLpTrader = await getAssociatedTokenAddress(
        NATIVE_MINT,
        lpTrader.publicKey
      );

      const initTraderTx = new Transaction()
        .add(
          createAssociatedTokenAccountInstruction(
            lpTrader.publicKey,
            mintAtaLpTrader,
            lpTrader.publicKey,
            mintPubkey
          )
        )
        .add(
          createAssociatedTokenAccountInstruction(
            lpTrader.publicKey,
            wSolAtaLpTrader,
            lpTrader.publicKey,
            NATIVE_MINT
          )
        )
        .add(
          SystemProgram.transfer({
            fromPubkey: lpTrader.publicKey,
            toPubkey: wSolAtaLpTrader,
            lamports: 100_000_000_000, // 100 SOL
          })
        )
        .add(createSyncNativeInstruction(wSolAtaLpTrader));

      await sendAndConfirmTransaction(c, initTraderTx, [lpTrader], {
        commitment: "confirmed",
      });

      // Mint tokens to the lpTrader's token account
      const mintToLpTraderTx = new Transaction().add(
        createMintToInstruction(
          mintPubkey,
          mintAtaLpTrader,
          payer.publicKey, // Assuming payer is the mint authority
          100_000_000_000
        )
      );

      await sendAndConfirmTransaction(c, mintToLpTraderTx, [payer], {
        commitment: "confirmed",
      });

      const lpPositionKey = PublicKey.findProgramAddressSync(
        [
          Buffer.from("lp_position"),
          poolKey.toBuffer(),
          lpTrader.publicKey.toBuffer(),
        ],
        PROGRAM_ID
      )[0];

      // Initialize LP position
      const initLpPositionTx = new Transaction().add(
        InitializeLpPosition({
          plasmaProgram: PROGRAM_ID,
          logAuthority: LOG_AUTHORITY,
          pool: poolKey,
          payer: lpTrader.publicKey,
          lpPositionOwner: lpTrader.publicKey,
          lpPosition: lpPositionKey,
          systemProgram: SystemProgram.programId,
        })
      );

      await sendAndConfirmTransaction(c, initLpPositionTx, [lpTrader], {
        commitment: "confirmed",
      });

      const lpPositionBefore = await LpPositionAccount.fetch(c, lpPositionKey);
      assert(lpPositionBefore);

      // Add liquidity with 5:1 ratio of base to quote
      const addLiquidityTx = new Transaction().add(
        AddLiquidity(
          {
            params: {
              desiredBaseAmountIn: new BN(25_000_000_000),
              desiredQuoteAmountIn: new BN(5_000_000_000),
              initialLpShares: null,
            },
          },
          {
            plasmaProgram: PROGRAM_ID,
            logAuthority: LOG_AUTHORITY,
            pool: poolKey,
            trader: lpTrader.publicKey,
            lpPosition: lpPositionKey,
            baseAccount: mintAtaLpTrader,
            quoteAccount: wSolAtaLpTrader,
            baseVault: PublicKey.findProgramAddressSync(
              [Buffer.from("vault"), poolKey.toBuffer(), mintPubkey.toBuffer()],
              PROGRAM_ID
            )[0],
            quoteVault: PublicKey.findProgramAddressSync(
              [
                Buffer.from("vault"),
                poolKey.toBuffer(),
                NATIVE_MINT.toBuffer(),
              ],
              PROGRAM_ID
            )[0],
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        )
      );

      await sendAndConfirmTransaction(c, addLiquidityTx, [lpTrader], {
        commitment: "confirmed",
      });

      // Check if LP shares are calculated correctly
      const lpPositionAccount = await LpPositionAccount.fetch(c, lpPositionKey);
      assert(lpPositionAccount);
      assert(
        lpPositionAccount.lpPosition.lpShares.gt(new BN(0)),
        "LP shares should be greater than 0"
      );
    });

    it("should allow a LP to partially remove liquidity", async () => {
      // Initialize a new LP trader
      const lpTrader = Keypair.generate();
      const airdropTx = await c.requestAirdrop(
        lpTrader.publicKey,
        500_000_000_000
      );
      await c.confirmTransaction(airdropTx, "confirmed");

      const mintAtaLpTrader = await getAssociatedTokenAddress(
        mintPubkey,
        lpTrader.publicKey
      );

      const wSolAtaLpTrader = await getAssociatedTokenAddress(
        NATIVE_MINT,
        lpTrader.publicKey
      );

      // Initialize accounts
      const initTraderTx = new Transaction()
        .add(
          createAssociatedTokenAccountInstruction(
            lpTrader.publicKey,
            mintAtaLpTrader,
            lpTrader.publicKey,
            mintPubkey
          )
        )
        .add(
          createAssociatedTokenAccountInstruction(
            lpTrader.publicKey,
            wSolAtaLpTrader,
            lpTrader.publicKey,
            NATIVE_MINT
          )
        )
        .add(
          SystemProgram.transfer({
            fromPubkey: lpTrader.publicKey,
            toPubkey: wSolAtaLpTrader,
            lamports: 100_000_000_000, // 100 SOL
          })
        )
        .add(createSyncNativeInstruction(wSolAtaLpTrader));

      await sendAndConfirmTransaction(c, initTraderTx, [lpTrader], {
        commitment: "confirmed",
      });

      // Mint tokens to the lpTrader's token account
      const mintToLpTraderTx = new Transaction().add(
        createMintToInstruction(
          mintPubkey,
          mintAtaLpTrader,
          payer.publicKey, // Assuming payer is the mint authority
          100_000_000_000
        )
      );

      await sendAndConfirmTransaction(c, mintToLpTraderTx, [payer], {
        commitment: "confirmed",
      });

      const lpPositionKey = PublicKey.findProgramAddressSync(
        [
          Buffer.from("lp_position"),
          poolKey.toBuffer(),
          lpTrader.publicKey.toBuffer(),
        ],
        PROGRAM_ID
      )[0];

      // Initialize LP position
      const initLpPositionTx = new Transaction().add(
        InitializeLpPosition({
          plasmaProgram: PROGRAM_ID,
          logAuthority: LOG_AUTHORITY,
          pool: poolKey,
          payer: lpTrader.publicKey,
          lpPositionOwner: lpTrader.publicKey,
          lpPosition: lpPositionKey,
          systemProgram: SystemProgram.programId,
        })
      );

      await sendAndConfirmTransaction(c, initLpPositionTx, [lpTrader], {
        commitment: "confirmed",
      });

      // Add initial liquidity
      const addLiquidityTx = new Transaction().add(
        AddLiquidity(
          {
            params: {
              desiredBaseAmountIn: new BN(50_000_000_000),
              desiredQuoteAmountIn: new BN(50_000_000_000),
              initialLpShares: null,
            },
          },
          {
            plasmaProgram: PROGRAM_ID,
            logAuthority: LOG_AUTHORITY,
            pool: poolKey,
            trader: lpTrader.publicKey,
            lpPosition: lpPositionKey,
            baseAccount: mintAtaLpTrader,
            quoteAccount: wSolAtaLpTrader,
            baseVault: PublicKey.findProgramAddressSync(
              [Buffer.from("vault"), poolKey.toBuffer(), mintPubkey.toBuffer()],
              PROGRAM_ID
            )[0],
            quoteVault: PublicKey.findProgramAddressSync(
              [
                Buffer.from("vault"),
                poolKey.toBuffer(),
                NATIVE_MINT.toBuffer(),
              ],
              PROGRAM_ID
            )[0],
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        )
      );

      await sendAndConfirmTransaction(c, addLiquidityTx, [lpTrader], {
        commitment: "confirmed",
      });

      // Get initial LP shares
      const initialLpPosition = await LpPositionAccount.fetch(c, lpPositionKey);
      assert(initialLpPosition);
      const initialLpShares = initialLpPosition.lpPosition.lpShares;

      // Advance slot to vest LP shares, borrowed this from above.
      while ((await c.getSlot("confirmed")) % 4 != 0) {}

      // Remove half of the liquidity
      const removeLiquidityTx = new Transaction().add(
        RemoveLiquidity(
          {
            params: {
              lpShares: initialLpShares.div(new BN(2)),
            },
          },
          {
            plasmaProgram: PROGRAM_ID,
            logAuthority: LOG_AUTHORITY,
            pool: poolKey,
            trader: lpTrader.publicKey,
            lpPosition: lpPositionKey,
            baseAccount: mintAtaLpTrader,
            quoteAccount: wSolAtaLpTrader,
            baseVault: PublicKey.findProgramAddressSync(
              [Buffer.from("vault"), poolKey.toBuffer(), mintPubkey.toBuffer()],
              PROGRAM_ID
            )[0],
            quoteVault: PublicKey.findProgramAddressSync(
              [
                Buffer.from("vault"),
                poolKey.toBuffer(),
                NATIVE_MINT.toBuffer(),
              ],
              PROGRAM_ID
            )[0],
            tokenProgram: TOKEN_PROGRAM_ID,
          }
        )
      );

      await sendAndConfirmTransaction(c, removeLiquidityTx, [lpTrader], {
        commitment: "confirmed",
      });

      // Check if remaining LP shares are correct
      const finalLpPosition = await LpPositionAccount.fetch(c, lpPositionKey);
      assert(finalLpPosition);
      // Final LP position should be approximately 50% of the intial LP shares
      const remainingLpShares = finalLpPosition.lpPosition.lpShares;
      const expectedLpShares = initialLpShares.div(new BN(2));
      const tolerance = new BN(1); // 1 LP share
      assert(
        remainingLpShares.sub(expectedLpShares).abs().lte(tolerance),
        "Remaining LP shares should be approximately half of initial"
      );
    });
  });
});
