# GHOSTPROTOCOL

A dead man's switch for the blockchain.

GhostProtocol is a local-first Web3 prototype for cryptographically enforced liveness. Users create an on-chain vault, commit to a private passphrase with a Poseidon hash, check in with a zero-knowledge proof, and define staged execution if the check-in window is missed.

## What is included

- Circom liveness circuit proving knowledge of `secret` and `nonce`
- Solidity vault with beneficiaries, guardians, messages, staged execution, ETH distribution, and token distribution hooks
- Hardhat tests with a mock verifier
- Express API for health, vault reads, guardian metadata, notification hooks, and keeper stubs
- Next.js frontend for setup, dashboard, check-ins, guardians, reveal flow, Shamir splitting, and encrypted message pointers

## Architecture

| Layer | Role |
| --- | --- |
| Circom | Builds a Groth16 circuit for proof of passphrase knowledge |
| Solidity | Stores commitments, check-in state, beneficiaries, guardians, messages, and staged execution |
| Frontend | Generates commitments and browser-side proofs, manages vault UX |
| API | Monitors vault state, exposes helper reads, and sends notification emails |
| IPFS | Stores encrypted shards, metadata, and messages outside the chain |

## ZK circuit

The circuit has two private inputs:

- `secret`: a field element derived from the user's passphrase
- `nonce`: a fresh field element used to prevent replay

It exposes two public inputs:

- `commitment = Poseidon(secret)`
- `nullifier = Poseidon(secret, nonce)`

The contract stores the commitment and rejects reused nullifiers.

## Local setup

```bash
npm install
npm --prefix frontend install
cp .env.example .env
npm test
npm run frontend:build
```

To compile the real circuit and replace the placeholder verifier:

```bash
npm run circuit
npm run proof:test
npm run compile
```

## Deployment

Fill `.env` locally with rotated testnet-only credentials. Do not use a private key that has been pasted into chat or stored in logs.

```bash
npm run deploy
```

The deploy script writes deployed addresses back into local env files.

## Sepolia deployment

| Contract | Address |
| --- | --- |
| Liveness verifier | [`0x01819a4943DAC272b7381BAB166e8476dc4660aB`](https://sepolia.etherscan.io/address/0x01819a4943DAC272b7381BAB166e8476dc4660aB#code) |
| GhostVault | [`0x50d3EaCB039472AB5C0231745452847AfE309E69`](https://sepolia.etherscan.io/address/0x50d3EaCB039472AB5C0231745452847AfE309E69#code) |

## Live app

- Frontend: https://frontend-beige-one-97.vercel.app
- Vercel deployment: https://frontend-pyk86z3hb-mitanshj07s-projects.vercel.app
- API: https://ghostprotocol-api.onrender.com

## Security notes

This is a prototype. Before mainnet use, the contracts, circuit, frontend proof flow, guardian workflow, and notification automation need independent review. Use Sepolia-only keys while iterating.
