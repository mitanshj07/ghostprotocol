#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p circuits/build contracts frontend/public/circuits

if ! command -v circom >/dev/null 2>&1; then
  echo "circom not found. Install circom 2.x from https://docs.circom.io/getting-started/installation/"
  exit 1
fi

if ! command -v snarkjs >/dev/null 2>&1; then
  echo "snarkjs not found. Installing with npm."
  npm install -g snarkjs
fi

echo "Compiling liveness circuit..."
circom circuits/liveness.circom --r1cs --wasm --sym -o circuits/build/

PTAU="circuits/build/pot12.ptau"
if [ ! -f "$PTAU" ]; then
  echo "Downloading Powers of Tau pot12..."
  curl -fsSL "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau" -o "$PTAU" || \
    curl -fsSL "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau" -o "$PTAU"
fi

echo "Running Groth16 setup..."
snarkjs groth16 setup circuits/build/liveness.r1cs "$PTAU" circuits/build/liveness_0000.zkey

echo "Contributing dev entropy..."
printf "ghostprotocol random contribution\n" | snarkjs zkey contribute \
  circuits/build/liveness_0000.zkey \
  circuits/build/liveness_final.zkey \
  --name="GhostProtocol Dev" -v

echo "Exporting verification key..."
snarkjs zkey export verificationkey \
  circuits/build/liveness_final.zkey \
  circuits/build/verification_key.json

echo "Generating Solidity verifier..."
snarkjs zkey export solidityverifier \
  circuits/build/liveness_final.zkey \
  contracts/LivenessVerifier.sol

cp circuits/build/liveness_js/liveness.wasm frontend/public/circuits/
cp circuits/build/liveness_final.zkey frontend/public/circuits/
cp circuits/build/verification_key.json frontend/public/circuits/

echo "Circuit compiled successfully"
echo "Verifier contract generated at contracts/LivenessVerifier.sol"
