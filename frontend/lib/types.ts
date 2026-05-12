// Types mirroring the backend at src/routes/circles.ts and src/routes/verify.ts.

export type CircleScope = {
  company: string;
  role: string;
  level: string;
  city?: string;
};

export type CircleState = "open" | "sealed" | "revealed";

export type SubmissionPayload = {
  submitter_handle?: string;
  base_salary: number;
  bonus_target_pct?: number;
  signing_bonus?: number;
  equity_grant_usd: number;
  vest_years: number;
  level: string;
  city: string;
  notes?: string;
};

export type ClassifierVerdict = {
  valid: boolean;
  score: number;
  reason: string;
};

export type Circle = {
  id: string;
  scope: CircleScope;
  target_n: number;
  rubric_version: string;
  state: CircleState;
  valid_count: number;
  created_at: number;
  submissions?: Array<{
    submitter_handle: string;
    classifier: ClassifierVerdict;
    payload: SubmissionPayload;
    submitted_at: number;
  }>;
};

export type SubmitResponse = {
  submission_id: string;
  status: "valid" | "rejected";
  classifier: ClassifierVerdict;
  circle: Circle;
};

export type Attestation = {
  enclave_pubkey: `0x${string}`;
  payload_sha256: string;
  signature: `0x${string}`;
};

export type RevealResponse = {
  circle_id: string;
  scope: CircleScope;
  rubric_version: string;
  target_n: number;
  revealed_at?: number;
  submissions: Array<{
    submitter_handle: string;
    classifier_score: number;
    classifier_reason: string;
    submitted_at: number;
    payload: SubmissionPayload;
  }>;
  aggregate: {
    n: number;
    base_salary: { min: number; median: number; max: number } | null;
    total_comp_annual: { min: number; median: number; max: number } | null;
  };
  attestation: Attestation;
};

export type VerifyResponse = {
  app: string;
  commit_sha: string;
  image_tag: string;
  rubric_version: string;
  classifier: {
    model_path: string;
    model_sha256: string | null;
    model_size_bytes: number;
    state: "unloaded" | "loading" | "ready" | "error";
  };
  enclave_pubkey: `0x${string}` | string;
  repo_url: string;
  notes?: string[];
};
