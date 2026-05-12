import { getLlama, LlamaChatSession } from "node-llama-cpp";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

type State = "unloaded" | "loading" | "ready" | "error";

let state: State = "unloaded";
let modelHash: string | null = null;
let modelSizeBytes = 0;
let session: LlamaChatSession | null = null;
let loadError: string | null = null;

const MODEL_PATH = process.env.MODEL_PATH ?? "/app/models/qwen2.5-3b-instruct-q4_k_m.gguf";

export function classifierStatus() {
  return {
    state,
    model_path: MODEL_PATH,
    model_sha256: modelHash,
    model_size_bytes: modelSizeBytes,
    error: loadError,
  };
}

export async function initClassifier() {
  if (state !== "unloaded") return;
  state = "loading";
  try {
    // Hash model file for /verify endpoint. Reading 2.5GB into memory once
    // at boot is fine; the bytes get GC'd after hashing.
    console.log(`[classifier] hashing model at ${MODEL_PATH}...`);
    const bytes = readFileSync(MODEL_PATH);
    modelHash = createHash("sha256").update(bytes).digest("hex");
    modelSizeBytes = statSync(MODEL_PATH).size;
    console.log(`[classifier] model sha256=${modelHash}`);

    const llama = await getLlama();
    const model = await llama.loadModel({ modelPath: MODEL_PATH });
    const context = await model.createContext({ contextSize: 4096 });
    session = new LlamaChatSession({
      contextSequence: context.getSequence(),
      systemPrompt: SYSTEM_PROMPT,
    });
    state = "ready";
  } catch (err: any) {
    state = "error";
    loadError = err?.message ?? String(err);
    console.error("[classifier] load failed:", err);
  }
}

const SYSTEM_PROMPT = `You are Sealed's salary-disclosure validator. Your only job is to judge whether a submitted compensation disclosure is plausible, complete, and made in good faith for the given role/company/level/city.

Output strictly valid JSON with this exact shape — no prose, no markdown:
{"valid": true|false, "score": 0-100, "reason": "one short sentence"}

Rubric (v1.0):
1. base_salary must be a plausible number for the role/level/city. Reject obvious jokes (e.g. $1, $999999999), implausibly high (>$2M base for any role outside finance/exec), or implausibly low for the role/city (e.g. <$50k for SWE in SF).
2. Total comp (base + bonus_target + equity_grant_usd / vest_years) should also be plausible.
3. Required fields must be present and non-zero where applicable: base_salary, equity_grant_usd, vest_years, level.
4. notes field (free text) should describe the offer in plausible terms — not gibberish.
5. If any field is wildly inconsistent with the others (e.g. L3 SWE with $800k base), set valid:false.

Be generous on borderline cases — prefer accepting plausible but unusual offers over rejecting them. The point is to filter spam and obvious nonsense, not to gatekeep every disclosure.`;

export async function classifySubmission(submission: unknown): Promise<{
  valid: boolean;
  score: number;
  reason: string;
  raw: string;
}> {
  if (state !== "ready" || !session) {
    return {
      valid: false,
      score: 0,
      reason: `classifier not ready (state=${state})`,
      raw: "",
    };
  }
  const prompt = `Submission to evaluate:\n${JSON.stringify(submission, null, 2)}\n\nRespond with JSON only.`;

  const response = await session.prompt(prompt, {
    temperature: 0.1,
    maxTokens: 200,
  });

  // Extract JSON. Qwen at temp 0.1 is usually clean but we defend anyway.
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { valid: false, score: 0, reason: "classifier returned non-JSON", raw: response };
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      valid: !!parsed.valid,
      score: Number(parsed.score ?? 0),
      reason: String(parsed.reason ?? ""),
      raw: response,
    };
  } catch {
    return { valid: false, score: 0, reason: "classifier returned malformed JSON", raw: response };
  }
}
