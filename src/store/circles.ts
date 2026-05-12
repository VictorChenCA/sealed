import { randomUUID, createHash } from "node:crypto";

export type CircleScope = {
  company: string;
  role: string;
  level: string;
  city?: string;
};

export type Submission = {
  id: string;
  circle_id: string;
  submitter_handle: string; // self-chosen pseudonym
  payload: Record<string, unknown>;
  classifier: {
    valid: boolean;
    score: number;
    reason: string;
  };
  status: "valid" | "rejected";
  submitted_at: number;
};

export type CircleState = "open" | "sealed" | "revealed";

export type Circle = {
  id: string;
  scope: CircleScope;
  target_n: number;
  rubric_version: string;
  state: CircleState;
  created_at: number;
  revealed_at?: number;
  submissions: Submission[];
};

// In-memory vault — sealed-to-enclave by virtue of running in the TEE.
// No disk persistence: if the enclave restarts, circles reset. For an
// overnight demo this is correct; productionizing means writing an
// encrypted-at-rest layer keyed to the enclave's KMS-sealed key.
const circles = new Map<string, Circle>();

export function createCircle(scope: CircleScope, target_n: number, rubric_version: string): Circle {
  const id = shortId();
  const circle: Circle = {
    id,
    scope,
    target_n,
    rubric_version,
    state: "open",
    created_at: Date.now(),
    submissions: [],
  };
  circles.set(id, circle);
  return circle;
}

export function getCircle(id: string): Circle | undefined {
  return circles.get(id);
}

export function listCircles(): Circle[] {
  return [...circles.values()].sort((a, b) => b.created_at - a.created_at);
}

export function addSubmission(circle: Circle, sub: Omit<Submission, "id" | "circle_id" | "submitted_at">): Submission {
  if (circle.state !== "open") {
    throw new Error(`circle is ${circle.state}, not accepting submissions`);
  }
  const full: Submission = {
    ...sub,
    id: randomUUID(),
    circle_id: circle.id,
    submitted_at: Date.now(),
  };
  circle.submissions.push(full);

  const validCount = circle.submissions.filter((s) => s.status === "valid").length;
  if (validCount >= circle.target_n) {
    circle.state = "sealed";
  }
  return full;
}

export function markRevealed(circle: Circle) {
  circle.state = "revealed";
  circle.revealed_at = Date.now();
}

function shortId(): string {
  // 6-char URL-safe ID — enough for demo, easy to share.
  return createHash("sha256")
    .update(randomUUID())
    .digest("base64url")
    .slice(0, 6);
}
