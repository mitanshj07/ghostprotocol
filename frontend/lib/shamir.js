const FORMAT_PREFIX = "gp1";
const FIELD_SIZE = 256;
const GENERATOR = 0x03;
const MOD_POLY = 0x11b;

const { expTable, logTable } = buildTables();

function buildTables() {
  const exp = new Uint8Array(512);
  const log = new Uint8Array(FIELD_SIZE);
  let value = 1;

  for (let i = 0; i < 255; i++) {
    exp[i] = value;
    log[value] = i;
    value = multiplyNoTable(value, GENERATOR);
  }

  for (let i = 255; i < 512; i++) {
    exp[i] = exp[i - 255];
  }

  return { expTable: exp, logTable: log };
}

function multiplyNoTable(a, b) {
  let result = 0;
  let left = a;
  let right = b;

  while (right > 0) {
    if (right & 1) {
      result ^= left;
    }

    left <<= 1;
    if (left & 0x100) {
      left ^= MOD_POLY;
    }
    right >>= 1;
  }

  return result & 0xff;
}

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return expTable[logTable[a] + logTable[b]];
}

function gfDiv(a, b) {
  if (b === 0) throw new Error("Invalid share set");
  if (a === 0) return 0;
  return expTable[(logTable[a] + 255 - logTable[b]) % 255];
}

function evaluatePolynomial(coefficients, x) {
  let result = coefficients[coefficients.length - 1];
  for (let i = coefficients.length - 2; i >= 0; i--) {
    result = gfMul(result, x) ^ coefficients[i];
  }
  return result;
}

function getRandomBytes(length) {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Secure random number generator is unavailable");
  }

  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toBase64Url(bytes) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");

  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(base64, "base64"));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encodeShare(id, bytes) {
  return `${FORMAT_PREFIX}:${id}:${toBase64Url(bytes)}`;
}

function decodeShare(share) {
  const [prefix, idText, payload] = String(share).split(":");
  const id = Number(idText);

  if (prefix !== FORMAT_PREFIX || !Number.isInteger(id) || id < 1 || id > 255 || !payload) {
    throw new Error("Invalid shard format");
  }

  return { id, bytes: fromBase64Url(payload) };
}

export function splitSecret(secret, numShards, threshold) {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error("Secret is required");
  }
  if (!Number.isInteger(numShards) || numShards < 2 || numShards > 255) {
    throw new Error("Shard count must be between 2 and 255");
  }
  if (!Number.isInteger(threshold) || threshold < 2 || threshold > numShards) {
    throw new Error("Threshold must be between 2 and shard count");
  }

  const secretBytes = new TextEncoder().encode(secret);
  const shares = Array.from({ length: numShards }, (_, index) => ({
    id: index + 1,
    bytes: new Uint8Array(secretBytes.length)
  }));

  for (let byteIndex = 0; byteIndex < secretBytes.length; byteIndex++) {
    const coefficients = new Uint8Array(threshold);
    coefficients[0] = secretBytes[byteIndex];
    coefficients.set(getRandomBytes(threshold - 1), 1);

    for (const share of shares) {
      share.bytes[byteIndex] = evaluatePolynomial(coefficients, share.id);
    }
  }

  return shares.map((share) => encodeShare(share.id, share.bytes));
}

export function reconstructSecret(shards) {
  if (!Array.isArray(shards) || shards.length < 2) {
    throw new Error("Need at least 2 shards to reconstruct");
  }

  const decoded = shards.map(decodeShare);
  const byteLength = decoded[0].bytes.length;
  const seen = new Set();

  for (const share of decoded) {
    if (seen.has(share.id)) throw new Error("Duplicate shard id");
    if (share.bytes.length !== byteLength) throw new Error("Shard lengths do not match");
    seen.add(share.id);
  }

  const secretBytes = new Uint8Array(byteLength);

  for (let byteIndex = 0; byteIndex < byteLength; byteIndex++) {
    let value = 0;

    for (let i = 0; i < decoded.length; i++) {
      let basis = 1;

      for (let j = 0; j < decoded.length; j++) {
        if (i === j) continue;
        basis = gfMul(basis, gfDiv(decoded[j].id, decoded[i].id ^ decoded[j].id));
      }

      value ^= gfMul(decoded[i].bytes[byteIndex], basis);
    }

    secretBytes[byteIndex] = value;
  }

  return new TextDecoder().decode(secretBytes);
}

export function validateShard(shard) {
  try {
    decodeShare(shard);
    return true;
  } catch {
    return false;
  }
}
