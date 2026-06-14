pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

/*
  LivenessProof proves knowledge of:
    secret: private passphrase field element
    nonce: private anti-replay value

  Public inputs:
    commitment = Poseidon(secret)
    nullifier = Poseidon(secret, nonce)
*/
template LivenessProof() {
    signal input secret;
    signal input nonce;

    signal input commitment;
    signal input nullifier;

    component commitHasher = Poseidon(1);
    commitHasher.inputs[0] <== secret;
    commitment === commitHasher.out;

    component nullHasher = Poseidon(2);
    nullHasher.inputs[0] <== secret;
    nullHasher.inputs[1] <== nonce;
    nullifier === nullHasher.out;
}

component main { public [commitment, nullifier] } = LivenessProof();
