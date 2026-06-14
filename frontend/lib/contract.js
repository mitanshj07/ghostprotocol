import { ethers } from "ethers";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
export const VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_VERIFIER_ADDRESS || "";
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

function walletErrorMessage(error, fallback) {
  if (error?.code === 4001) {
    return "Wallet request rejected.";
  }
  if (error?.code === -32002) {
    return "A wallet request is already open. Check MetaMask.";
  }
  return error?.shortMessage || error?.reason || error?.message || fallback;
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

    throw new Error(walletErrorMessage(error, `Switch MetaMask to chain ${CHAIN_ID}.`));
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
    throw new Error(walletErrorMessage(error, "Unable to connect wallet."));
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
