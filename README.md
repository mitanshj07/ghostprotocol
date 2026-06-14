<div align="center">

<!-- ANIMATED GHOST -->

```ocaml

            ██████████████                
        ████░░░░░░░░░░░░░░████            
      ██░░░░░░░░░░░░░░░░░░░░░░██          
    ██░░░░░░░░░░░░░░░░░░░░░░░░░░██        
    ██░░░░░░░░░░░░░░░░░░░░░░░░░░██        
  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██      
  ██░░░░░░██████░░░░░░██████░░░░░░██      
  ██░░░░░░██████░░░░░░██████░░░░░░██      
  ██░░░░░░░░░░░░░░██░░░░░░░░░░░░░░██      
  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██      
  ██░░░░░░░░░░████████░░░░░░░░░░░░██      
  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██      
    ██░░░░░░░░░░░░░░░░░░░░░░░░░░██        
    ██░░░░░░░░░░░░░░░░░░░░░░░░░░██        
      ██░░░░░░░░░░░░░░░░░░░░░░██          
      ██░░██░░░░██░░░░██░░░░██            
      ██░░██░░░░██░░░░██░░░░██            
          ██    ██    ██                  

      G H O S T   P R O T O C O L
```

<br/>

# 👻 GHOST PROTOCOL

### *A cryptographic dead man's switch for the blockchain.*

**Your keys. Your assets. Your final words.** <br/>
**Delivered with zero-knowledge certainty when you can't be.**

<br/>

<a href="https://frontend-beige-one-97.vercel.app"><img src="https://img.shields.io/badge/%F0%9F%9A%80_LAUNCH_APP-000?style=for-the-badge&logoColor=white" alt="Launch App" height="40"/></a>
&nbsp;&nbsp;
<a href="https://sepolia.etherscan.io/address/0x50d3EaCB039472AB5C0231745452847AfE309E69#code"><img src="https://img.shields.io/badge/%E2%9B%93_VIEW_ON_CHAIN-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white" alt="View on Chain" height="40"/></a>
&nbsp;&nbsp;
<a href="../../issues"><img src="https://img.shields.io/badge/%F0%9F%92%A1_CONTRIBUTE-6E56CF?style=for-the-badge" alt="Contribute" height="40"/></a>

<br/><br/>

