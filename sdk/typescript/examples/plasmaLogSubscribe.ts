import { PlasmaEvent, Side, SwapResult } from "../generated/types";
import { PROGRAM_ID } from "../generated/programId";
import { Connection } from "@solana/web3.js";
import BN from "bn.js";
import { AddLiquidity, Swap } from "../generated/types/PlasmaEvent";

const getLogs = async (url: string | undefined) => {
  if (!url) {
    url = "http://127.0.0.1:8899";
  }
  const PLASMA_EVENT_LAYOUT = PlasmaEvent.layout();
  const programIdStr = PROGRAM_ID.toBase58();
  const stackPushEvent = `Program ${programIdStr} invoke`;
  const stackPopEvent = `Program ${programIdStr} success`;
  const dataEvent = `Program data: `;
  const connection = new Connection(url, {
    wsEndpoint: url.replace("http", "ws").replace("8899", "8900"),
    commitment: "confirmed",
  });
  console.log("Starting");
  connection.onLogs(
    "all",
    (logs, _) => {
      if (logs.err !== null) {
        console.log("Skipping failed transaction: ", logs.signature);
        return;
      }
      const programStack: number[] = [];
      for (const log of logs.logs) {
        if (log.includes(stackPushEvent)) {
          try {
            const stackDepth = parseInt(
              log.replace(stackPushEvent, "").trim().replace(/\[\]/g, "")
            );
            programStack.push(stackDepth);
          } catch (err) {
            console.log("Error parsing invoke log: ", log, err);
          }
        } else if (log.includes(stackPopEvent)) {
          if (programStack.length == 0) {
            console.error("Attempted to pop from an empty log stack");
            continue;
          }
          programStack.pop();
        } else if (log.includes(dataEvent) && programStack.length > 0) {
          try {
            const logData = Buffer.from(
              log.replace(dataEvent, "").trim(),
              "base64"
            );
            const plasmaEvent = PlasmaEvent.fromDecoded(
              PLASMA_EVENT_LAYOUT.decode(logData)
            );
            if (plasmaEvent.kind === "Swap") {
              processSwap(plasmaEvent, logData);
            } else if (plasmaEvent.kind === "AddLiquidity") {
              processAddLiquidity(plasmaEvent, logData);
            }
          } catch (err) {
            console.log("Error parsing data log: ", log, err);
          }
        }
      }
    },
    "confirmed"
  );
  console.log("Subscribed");
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

const processAddLiquidity = (plasmaEvent: AddLiquidity, logData: Buffer) => {
  console.log("AddLiquidity event detected");
  // Hacky temporary solution for correctly parsing swap events
  const baseDecimals = plasmaEvent.value.header.baseDecimals;
  const quoteDecimals = plasmaEvent.value.header.quoteDecimals;

  const baseMult = new BN(10).pow(new BN(baseDecimals));
  const quoteMult = new BN(10).pow(new BN(quoteDecimals));

  const postQuoteLiquidity = plasmaEvent.value.event.poolTotalQuoteLiquitidy;
  const postBaseLiquidity = plasmaEvent.value.event.poolTotalBaseLiquidity;

  const postPoolPrice =
    (postQuoteLiquidity.div(quoteMult).toNumber() +
      postQuoteLiquidity.mod(quoteMult).toNumber() / quoteMult.toNumber()) /
    (postBaseLiquidity.div(baseMult).toNumber() +
      postBaseLiquidity.mod(baseMult).toNumber() / baseMult.toNumber());

  const userBaseDeposited = plasmaEvent.value.event.userBaseDeposited;
  const userQuoteDeposited = plasmaEvent.value.event.userQuoteDeposited;
  const lpShares = plasmaEvent.value.event.userLpSharesReceived;
  const lpSharesLocked = plasmaEvent.value.event.userLpSharesLocked;

  const preQuoteLiquidity = postQuoteLiquidity.sub(userQuoteDeposited);
  const preBaseLiquidity = postBaseLiquidity.sub(userBaseDeposited);

  const prePoolPrice =
    (preQuoteLiquidity.div(quoteMult).toNumber() +
      preQuoteLiquidity.mod(quoteMult).toNumber() / quoteMult.toNumber()) /
    (preBaseLiquidity.div(baseMult).toNumber() +
      preBaseLiquidity.mod(baseMult).toNumber() / baseMult.toNumber());

  console.log(
    `Deposited: base=${userBaseDeposited.toString()} quote=${userQuoteDeposited.toString()}`
  );
  console.log(`Pool price: ${prePoolPrice} -> ${postPoolPrice}`);
  console.log(
    `Pool balances: base=${postBaseLiquidity.toString()} quote=${postQuoteLiquidity.toString()}`
  );
  console.log(`LP Shares minted: ${lpShares} (${lpSharesLocked} locked)`);
  console.log();
};

const processSwap = (plasmaEvent: Swap, logData: Buffer) => {
  console.log("Swap event detected");
  // Hacky temporary solution for correctly parsing swap events
  const swapResultLayout = SwapResult.layout();
  const swapResult = SwapResult.fromDecoded(
    swapResultLayout.decode(logData.slice(-57))
  );
  const baseDecimals = plasmaEvent.value.header.baseDecimals;
  const quoteDecimals = plasmaEvent.value.header.quoteDecimals;

  const baseMult = new BN(10).pow(new BN(baseDecimals));
  const quoteMult = new BN(10).pow(new BN(quoteDecimals));

  const baseMatched =
    swapResult.baseMatched.toNumber() * Math.pow(10, -baseDecimals);
  const price =
    (swapResult.quoteMatched.toNumber() * Math.pow(10, -quoteDecimals)) /
    baseMatched;

  const side = swapResult.side;

  const postQuoteLiquidity = plasmaEvent.value.event.postQuoteLiquidity;

  const postBaseLiquidity = plasmaEvent.value.event.postBaseLiquidity;

  const postPoolPrice =
    (postQuoteLiquidity.div(quoteMult).toNumber() +
      postQuoteLiquidity.mod(quoteMult).toNumber() / quoteMult.toNumber()) /
    (postBaseLiquidity.div(baseMult).toNumber() +
      postBaseLiquidity.mod(baseMult).toNumber() / baseMult.toNumber());

  const preQuoteLiquidity = plasmaEvent.value.event.preQuoteLiquidity;

  const preBaseLiquidity = plasmaEvent.value.event.preBaseLiquidity;

  const prePoolPrice =
    (preQuoteLiquidity.div(quoteMult).toNumber() +
      preQuoteLiquidity.mod(quoteMult).toNumber() / quoteMult.toNumber()) /
    (preBaseLiquidity.div(baseMult).toNumber() +
      preBaseLiquidity.mod(baseMult).toNumber() / baseMult.toNumber());

  console.log(`${side.kind} ${baseMatched} @ ${price}`);
  console.log(`Pool price: ${prePoolPrice} -> ${postPoolPrice}`);
  console.log(
    `Pool balances: base=${postBaseLiquidity.toString()} quote=${postQuoteLiquidity.toString()}`
  );
  console.log(
    `Fees paid: ${
      swapResult.feeInQuote.toNumber() /
      10 ** plasmaEvent.value.header.quoteDecimals
    }`
  );
  console.log();
};

(async function () {
  try {
    await getLogs(process.argv[2]);
  } catch (err) {
    console.log("Error: ", err);
    process.exit(1);
  }

  process.exit(0);
})();
