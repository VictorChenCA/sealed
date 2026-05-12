import { Router } from "express";
import { z } from "zod";
import { classifySubmission, classifierStatus } from "../classifier/qwen.js";
import {
  addSubmission,
  createCircle,
  getCircle,
  listCircles,
  markRevealed,
} from "../store/circles.js";
import { signReveal } from "../sign.js";

export const circlesRouter = Router();

// ---------- Create a circle ----------
const CreateBody = z.object({
  scope: z.object({
    company: z.string().min(1).max(80),
    role: z.string().min(1).max(80),
    level: z.string().min(1).max(40),
    city: z.string().max(80).optional(),
  }),
  target_n: z.number().int().min(2).max(20).default(5),
});

circlesRouter.post("/", (req, res) => {
  const parsed = CreateBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const rubricVersion = process.env.RUBRIC_VERSION_PUBLIC ?? "v1.0";
  const circle = createCircle(parsed.data.scope, parsed.data.target_n, rubricVersion);
  res.json(publicCircleView(circle, /*includePayloads*/ false));
});

// ---------- List circles ----------
circlesRouter.get("/", (_req, res) => {
  res.json(listCircles().map((c) => publicCircleView(c, false)));
});

// ---------- Get circle status ----------
circlesRouter.get("/:id", (req, res) => {
  const circle = getCircle(req.params.id);
  if (!circle) return res.status(404).json({ error: "not found" });
  res.json(publicCircleView(circle, /*includePayloads*/ circle.state === "revealed"));
});

// ---------- Submit ----------
const SubmissionBody = z.object({
  submitter_handle: z.string().min(1).max(40),
  base_salary: z.number().min(0),
  bonus_target_pct: z.number().min(0).max(200).optional(),
  signing_bonus: z.number().min(0).optional(),
  equity_grant_usd: z.number().min(0),
  vest_years: z.number().min(0.5).max(10),
  level: z.string().min(1).max(40),
  city: z.string().min(1).max(80),
  notes: z.string().max(400).optional(),
});

circlesRouter.post("/:id/submit", async (req, res) => {
  const circle = getCircle(req.params.id);
  if (!circle) return res.status(404).json({ error: "circle not found" });
  if (circle.state !== "open") {
    return res.status(409).json({ error: `circle is ${circle.state}` });
  }

  const status = classifierStatus();
  if (status.state !== "ready") {
    return res.status(503).json({ error: "classifier not ready", classifier: status });
  }

  const parsed = SubmissionBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const submissionForClassifier = {
    scope: circle.scope,
    ...parsed.data,
  };

  const verdict = await classifySubmission(submissionForClassifier);

  const stored = addSubmission(circle, {
    submitter_handle: parsed.data.submitter_handle,
    payload: parsed.data,
    classifier: {
      valid: verdict.valid,
      score: verdict.score,
      reason: verdict.reason,
    },
    status: verdict.valid ? "valid" : "rejected",
  });

  res.json({
    submission_id: stored.id,
    status: stored.status,
    classifier: stored.classifier,
    circle: publicCircleView(circle, false),
  });
});

// ---------- Reveal ----------
circlesRouter.get("/:id/reveal", async (req, res) => {
  const circle = getCircle(req.params.id);
  if (!circle) return res.status(404).json({ error: "not found" });
  if (circle.state === "open") {
    return res.status(409).json({
      error: "threshold not met",
      valid_count: circle.submissions.filter((s) => s.status === "valid").length,
      target_n: circle.target_n,
    });
  }
  if (circle.state === "sealed") {
    markRevealed(circle);
  }

  const valid = circle.submissions.filter((s) => s.status === "valid");
  const aggregate = computeAggregate(valid.map((s) => s.payload));
  const submissions = valid.map((s) => ({
    submitter_handle: s.submitter_handle,
    classifier_score: s.classifier.score,
    classifier_reason: s.classifier.reason,
    submitted_at: s.submitted_at,
    payload: s.payload,
  }));

  const body = {
    circle_id: circle.id,
    scope: circle.scope,
    rubric_version: circle.rubric_version,
    target_n: circle.target_n,
    revealed_at: circle.revealed_at,
    submissions,
    aggregate,
  };

  const signed = await signReveal(body);

  res.json({ ...body, attestation: signed });
});

// ---------- helpers ----------

function publicCircleView(circle: any, includePayloads: boolean) {
  const valid_count = circle.submissions.filter((s: any) => s.status === "valid").length;
  return {
    id: circle.id,
    scope: circle.scope,
    target_n: circle.target_n,
    rubric_version: circle.rubric_version,
    state: circle.state,
    valid_count,
    created_at: circle.created_at,
    submissions: includePayloads
      ? circle.submissions
          .filter((s: any) => s.status === "valid")
          .map((s: any) => ({
            submitter_handle: s.submitter_handle,
            classifier: s.classifier,
            payload: s.payload,
            submitted_at: s.submitted_at,
          }))
      : undefined,
  };
}

function computeAggregate(payloads: Array<Record<string, unknown>>) {
  const baseSalaries = payloads.map((p) => Number(p.base_salary)).filter((n) => !isNaN(n));
  const totalComps = payloads
    .map((p) => {
      const base = Number(p.base_salary) || 0;
      const bonus = base * ((Number(p.bonus_target_pct) || 0) / 100);
      const equity = (Number(p.equity_grant_usd) || 0) / (Number(p.vest_years) || 4);
      return base + bonus + equity;
    })
    .filter((n) => !isNaN(n));

  return {
    n: payloads.length,
    base_salary: stats(baseSalaries),
    total_comp_annual: stats(totalComps),
  };
}

function stats(arr: number[]) {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return { min, median, max };
}
