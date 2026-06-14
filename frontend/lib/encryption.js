import { encrypt } from "@metamask/eth-sig-util";

const ENCRYPTION_VERSION = "x25519-xsalsa20-poly1305";

function requireEthereum() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is required for wallet encryption.");
  }
  return window.ethereum;
}

export async function getPublicKeyFromSig(address, provider) {
  const account = address || await provider?.getSigner?.().then((signer) => signer.getAddress());
  if (!account) {
    throw new Error("Wallet address is required to request an encryption public key.");
  }

  return requireEthereum().request({
    method: "eth_getEncryptionPublicKey",
    params: [account]
  });
}

export async function encryptMessage(message, recipientPublicKey) {
  const payload = encrypt({
    publicKey: recipientPublicKey.replace(/^0x/, ""),
    data: message,
    version: ENCRYPTION_VERSION
  });

  return JSON.stringify(payload);
}

export async function decryptMessage(encryptedString, address) {
  if (!address) {
    throw new Error("Wallet address is required to decrypt a message.");
  }

  return requireEthereum().request({
    method: "eth_decrypt",
    params: [encryptedString, address]
  });
}

export async function encryptShardForGuardian(shard, guardianPublicKey) {
  return encryptMessage(shard, guardianPublicKey);
}
