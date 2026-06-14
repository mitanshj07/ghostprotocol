function getHealth() {
  return {
    status: "ok",
    service: "ghostprotocol-api",
    network: "sepolia",
    contractAddress: process.env.GHOST_VAULT_ADDRESS || null,
    verifierAddress: process.env.LIVENESS_VERIFIER_ADDRESS || null,
    timestamp: new Date().toISOString()
  };
}

module.exports = { getHealth };
