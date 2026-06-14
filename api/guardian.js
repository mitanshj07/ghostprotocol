const guardians = new Map();

function key(vaultOwner, guardian) {
  return `${vaultOwner.toLowerCase()}:${guardian.toLowerCase()}`;
}

function rememberGuardian({ vaultOwner, guardian, shardIpfsHash, email }) {
  const entry = {
    vaultOwner,
    guardian,
    shardIpfsHash,
    email: email || null,
    createdAt: new Date().toISOString()
  };
  guardians.set(key(vaultOwner, guardian), entry);
  return entry;
}

function getGuardian(vaultOwner, guardian) {
  return guardians.get(key(vaultOwner, guardian)) || null;
}

function listGuardians(vaultOwner) {
  return Array.from(guardians.values()).filter(
    (entry) => entry.vaultOwner.toLowerCase() === vaultOwner.toLowerCase()
  );
}

module.exports = {
  rememberGuardian,
  getGuardian,
  listGuardians
};
