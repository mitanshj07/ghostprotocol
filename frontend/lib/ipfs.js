const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function uploadJsonToPinata(payload, name = "ghostprotocol.json") {
  const response = await fetch(`${API_URL}/api/ipfs/json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, payload })
  });

  if (!response.ok) {
    throw new Error("IPFS upload failed");
  }

  return response.json();
}

export function ipfsGatewayUrl(hash) {
  if (!hash) return "";
  return hash.startsWith("ipfs://")
    ? `https://gateway.pinata.cloud/ipfs/${hash.replace("ipfs://", "")}`
    : `https://gateway.pinata.cloud/ipfs/${hash}`;
}
