const FIELD_MODULUS = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");

export function passphraseToField(passphrase) {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  let hash = BigInt(0);

  for (let i = 0; i < data.length; i++) {
    hash = (hash * BigInt(31) + BigInt(data[i])) % FIELD_MODULUS;
  }

  return hash;
}

export async function generateCommitment(passphrase) {
  const { buildPoseidon } = await import("circomlibjs");
  const poseidon = await buildPoseidon();
  const secret = passphraseToField(passphrase);
  return poseidon.F.toString(poseidon([secret]));
}

export function generateNonce() {
  const array = new Uint8Array(31);
  crypto.getRandomValues(array);
  return BigInt(`0x${Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("")}`);
}

export async function generateLivenessProof(passphrase, nonce) {
  const [{ buildPoseidon }, snarkjs] = await Promise.all([
    import("circomlibjs"),
    import("snarkjs")
  ]);

  const poseidon = await buildPoseidon();
  const secret = passphraseToField(passphrase);
  const nonceField = nonce % FIELD_MODULUS;

  const commitment = poseidon.F.toString(poseidon([secret]));
  const nullifier = poseidon.F.toString(poseidon([secret, nonceField]));

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    {
      secret: secret.toString(),
      nonce: nonceField.toString(),
      commitment,
      nullifier
    },
    "/circuits/liveness.wasm",
    "/circuits/liveness_final.zkey"
  );

  const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  const parsed = JSON.parse(`[${calldata}]`);

  return {
    pA: parsed[0],
    pB: parsed[1],
    pC: parsed[2],
    pubSignals: parsed[3],
    commitment,
    nullifier,
    proof,
    publicSignals
  };
}

export async function verifyProofLocally(proof, publicSignals) {
  const snarkjs = await import("snarkjs");
  const vKey = await fetch("/circuits/verification_key.json").then((response) => response.json());
  return snarkjs.groth16.verify(vKey, publicSignals, proof);
}
