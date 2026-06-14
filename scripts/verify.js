require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const verifier = process.env.LIVENESS_VERIFIER_ADDRESS;
  const vault = process.env.GHOST_VAULT_ADDRESS;

  if (!verifier || !vault) {
    throw new Error("Missing LIVENESS_VERIFIER_ADDRESS or GHOST_VAULT_ADDRESS");
  }

  await hre.run("verify:verify", {
    address: verifier,
    constructorArguments: []
  });

  await hre.run("verify:verify", {
    address: vault,
    constructorArguments: [verifier]
  });

  console.log("Verification complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
