export async function encryptMessage(message, recipientPublicKey) {
  const EthCrypto = (await import("eth-crypto")).default;
  const encrypted = await EthCrypto.encryptWithPublicKey(
    recipientPublicKey.replace("0x", ""),
    message
  );
  return EthCrypto.cipher.stringify(encrypted);
}

export async function decryptMessage(encryptedString, privateKey) {
  const EthCrypto = (await import("eth-crypto")).default;
  const encrypted = EthCrypto.cipher.parse(encryptedString);
  return EthCrypto.decryptWithPrivateKey(privateKey.replace("0x", ""), encrypted);
}

export async function getPublicKeyFromSig(address, provider) {
  const EthCrypto = (await import("eth-crypto")).default;
  const message = `GhostProtocol public key registration for ${address}`;
  const signature = await provider.getSigner().signMessage(message);
  const msgHash = EthCrypto.hash.keccak256(message);
  return EthCrypto.recoverPublicKey(signature, msgHash);
}

export async function encryptShardForGuardian(shard, guardianPublicKey) {
  return encryptMessage(shard, guardianPublicKey);
}
