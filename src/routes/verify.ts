import { Router } from "express";
import { classifierStatus } from "../classifier/qwen.js";
import { enclavePublicAddress } from "../sign.js";

export const verifyRouter = Router();

// Public attestation surface. This is the "see proof" payload the UI fetches.
verifyRouter.get("/", (_req, res) => {
  let pubkey: string | null = null;
  try {
    pubkey = enclavePublicAddress();
  } catch (err: any) {
    pubkey = `error: ${err.message}`;
  }

  const classifier = classifierStatus();

  res.json({
    app: "sealed",
    commit_sha: process.env.COMMIT_SHA_PUBLIC ?? "dev",
    image_tag: process.env.IMAGE_TAG_PUBLIC ?? "dev",
    rubric_version: process.env.RUBRIC_VERSION_PUBLIC ?? "v1.0",
    classifier: {
      model_path: classifier.model_path,
      model_sha256: classifier.model_sha256,
      model_size_bytes: classifier.model_size_bytes,
      state: classifier.state,
    },
    enclave_pubkey: pubkey,
    repo_url: "https://github.com/VictorChenCA/sealed",
    notes: [
      "This endpoint exposes the publicly-verifiable identity of this Sealed deployment.",
      "To verify: clone the repo at commit_sha, reproduce the build, confirm image digest matches the running deployment, and verify the model file's sha256 matches.",
      "EigenCompute attestation quote should be requested out-of-band from the platform.",
    ],
  });
});
