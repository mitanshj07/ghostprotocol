require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const { getHealth } = require("./health");
const { sendTriggerAlert } = require("./notifications");
const { rememberGuardian, getGuardian, listGuardians } = require("./guardian");

const PORT = Number(process.env.PORT || 3001);
const DEFAULT_ORIGINS = [
  "https://frontend-beige-one-97.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

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

function allowedOrigins() {
  return (process.env.CORS_ORIGIN || DEFAULT_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const originAllowList = new Set(allowedOrigins());

function isOriginAllowed(origin) {
  return !origin || originAllowList.has(origin);
}

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

const rateWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX || 120);
const rateBuckets = new Map();

function rateLimit(req, res, next) {
  const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { count: 0, resetAt: now + rateWindowMs };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + rateWindowMs;
  }

  bucket.count += 1;
  rateBuckets.set(key, bucket);

  if (bucket.count > rateLimitMax) {
    res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
    return res.status(429).json({ error: "Too many requests" });
  }

  return next();
}

const app = express();
app.disable("x-powered-by");
app.use(securityHeaders);
app.use(cors({
  origin(origin, callback) {
    callback(null, isOriginAllowed(origin));
  }
}));
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit);

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
  const hashes = activities.map((activity) => activity.hash).filter(Boolean);
  console.log("[alchemy]", { activityCount: activities.length, hashes });
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
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error?.code === "INVALID_ARGUMENT" ? 400 : 500;
  const message = statusCode === 500 && process.env.NODE_ENV === "production"
    ? "Internal server error"
    : error.message || "Internal server error";

  console.error("[api]", error.message || error);
  return res.status(statusCode).json({ error: message });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GhostProtocol API listening on ${PORT}`);
  });
}

module.exports = app;
