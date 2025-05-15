const path = require("path");
const fs = require("fs");
const programDir = path.join(__dirname, "../program");
const idlDir = __dirname;

const PROGRAM_NAME = "plasma";

const { spawn } = require("child_process");

async function main() {
  const shank = spawn("shank", [
    "idl",
    "--out-dir",
    idlDir,
    "--crate-root",
    programDir,
  ])
    .on("error", (err) => {
      console.error(err);
      if (err.code === "ENOENT") {
        console.error(
          "Ensure that `shank` is installed and in your path, see:\n  https://github.com/metaplex-foundation/shank\n"
        );
      }
      process.exit(1);
    })
    .on("exit", () => {
      mutateIdl();
    });

  shank.stdout.on("data", (buf) => console.log(buf.toString("utf8")));
  shank.stderr.on("data", (buf) => console.error(buf.toString("utf8")));
  await new Promise((resolve) => {
    shank.on("close", resolve);
  });

  const removeClientFolder = spawn("rm", ["-rf", "../sdk/typescript/generated"]);
  await new Promise((resolve) => {
    removeClientFolder.on("close", resolve);
  });

  const generateClient = spawn("anchor-client-gen", [
    "plasma.json",
    "../sdk/typescript/generated",
  ]).on("error", (err) => {
    console.error(err);
    if (err.code === "ENOENT") {
      console.error(
        "Ensure that `anchor-client-gen` is installed and in your path, see:\n  https://github.com/kklas/anchor-client-gen\n"
      );
    } else {
      console.error("Error generating client", err);
    }
    process.exit(1);
  });

  await new Promise((resolve) => {
    generateClient.on("close", resolve);
  });

  const removeErrorFolder = spawn("rm", ["-rf", "../sdk/typescript/generated/errors"]);
  await new Promise((resolve) => {
    removeErrorFolder.on("close", resolve);
  });

  recursivelyMutateClientFiles("../sdk/typescript/generated");

  console.log("Done");
}

function recursivelyMutateClientFiles(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const pathSplit = dir.split("/");
    const relativeDir = pathSplit[pathSplit.length - 1];
    const fullPath = path.join(dir, file);

    // check if file is directory
    if (fs.statSync(fullPath).isDirectory()) {
      recursivelyMutateClientFiles(fullPath);
    } else {
      if (file.endsWith(".ts")) {
        const data = fs.readFileSync(fullPath, "utf8");
        let result = data;
        if (relativeDir === "instructions" && file !== "index.ts") {
          const instructionDiscriminantReplacement = getInstructionDiscriminant(
            file.replace(".ts", "")
          );
          const replacementString = `const identifier = Buffer.from([${instructionDiscriminantReplacement}])`;
          // This only replaces the line that defines the identifier (up to the first instance of the `)` character)
          result = result.replace(
            /const identifier = [\s\S]*?\)/,
            replacementString
          ).replace(/8 \+ len/, "1 + len");
        }
        fs.writeFileSync(fullPath, result, "utf8");
      }
    }
  });
}

function getInstructionDiscriminant(instructionName) {
  const generatedIdlPath = path.join(idlDir, `${PROGRAM_NAME}.json`);
  let idl = require(generatedIdlPath);
  for (const instruction of idl.instructions) {
    if (instruction.name === instructionName) {
      return instruction.discriminant.value;
    }
  }
  throw new Error("Failed to find instruction discriminant");
}

function mutateIdl() {
  console.error("Mutating IDL");
  const generatedIdlPath = path.join(idlDir, `${PROGRAM_NAME}.json`);
  let idl = require(generatedIdlPath);
  for (const instruction of idl.instructions) {
    const ixType = instruction.name + "IxParams";
    if (idl.types.filter((t) => t.name === ixType).length > 0) {
      instruction.args.push({
        name: "params",
        type: {
          defined: ixType,
        },
      });
    }
  }
  idl["accounts"] = [];

  const typesToRemove = [];
  for (const t of idl.types) {
    if (t.name.endsWith("Account")) {
      idl.accounts.push(t);
      typesToRemove.push(t.name);
    }
  }

  idl.types = idl.types.filter((t) => !typesToRemove.includes(t.name));

  fs.writeFileSync(generatedIdlPath, JSON.stringify(idl, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
