require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const cron = require("node-cron");
const { getHealth } = require("./health");
const { sendTriggerAlert } = require("./notifications");
const { rememberGuardian, getGuardian, listGuardians } = require("./guardian");

const PORT = Number(process.env.PORT || 3001);

const GHOST_VAULT_ABI = [
  "function hasVault(address owner) view returns (bool)",
  "function getVaultInfo(address owner) view returns (uint256,uint256,uint256,uint8,uint8,uint256,uint256,bool,uint256,string)",
  "function getBeneficiaries(address owner) view returns (tuple(address wallet,uint8 percentage,string name)[])",
  "function getGuardians(address owner) view returns (tuple(address wallet,string shardIpfsHash,bool confirmed)[])",
  "function getMessageCount(address owner) view returns (uint256)",
  "function nextExecutableStage(address owner) view returns (uint8)",
  "function triggerExecution(address owner)"
];

function getProvider() {
  const url = process.env.ALCHEMY_SEPOLIA_URL || process.env.ALCHEMY_MAINNET_URL;
  if (!url) {
    return null;
  }
  return new ethers.JsonRpcProvider(url);
}

function getContract(signer = false) {
  const address = process.env.GHOST_VAULT_ADDRESS;
  const provider = getProvider();
  if (!address || !provider) {
    return null;
  }

  if (signer) {
    if (!process.env.DEPLOYER_PRIVATE_KEY) {
      return null;
    }
    return new ethers.Contract(
      address,
      GHOST_VAULT_ABI,
      new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)
    );
  }

  return new ethers.Contract(address, GHOST_VAULT_ABI, provider);
}

function normalizeVaultInfo(info) {
  return {
    commitment: info[0].toString(),
    checkInWindow: Number(info[1]),
    lastCheckIn: Number(info[2]),
    state: Number(info[3]),
    stage: Number(info[4]),
    ethBalance: info[5].toString(),
    createdAt: Number(info[6]),
    triggered: info[7],
    secondsUntilTrigger: Number(info[8]),
    metadataIpfsHash: info[9]
  };
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json(getHealth());
});

app.get("/api/vault/:address", async (req, res, next) => {
  try {
    const contract = getContract();
    if (!contract) {
      return res.status(503).json({ error: "Contract not configured" });
    }

    const owner = ethers.getAddress(req.params.address);
    const hasVault = await contract.hasVault(owner);
    if (!hasVault) {
      return res.json({ hasVault: false });
    }

    const [info, beneficiaries, guardians, messageCount, nextStage] = await Promise.all([
      contract.getVaultInfo(owner),
      contract.getBeneficiaries(owner),
      contract.getGuardians(owner),
      contract.getMessageCount(owner),
      contract.nextExecutableStage(owner)
    ]);

    res.json({
      hasVault: true,
      ...normalizeVaultInfo(info),
      beneficiaryCount: beneficiaries.length,
      guardianCount: guardians.length,
      messageCount: Number(messageCount),
      nextExecutableStage: Number(nextStage),
      beneficiaries,
      guardians
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/execute/:address", async (req, res, next) => {
  try {
    const contract = getContract();
    if (!contract) {
      return res.status(503).json({ error: "Contract not configured" });
    }

    const owner = ethers.getAddress(req.params.address);
    const nextStage = await contract.nextExecutableStage(owner);
    res.json({ owner, nextExecutableStage: Number(nextStage), executable: Number(nextStage) > 0 });
  } catch (error) {
    next(error);
  }
});

app.post("/api/execute/:address", async (req, res, next) => {
  try {
    const contract = getContract(true);
    if (!contract) {
      return res.status(503).json({ error: "Signer or contract not configured" });
    }

    const owner = ethers.getAddress(req.params.address);
    const tx = await contract.triggerExecution(owner);
    res.json({ owner, txHash: tx.hash });
  } catch (error) {
    next(error);
  }
});

app.post("/api/webhooks/alchemy", async (req, res) => {
  const activities = req.body?.event?.activity || [];
  for (const activity of activities) {
    console.log("[alchemy]", activity.hash || "activity", activity);
  }
  res.json({ ok: true });
});

app.post("/api/notifications/trigger", async (req, res, next) => {
  try {
    const { vaultOwner, recipients } = req.body;
    const result = await sendTriggerAlert(vaultOwner, recipients || []);
    res.json({ ok: true, result });
  } catch (error) {
    next(error);
  }
});

app.post("/api/ipfs/json", async (req, res, next) => {
  try {
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_KEY) {
      return res.status(503).json({ error: "Pinata credentials are not configured" });
    }

    const { name, payload } = req.body;
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_KEY
      },
      body: JSON.stringify({
        pinataMetadata: { name: name || "ghostprotocol.json" },
        pinataContent: payload
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      ipfsHash: data.IpfsHash,
      uri: `ipfs://${data.IpfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/guardians", (req, res) => {
  const entry = rememberGuardian(req.body);
  res.status(201).json(entry);
});

app.get("/api/guardians/:vaultOwner", (req, res) => {
  res.json({ guardians: listGuardians(req.params.vaultOwner) });
});

app.get("/api/guardians/:vaultOwner/:guardian", (req, res) => {
  res.json({ guardian: getGuardian(req.params.vaultOwner, req.params.guardian) });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message || "Internal server error" });
});

cron.schedule("0 * * * *", () => {
  console.log("[keeper] hourly scan placeholder - configure indexed vault owners to enable automation");
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GhostProtocol API listening on ${PORT}`);
  });
}

module.exports = app;
