import type { Circle, RevealResponse, SubmissionPayload, SubmitResponse, VerifyResponse, CircleScope } from "./types";

// In dev, next.config.ts rewrites /api/* and /verify to NEXT_PUBLIC_API_BASE_URL.
// In production on Vercel, the rewrite chain still resolves correctly so frontend
// code can use relative paths everywhere.
const ORIGIN = ""; // empty = same-origin via rewrites

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${ORIGIN}${path}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`GET ${path}: ${r.status} ${await r.text().catch(() => "")}`);
  return r.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${ORIGIN}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`POST ${path}: ${r.status} ${await r.text().catch(() => "")}`);
  return r.json();
}

export const api = {
  health: () => get<{ status: string; classifier: { state: string }; uptime_sec: number }>("/healthz"),
  verify: () => get<VerifyResponse>("/verify"),

  listCircles: () => get<Circle[]>("/api/circles"),
  getCircle: (id: string) => get<Circle>(`/api/circles/${id}`),
  createCircle: (scope: CircleScope, target_n = 5) =>
    post<Circle>("/api/circles", { scope, target_n }),

  submit: (id: string, body: SubmissionPayload & { submitter_handle: string }) =>
    post<SubmitResponse>(`/api/circles/${id}/submit`, body),

  reveal: (id: string) => get<RevealResponse>(`/api/circles/${id}/reveal`),
};
