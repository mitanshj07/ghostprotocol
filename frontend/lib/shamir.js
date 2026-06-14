import secrets from "secrets.js-grempe";

export function splitSecret(secret, numShards, threshold) {
  if (threshold > numShards) throw new Error("Threshold cannot exceed shard count");
  if (numShards < 2) throw new Error("Need at least 2 shards");
  if (threshold < 2) throw new Error("Threshold must be at least 2");

  const hex = secrets.str2hex(secret);
  return secrets.share(hex, numShards, threshold);
}

export function reconstructSecret(shards) {
  if (!shards || shards.length < 2) {
    throw new Error("Need at least 2 shards to reconstruct");
  }
  const hex = secrets.combine(shards);
  return secrets.hex2str(hex);
}

export function validateShard(shard) {
  return typeof shard === "string" && shard.length > 0;
}
