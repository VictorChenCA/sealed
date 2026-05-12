import { mnemonicToAccount } from "viem/accounts";
import { createHash } from "node:crypto";

// The MNEMONIC env var is injected by EigenCompute's KMS and is sealed to
// the enclave. The signing key is derived from it deterministically — same
// enclave image always derives the same key.

let cachedAccount: ReturnType<typeof mnemonicToAccount> | null = null;
let pubAddress: `0x${string}` | null = null;

function account() {
  if (cachedAccount) return cachedAccount;
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) {
    throw new Error(
      "MNEMONIC env var not set — outside EigenCompute, set one in .env for local testing.",
    );
  }
  cachedAccount = mnemonicToAccount(mnemonic);
  pubAddress = cachedAccount.address;
  return cachedAccount;
}

export function enclavePublicAddress(): `0x${string}` {
  account();
  return pubAddress!;
}

export async function signReveal(body: object) {
  const acct = account();
  const canonical = canonicalize(body);
  const digest = createHash("sha256").update(canonical).digest("hex");
  const signature = await acct.signMessage({ message: digest });
  return {
    enclave_pubkey: acct.address,
    payload_sha256: digest,
    signature,
  };
}

// Deterministic JSON: sort keys recursively so signatures are reproducible.
function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(canonicalize).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(obj[k])).join(",") + "}";
}
