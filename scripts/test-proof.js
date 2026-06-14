const path = require("path");
const snarkjs = require("snarkjs");
const { buildPoseidon } = require("circomlibjs");

async function main() {
  const wasmPath = path.join(__dirname, "../circuits/build/liveness_js/liveness.wasm");
  const zkeyPath = path.join(__dirname, "../circuits/build/liveness_final.zkey");
  const vkeyPath = path.join(__dirname, "../circuits/build/verification_key.json");

  const poseidon = await buildPoseidon();
  const secret = BigInt("123456789");
  const nonce = BigInt("987654321");
  const commitment = poseidon.F.toString(poseidon([secret]));
  const nullifier = poseidon.F.toString(poseidon([secret, nonce]));

  console.log("Commitment:", commitment);
  console.log("Nullifier:", nullifier);

  const startedAt = Date.now();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {
      secret: secret.toString(),
      nonce: nonce.toString(),
      commitment,
      nullifier
    },
    wasmPath,
    zkeyPath
  );

  const vKey = require(vkeyPath);
  const valid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(2);

  console.log("Proof valid:", valid);
  console.log("Proof generation time:", `${elapsedSeconds}s`);

  if (!valid) {
    process.exit(1);
  }

  console.log("ZK CIRCUIT TEST PASSED");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
