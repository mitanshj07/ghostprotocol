const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { parseUnits } = require("ethers");

function upsertEnvValue(filePath, key, value) {
  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  content = pattern.test(content)
    ? content.replace(pattern, line)
    : `${content.trimEnd()}\n${line}\n`;
  fs.writeFileSync(filePath, content);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const latestNonce = await hre.ethers.provider.getTransactionCount(deployer.address, "latest");
  const pendingNonce = await hre.ethers.provider.getTransactionCount(deployer.address, "pending");
  let nonce = pendingNonce;
  if (pendingNonce > latestNonce) {
    nonce = latestNonce;
    console.log(`Replacing pending transaction at nonce ${nonce}`);
  }

  const feeOverrides = hre.network.name === "sepolia"
    ? {
        maxFeePerGas: parseUnits("20", "gwei"),
        maxPriorityFeePerGas: parseUnits("1", "gwei")
      }
    : {};

  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy({ nonce, ...feeOverrides });
  console.log("LivenessVerifier tx:", verifier.deploymentTransaction().hash);
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("LivenessVerifier:", verifierAddress);

  const GhostVault = await hre.ethers.getContractFactory("GhostVault");
  const vault = await GhostVault.deploy(verifierAddress, { nonce: nonce + 1, ...feeOverrides });
  console.log("GhostVault tx:", vault.deploymentTransaction().hash);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("GhostVault:", vaultAddress);

  const rootEnv = path.join(__dirname, "../.env");
  const frontendEnv = path.join(__dirname, "../frontend/.env.local");
  const apiEnv = path.join(__dirname, "../api/.env");

  for (const filePath of [rootEnv, frontendEnv, apiEnv]) {
    upsertEnvValue(filePath, "LIVENESS_VERIFIER_ADDRESS", verifierAddress);
    upsertEnvValue(filePath, "GHOST_VAULT_ADDRESS", vaultAddress);
    upsertEnvValue(filePath, "NEXT_PUBLIC_VERIFIER_ADDRESS", verifierAddress);
    upsertEnvValue(filePath, "NEXT_PUBLIC_CONTRACT_ADDRESS", vaultAddress);
  }

  console.log("Addresses saved to local env files.");

  if (hre.network.name !== "hardhat" && process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting before verification...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    await hre.run("verify:verify", { address: verifierAddress, constructorArguments: [] });
    await hre.run("verify:verify", { address: vaultAddress, constructorArguments: [verifierAddress] });
    console.log("Contracts verified.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