[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636?style=flat-square&logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Circom](https://img.shields.io/badge/Circom_2.0-ZK_Proofs-6E56CF?style=flat-square)](https://docs.circom.io/)
[![Next.js](https://img.shields.io/badge/Next.js-Frontend-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-Testing-FFF100?style=flat-square&logo=hardhat&logoColor=black)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-Security-4E5EE4?style=flat-square&logo=openzeppelin&logoColor=white)](https://openzeppelin.com/)
[![IPFS](https://img.shields.io/badge/IPFS-Storage-65C2CB?style=flat-square&logo=ipfs&logoColor=white)](https://ipfs.tech/)
[![Sepolia](https://img.shields.io/badge/Sepolia-Deployed-22C55E?style=flat-square&logo=ethereum)](https://sepolia.etherscan.io/)
[![License: MIT](https://img.shields.io/badge/MIT-License-blue?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](../../pulls)

---

</div>

<br/>

## 💀 THE PITCH

> **You have crypto. You have secrets. You have people who matter.**
>
> Now imagine tomorrow you're gone. Permanently.
>
> Your seed phrase dies with you. Your ETH? Locked forever in a wallet nobody can open. The message you meant to send? Unsent. The people you wanted to protect? Unprotected.
>
> **Ghost Protocol fixes this.**
>
> It's a vault that watches for your **cryptographic heartbeat**. You prove you're alive with zero-knowledge proofs — no passwords on-chain, no trusted third parties, no single points of failure. Miss your check-in window? The protocol wakes up. Your messages get revealed. Your assets get distributed. Your digital legacy executes itself.
>
> **Not "if." When.**

<br/>

<div align="center">

```
   YOU (alive)                         YOU (gone)

   ┌─────────┐                        ┌─────────┐
   │  😊 ZK  │  ─── check-in ──▶     │  💀     │
   │  proof  │                        │  ...    │
   └─────────┘                        └────┬────┘
                                           │
                                      no check-in
                                           │
                                           ▼
                                    ╔═════════════╗
                                    ║  👻 GHOST   ║
                                    ║  PROTOCOL   ║
                                    ║  ACTIVATES  ║
                                    ╚══════╤══════╝
                                           │
                          ┌────────────────┼────────────────┐
                          ▼                ▼                ▼
                    ┌──────────┐    ┌──────────┐    ┌──────────┐
                    │ 💌 Msgs  │    │ 💰 ETH   │    │ 🪙 ERC20 │
                    │ revealed │    │ sent to  │    │ sent to  │
                    │ on IPFS  │    │ family   │    │ family   │
                    └──────────┘    └──────────┘    └──────────┘
```

</div>

<br/>

## 🧬 HOW IT WORKS (THE DEEP DIVE)

<details>
<summary><h3>🔐 Step 1: Create Your Vault</h3></summary>

<br/>

You pick a **secret passphrase** (never stored, never transmitted). The app hashes it with [Poseidon](https://www.poseidon-hash.info/) and commits the hash on-chain.

```
passphrase: "the night is dark and full of terrors"
                    │
                    ▼
         ┌───────────────────┐
         │   Poseidon Hash   │
         │   (ZK-friendly)   │
         └─────────┬─────────┘
                   │
                   ▼
commitment: 0x1a2b3c...  ◀── this is ALL the chain ever sees
```

You also set:
- ⏰ **Check-in window** (1–365 days)
- 👥 **Beneficiaries** (up to 10, percentage-based splits)
- 💌 **Encrypted messages** (pinned to IPFS)
- 🛡️ **Guardians** (with Shamir-split recovery shards)
- 💰 **Initial deposit** (ETH sent with vault creation)

</details>

<details>
<summary><h3>👁️ Step 2: Prove You're Alive</h3></summary>

<br/>

Before your window expires, you submit a **Groth16 zero-knowledge proof** that you know the passphrase. No passphrase is ever sent to the blockchain.

```
┌─────────────────────────────────────────────────────────────────┐
│                     LIVENESS PROOF CIRCUIT                       │
│                                                                 │
│   PRIVATE INPUTS:                   PUBLIC OUTPUTS:             │
│   ┌────────────────────┐           ┌────────────────────┐      │
│   │  secret  (your     │──Poseidon▶│  commitment        │      │
│   │  passphrase hash)  │           │  (matches on-chain)│      │
│   └────────────────────┘           └────────────────────┘      │
│   ┌────────────────────┐           ┌────────────────────┐      │
│   │  nonce   (fresh    │──Poseidon▶│  nullifier         │      │
│   │  anti-replay val)  │  (2)      │  (unique per proof)│      │
│   └────────────────────┘           └────────────────────┘      │
│                                                                 │
│   CONSTRAINT: commitment === Poseidon(secret)                   │
│   CONSTRAINT: nullifier  === Poseidon(secret, nonce)            │
│                                                                 │
│   The contract VERIFIES the proof on-chain ✓                    │
│   The contract REJECTS replayed nullifiers ✗                    │
└─────────────────────────────────────────────────────────────────┘
```

**The magic:** The chain is *mathematically convinced* you know the passphrase without ever learning what it is. Each proof is unique (fresh nonce → fresh nullifier), so you can't replay old proofs.

</details>

<details>
<summary><h3>⏱️ Step 3: The Silence</h3></summary>

<br/>

You miss a check-in. Maybe you can't get online. Maybe something worse happened. The vault notices.

```
        Last Check-In                      Window Expires
              │                                  │
              ▼                                  ▼
══════════════╪══════════════════════════════════╪════════════════
              │           check-in window        │
              │◄────────────────────────────────►│
              │                                  │
              │    ✅ Alive     ✅ Alive          │  ❌ MISSED
              │    (Day 3)     (Day 12)          │
              │                                  │
              │                                  ▼
              │                           ╔═══════════╗
              │                           ║ TRIGGERED ║
              │                           ╚═══════════╝
```

</details>

<details>
<summary><h3>💀 Step 4: Staged Execution Cascade</h3></summary>

<br/>

Ghost Protocol doesn't execute everything at once. It gives you **escalating grace periods** — 4 stages, each unlocking more actions:

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║  ⚠️  STAGE 1  ──  +1 DAY  ────────────────────────────────────────  ║
║  │   Vault state → TRIGGERED                                        ║
║  │   Notification emails fire                                        ║
║  │   Guardians alerted                                               ║
║  │                                                                   ║
║  💌 STAGE 2  ──  +7 DAYS  ────────────────────────────────────────  ║
║  │   All encrypted messages → REVEALED                               ║
║  │   Recipients can read IPFS-stored messages                        ║
║  │   "If you're reading this..." moments                             ║
║  │                                                                   ║
║  💰 STAGE 3  ──  +30 DAYS ────────────────────────────────────────  ║
║  │   ETH distributed to beneficiaries (% split)                      ║
║  │   ERC-20 tokens distributed to beneficiaries                      ║
║  │   Shamir shards become reconstructible                            ║
║  │                                                                   ║
║  🏁 STAGE 4  ──  +90 DAYS ────────────────────────────────────────  ║
║     Vault state → EXECUTED (permanent)                               ║
║     No further actions possible                                      ║
║     The ghost has spoken.                                            ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

     ┌─────────────────────────────────────────────────────┐
     │  🔑 AT ANY POINT BEFORE STAGE 4:                    │
     │                                                     │
     │  Submit a valid ZK proof → vault RESETS              │
     │  You're back. The ghost sleeps.                     │
     └─────────────────────────────────────────────────────┘
```

</details>

<br/>

## 🧠 THE ACTUAL CIRCUIT

This is the real Circom source. 32 lines that protect your legacy:

```circom
pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

/*
  LivenessProof — the heartbeat of Ghost Protocol.
  
  Proves knowledge of a secret passphrase without revealing it.
  Each proof is unique via a fresh nonce → nullifier pair.
*/
template LivenessProof() {
    signal input secret;          // 🔑 Private: your passphrase field element
    signal input nonce;           // 🎲 Private: fresh anti-replay value

    signal input commitment;      // 📌 Public: Poseidon(secret)
    signal input nullifier;       // 🚫 Public: Poseidon(secret, nonce)

    // ── Verify the commitment matches ──────────────────────
    component commitHasher = Poseidon(1);
    commitHasher.inputs[0] <== secret;
    commitment === commitHasher.out;
    //   ▲ If this fails, you don't know the passphrase.

    // ── Verify the nullifier is correctly derived ──────────
    component nullHasher = Poseidon(2);
    nullHasher.inputs[0] <== secret;
    nullHasher.inputs[1] <== nonce;
    nullifier === nullHasher.out;
    //   ▲ If this is reused, the contract rejects it.
}

component main { public [commitment, nullifier] } = LivenessProof();
```

<br/>

## 🏗️ ARCHITECTURE

<div align="center">

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║                     G H O S T   P R O T O C O L                       ║
║                                                                       ║
║  ┌──────────────────────────────────────────────────────────────────┐  ║
║  │                        🌐 NEXT.JS FRONTEND                      │  ║
║  │                                                                  │  ║
║  │   ┌────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ │  ║
║  │   │ Setup  │ │ Dashboard │ │ Check-In │ │ Guardian │ │ Reveal│ │  ║
║  │   │  Page  │ │   Page    │ │  Page    │ │  Page    │ │  Page │ │  ║
║  │   └────┬───┘ └─────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬───┘ │  ║
║  │        └────────────┴────────────┴────────────┴────────────┘     │  ║
║  └─────────────────────────────┬────────────────────────────────────┘  ║
║                                │                                      ║
║                 ┌──────────────┼──────────────┐                       ║
║                 │              │              │                       ║
║                 ▼              ▼              ▼                       ║
║  ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐          ║
║  │   📡 EXPRESS API  │ │  ⛓️ ETHEREUM  │ │   📦 IPFS/PINATA │          ║
║  │                  │ │   (SEPOLIA)  │ │                  │          ║
║  │  /health         │ │              │ │  Encrypted       │          ║
║  │  /vault/:addr    │ │  GhostVault  │ │  Messages        │          ║
║  │  /guardian/:addr │ │  .sol        │ │                  │          ║
║  │  /notify         │ │              │ │  Shamir          │          ║
║  │                  │ │  Liveness    │ │  Shards          │          ║
║  │  📧 Resend       │ │  Verifier    │ │                  │          ║
║  │  (email alerts)  │ │  .sol        │ │  Vault           │          ║
║  │                  │ │              │ │  Metadata         │          ║
║  └──────────────────┘ └──────┬───────┘ └──────────────────┘          ║
║                              │                                       ║
║                     ┌────────┴────────┐                               ║
║                     │   🔒 CIRCOM     │                               ║
║                     │   ZK CIRCUIT    │                               ║
║                     │                 │                               ║
║                     │  Groth16        │                               ║
║                     │  Poseidon Hash  │                               ║
║                     │  snarkjs        │                               ║
║                     └─────────────────┘                               ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

</div>

<br/>

## 🛡️ SECURITY LAYERS

```
 ┌──────────────────────────────────────────────────────────────────────┐
 │                     SECURITY ONION 🧅                                │
 │                                                                      │
 │   Layer 1:  ZK PROOFS                                                │
 │   ════════  Passphrase NEVER touches the chain.                      │
 │             Groth16 proof verified by on-chain verifier.             │
 │                                                                      │
 │   Layer 2:  NULLIFIER REPLAY PROTECTION                              │
 │   ════════  Every proof has a unique nullifier.                      │
 │             Contract mapping rejects duplicates.                      │
 │                                                                      │
 │   Layer 3:  REENTRANCY GUARDS                                        │
 │   ════════  OpenZeppelin ReentrancyGuard on all                      │
 │             ETH + ERC-20 distribution functions.                      │
 │                                                                      │
 │   Layer 4:  TIME-LOCKED STAGING                                      │
 │   ════════  4 escalating stages (1d / 7d / 30d / 90d).              │
 │             You can always come back before Stage 4.                  │
 │                                                                      │
 │   Layer 5:  SHAMIR SECRET SHARING                                    │
 │   ════════  Recovery shards split across 7 guardians.                │
 │             No single guardian can reconstruct.                       │
 │                                                                      │
 │   Layer 6:  IPFS ENCRYPTION                                          │
 │   ════════  Messages encrypted BEFORE pinning.                       │
 │             IPFS hashes are pointers, not secrets.                    │
 │                                                                      │
 │   Layer 7:  INPUT VALIDATION                                         │
 │   ════════  On-chain: address(0) checks, percentage validation,     │
 │             array bounds (≤10 beneficiaries, ≤7 guardians,           │
 │             ≤20 messages), window range (1-365 days).                │
 │                                                                      │
 └──────────────────────────────────────────────────────────────────────┘
```

> [!CAUTION]
> **UNAUDITED PROTOTYPE.** This has not received an independent security audit. Use with Sepolia testnet keys only. Do **NOT** deposit real funds. The contracts, circuit, proof flow, and guardian workflow all need formal review before any mainnet deployment.

<br/>

## 🚀 QUICK START

<details>
<summary><b>📋 Prerequisites</b></summary>

<br/>

| Requirement | Version |
|:---|:---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| MetaMask | Latest |
| Sepolia ETH | [Get from faucet](https://sepoliafaucet.com) |

</details>

### 1️⃣ Clone & Install

```bash
git clone https://github.com/mitanshj07/ghostprotocol.git
cd ghostprotocol

# Install root + frontend dependencies
npm install
npm --prefix frontend install

# Set up environment
cp .env.example .env
```

### 2️⃣ Configure `.env`

```env
# Required: Alchemy RPC
ALCHEMY_API_KEY=your_key
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/your_key

# Required: Deployer wallet (TESTNET ONLY!)
DEPLOYER_PRIVATE_KEY=0x...

# Optional: IPFS pinning
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret

# Optional: Email notifications
RESEND_API_KEY=re_...
```

> [!WARNING]
> **Never** use a private key that has been pasted into chat, stored in logs, or used on mainnet. Rotate frequently.

### 3️⃣ Test

```bash
npm test
```

### 4️⃣ Compile ZK Circuit (optional — mock verifier works for testing)

```bash
npm run circuit       # Circom → WASM + zkey
npm run proof:test    # Local proof generation test
npm run compile       # Compile contracts with real verifier
```

### 5️⃣ Deploy

```bash
npm run deploy        # → Sepolia
```

### 6️⃣ Launch

```bash
npm run api              # Express API on :3001
npm run frontend:dev     # Next.js on :3000
```

<br/>

## 🌐 LIVE DEPLOYMENT

<div align="center">

<table>
  <tr>
    <th>🌐 Frontend</th>
    <th>📡 API</th>
  </tr>
  <tr>
    <td>
      <a href="https://frontend-beige-one-97.vercel.app">
        <img src="https://img.shields.io/badge/Vercel-Live-000?style=for-the-badge&logo=vercel&logoColor=white" alt="Frontend"/>
      </a>
    </td>
    <td>
      <a href="https://ghostprotocol-api.onrender.com">
        <img src="https://img.shields.io/badge/Render-Live-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="API"/>
      </a>
    </td>
  </tr>
</table>

</div>

### 📜 Verified Contracts on Sepolia

| Contract | Address | Explorer |
|:---|:---|:---:|
| **LivenessVerifier** | `0x01819a4943DAC272b7381BAB166e8476dc4660aB` | [↗ Etherscan](https://sepolia.etherscan.io/address/0x01819a4943DAC272b7381BAB166e8476dc4660aB#code) |
| **GhostVault** | `0x50d3EaCB039472AB5C0231745452847AfE309E69` | [↗ Etherscan](https://sepolia.etherscan.io/address/0x50d3EaCB039472AB5C0231745452847AfE309E69#code) |

<br/>

## 📂 PROJECT MAP

```
ghostprotocol/
│
├── 🔒 circuits/
│   ├── liveness.circom              ← THE circuit. 32 lines. Protects your legacy.
│   └── build/                       ← Compiled WASM + zkey artifacts
│
├── ⛓️  contracts/
│   ├── GhostVault.sol               ← 444 lines. Vault, beneficiaries, guardians,
│   │                                   messages, staged execution, token distribution
│   ├── LivenessVerifier.sol         ← Groth16 on-chain verifier (auto-generated)
│   ├── interfaces/
│   │   ├── IGhostVault.sol          ← Vault interface + enums + structs
│   │   └── ILivenessVerifier.sol    ← Verifier interface
│   └── mocks/
│       └── MockVerifier.sol         ← Always-true verifier for testing
│
├── 🌐 frontend/                     [Next.js]
│   ├── pages/
│   │   ├── index.js                 ← Landing page
│   │   ├── setup.js                 ← Vault creation flow
│   │   ├── dashboard.js             ← Vault status + check-in
│   │   ├── guardian.js              ← Guardian management
│   │   └── reveal/                  ← Message reveal flow
│   ├── components/                  ← Reusable UI components
│   ├── lib/                         ← ABIs, Web3 helpers, proof utils
│   └── styles/                      ← Global CSS
│
├── 📡 api/                          [Express]
│   ├── index.js                     ← Server + all routes
│   ├── guardian.js                  ← Guardian metadata
│   ├── notifications.js            ← Email alerts (Resend)
│   └── health.js                   ← Health check
│
├── 📜 scripts/
│   ├── compile-circuit.sh           ← Circom → Powers of Tau → zkey → Verifier.sol
│   ├── deploy.js                    ← Hardhat deployment script
│   ├── test-proof.js                ← Local proof generation test
│   └── verify.js                    ← Etherscan contract verification
│
├── 🧪 test/
│   └── GhostVault.test.js           ← Full test suite (mock verifier)
│
├── hardhat.config.js                ← Network config (Sepolia)
├── package.json
├── render.yaml                      ← Render.com API deployment
└── .env.example                     ← Environment template
```

<br/>

## 🗺️ ROADMAP

<div align="center">

```
     DONE ✅                           BUILDING 🔨                        FUTURE 🔮
       │                                  │                                  │
       ▼                                  ▼                                  ▼
 ┌───────────────┐                 ┌───────────────┐                 ┌───────────────┐
 │ ZK Liveness   │                 │ Keeper Bots   │                 │ Cross-chain   │
 │ Circuit       │                 │ (Auto-stage   │                 │ Vaults (L2s,  │
 │               │                 │  execution)   │                 │  alt-EVMs)    │
 │ GhostVault    │                 │               │                 │               │
 │ Contract      │                 │ Multi-sig     │                 │ ENS-native    │
 │               │                 │ Guardian      │                 │ Vault names   │
 │ Beneficiary   │                 │ Thresholds    │                 │               │
 │ Distribution  │                 │               │                 │ Mobile PWA    │
 │               │                 │ Mainnet       │                 │ with push     │
 │ Shamir        │                 │ Audit &       │                 │ notifications │
 │ Guardians     │                 │ Deploy        │                 │               │
 │               │                 │               │                 │ Streaming     │
 │ Encrypted     │                 │               │                 │ payments      │
 │ Messages      │                 │               │                 │ (Sablier/     │
 │               │                 │               │                 │  Superfluid)  │
 │ Next.js       │                 │               │                 │               │
 │ Frontend      │                 │               │                 │ NFT-gated     │
 │               │                 │               │                 │ memorial      │
 │ Express API   │                 │               │                 │ pages         │
 │               │                 │               │                 │               │
 │ Email Alerts  │                 │               │                 │ DAO-based     │
 │               │                 │               │                 │ executor      │
 │ Sepolia       │                 │               │                 │ governance    │
 │ Deployment    │                 │               │                 │               │
 └───────────────┘                 └───────────────┘                 └───────────────┘
```

</div>

<br/>

## 🆚 HOW GHOST PROTOCOL COMPARES

| Feature | Ghost Protocol | Traditional Will | Centralized Service | Multisig |
|:---|:---:|:---:|:---:|:---:|
| **Trustless execution** | ✅ | ❌ Lawyers | ❌ Company | ⚠️ Signers |
| **Censorship resistant** | ✅ | ❌ | ❌ | ✅ |
| **Zero-knowledge privacy** | ✅ | ❌ | ❌ | ❌ |
| **Automated asset distribution** | ✅ | ⚠️ Slow | ⚠️ Limited | ❌ |
| **Posthumous messages** | ✅ | ⚠️ Physical | ❌ | ❌ |
| **Anti-replay protection** | ✅ | N/A | ❌ | ✅ |
| **Works when you're gone** | ✅ | ⚠️ Probate | ⚠️ Uptime? | ❌ Manual |
| **Open source** | ✅ | ❌ | ❌ | Varies |
| **Cost** | Gas only | $$$ | $$/month | Gas |

<br/>

## 🤝 CONTRIBUTING

<div align="center">

**Every contribution makes the ghost stronger.** 👻

</div>

```bash
# 1. Fork it
# 2. Branch it
git checkout -b feature/something-amazing

# 3. Build it
# 4. Test it
npm test

# 5. Commit it
git commit -m "feat: something amazing"

# 6. Push it
git push origin feature/something-amazing

# 7. PR it
```

> [!TIP]
> Check the [Issues](../../issues) tab for `good first issue` labels — or break something new. We don't judge.

### Ideas for Contributors

- 🤖 **Keeper bot** — automated stage execution when vaults trigger
- 📱 **PWA wrapper** — push notifications for check-in reminders
- 🔗 **ENS integration** — `yourvault.ghost.eth` instead of `0x50d3...`
- 🧪 **Fuzz testing** — throw chaos at the contract, see what survives
- 🎨 **UI/UX polish** — make the dashboard look like a mission control center
- 📖 **Documentation** — guides, tutorials, video walkthroughs

<br/>

## 📄 LICENSE

MIT. Do whatever you want. Build on it. Fork it. Make it better. Just don't blame us if your ghost activates early.

<br/>

## 💬 CONTACT

**Mitansh** — building things that outlast their builders.

[![GitHub](https://img.shields.io/badge/@mitanshj07-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mitanshj07)

<br/>

---

<div align="center">

<br/>

```


                    ████████████████
                ████                ████
              ██                        ██
            ██          ██    ██          ██
            ██          ██    ██          ██
          ██                                ██
          ██            ██████              ██
            ██                            ██
              ██                        ██
                ████                ████
                    ████████████████
                      ██  ██  ██
                      ██  ██  ██


     "Your private keys shouldn't die with you."

```

<br/>

**If this project gave you peace of mind, give it a** ⭐

**If it made you think about mortality, give it two** ⭐⭐

<br/>

<sub>Built with 🖤 and zero-knowledge proofs · Ghost Protocol © 2025</sub>

<br/>

[![Star History Chart](https://api.star-history.com/svg?repos=mitanshj07/ghostprotocol&type=Date)](https://star-history.com/#mitanshj07/ghostprotocol&Date)

</div>
