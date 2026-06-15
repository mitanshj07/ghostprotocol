import { ethers } from "ethers";

export const DEFAULT_CONTRACT_ADDRESS = "0x50d3EaCB039472AB5C0231745452847AfE309E69";
export const DEFAULT_VERIFIER_ADDRESS = "0x01819a4943DAC272b7381BAB166e8476dc4660aB";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS;
export const VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_VERIFIER_ADDRESS || DEFAULT_VERIFIER_ADDRESS;
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

export const GHOST_VAULT_ABI = [
  "function createVault(uint256 commitment,uint256 checkInWindowDays,tuple(address wallet,uint8 percentage,string name)[] beneficiaries,string metadataIpfsHash) payable",
  "function submitLivenessProof(uint256[2] pA,uint256[2][2] pB,uint256[2] pC,uint256[2] pubSignals)",
  "function depositETH() payable",
  "function addGuardian(address guardian,string shardIpfsHash)",
  "function confirmGuardianRole(address vaultOwner)",
  "function addMessage(address recipient,string encryptedIpfsHash)",
  "function revealMessage(address vaultOwner) view returns (string)",
  "function hasVault(address owner) view returns (bool)",
  "function getVaultInfo(address owner) view returns (uint256,uint256,uint256,uint8,uint8,uint256,uint256,bool,uint256,string)",
  "function getBeneficiaries(address owner) view returns (tuple(address wallet,uint8 percentage,string name)[])",
  "function getGuardians(address owner) view returns (tuple(address wallet,string shardIpfsHash,bool confirmed)[])",
  "function getMessages(address owner) view returns (tuple(address recipient,string encryptedIpfsHash,bool revealed)[])",
  "function getMessageCount(address owner) view returns (uint256)",
  "function nextExecutableStage(address owner) view returns (uint8)",
  "function triggerExecution(address owner)",
  "event CheckInSubmitted(address indexed owner,uint256 nullifier,uint256 timestamp)"
];

export function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function chainIdToHex(chainId) {
  return `0x${Number(chainId).toString(16)}`;
}

export function parseWeb3Error(error, fallback) {
  if (error?.code === 4001 || error?.code === "ACTION_REJECTED") {
    return "Wallet request rejected.";
  }
  if (error?.code === -32002) {
    return "A wallet request is already open. Check MetaMask.";
  }
  if (error?.code === "UNCONFIGURED_NAME" || error?.code === "INVALID_ARGUMENT") {
    return "Invalid wallet address or unconfigured ENS name.";
  }
  const customErrors = {
    "unconfigured name": "WHO THAT? 🤷‍♂️ UNCONFIGURED ENS NAME",
    "invalid address": "SUS ADDRESS 🚩 INVALID WALLET",
    "Commitment mismatch": "WRONG PASSPHRASE 🛑 TRY AGAIN",
    "Proof already used": "ALREADY CHECKED IN FR FR 🥱",
    "Invalid ZK proof": "SUS PROOF 🚨 VERIFICATION FAILED",
    "No vault found": "WHERE UR VAULT AT? 🫥 NO VAULT FOUND",
    "Not owner": "NICE TRY HACKER 🛑 NOT THE OWNER",
    "Vault not active": "VAULT IS DED 🪦 NOT ACTIVE",
    "Vault does not exist": "404 VAULT NOT FOUND 🕵️‍♂️",
    "Vault already exists": "YOU ALREADY GOT A VAULT FAM 🏦",
    "Invalid commitment": "BOGUS COMMITMENT 🚫 TRY AGAIN",
    "Window must be 1-365 days": "CAP 🧢 WINDOW MUST BE 1-365 DAYS",
    "1-10 beneficiaries required": "KEEP IT 1 TO 10 HOMIES 🤝",
    "Invalid beneficiary": "SUS ADDRESS 🚩 INVALID BENEFICIARY",
    "Cannot be own beneficiary": "CANT SEND TO URSELF BRO 💀",
    "Invalid percentage": "PERCENTAGE GIVING SUS VIBES 📉",
    "Percentages must sum to 100": "MATH AINT MATHING 🧮 MUST BE 100%",
    "No ETH sent": "WE BROKE? 💸 SEND SOME ETH",
    "Invalid token": "SHITCOIN DETECTED 💩 INVALID TOKEN",
    "Invalid amount": "ZERO BAGS? 🛑 INVALID AMOUNT",
    "Invalid guardian": "SUS GUARDIAN 🚩",
    "Cannot be own guardian": "CANT BE UR OWN GUARDIAN BRO 💀",
    "Missing shard hash": "WHERE THE SHARD AT? 🔍",
    "Maximum 7 guardians": "TOO MANY CHEFS 🍳 MAX 7 GUARDIANS",
    "Not a guardian": "WHO DIS? 🙅‍♂️ NOT A GUARDIAN",
    "Invalid recipient": "SUS RECIPIENT 🚩",
    "Missing message hash": "WHERE THE MESSAGE AT? 🔍",
    "Maximum 20 messages": "TOO MUCH YAPPING 🗣️ MAX 20 MESSAGES",
    "No stage executable": "CHILL 🧊 NOTHING TO EXECUTE YET",
    "Vault not triggered yet": "VAULT STILL CHILLING 🧊 NOT TRIGGERED",
    "ETH transfer failed": "DOWN BAD 📉 ETH TRANSFER FAILED",
    "No revealed message": "MESSAGES SECURED 🔒 NOTHIN TO SEE YET"
  };

  for (const [key, val] of Object.entries(customErrors)) {
    if (error?.reason === key || error?.message?.includes(key)) {
      return val;
    }
  }

  let msg = error?.reason || error?.shortMessage || error?.message || fallback;
  if (typeof msg === "string") {
    msg = msg.split(" (")[0];
    msg = msg.replace("execution reverted: ", "");
    msg = msg.replace("execution reverted", "Transaction failed");
    msg = msg.replace(/^"|"$/g, '');
  }
  return msg;
}

async function ensureChain(ethereum) {
  const targetChainId = chainIdToHex(CHAIN_ID);
  const currentChainId = await ethereum.request({ method: "eth_chainId" }).catch(() => null);

  if (!currentChainId || currentChainId.toLowerCase() === targetChainId.toLowerCase()) {
    return;
  }

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainId }]
    });
  } catch (error) {
    if (error?.code === 4902 && CHAIN_ID === SEPOLIA_CHAIN_ID) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: SEPOLIA_CHAIN_ID_HEX,
          chainName: "Sepolia",
          nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://rpc.sepolia.org"],
          blockExplorerUrls: ["https://sepolia.etherscan.io"]
        }]
      });
      return;
    }

    throw new Error(parseWeb3Error(error, `Switch MetaMask to chain ${CHAIN_ID}.`));
  }
}

export async function getBrowserProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is required to use GhostProtocol.");
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await ensureChain(window.ethereum);
  } catch (error) {
    throw new Error(parseWeb3Error(error, "Unable to connect wallet."));
  }

  return new ethers.BrowserProvider(window.ethereum, CHAIN_ID);
}

export async function getVaultContract(withSigner = false) {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address is not configured");
  }
  const provider = await getBrowserProvider();
  const runner = withSigner ? await provider.getSigner() : provider;
  return new ethers.Contract(CONTRACT_ADDRESS, GHOST_VAULT_ABI, runner);
}

export function parseVaultInfo(info) {
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
