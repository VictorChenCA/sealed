import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initClassifier, classifierStatus } from "./classifier/qwen.js";
import { circlesRouter } from "./routes/circles.js";
import { verifyRouter } from "./routes/verify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.APP_PORT ?? 3000);

const app = express();
app.use(express.json({ limit: "1mb" }));

// Static web UI
app.use(express.static(path.resolve(__dirname, "../web")));

// Health check — returns 200 even before model loads so EigenCompute
// doesn't kill us during cold start. Model-ready flag exposed separately.
app.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    classifier: classifierStatus(),
    uptime_sec: Math.round(process.uptime()),
  });
});

app.use("/api/circles", circlesRouter);
app.use("/verify", verifyRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[sealed] HTTP listening on :${PORT}`);
  console.log(`[sealed] commit=${process.env.COMMIT_SHA_PUBLIC ?? "dev"}`);
  console.log(`[sealed] starting classifier load in background...`);
  // Kick off model load. HTTP is serving in the meantime.
  initClassifier().then(
    () => {
      const s = classifierStatus();
      if (s.state === "ready") console.log(`[sealed] classifier ready (sha256=${s.model_sha256?.slice(0, 16)}…)`);
      else console.error(`[sealed] classifier failed to ready: state=${s.state} err=${s.error}`);
    },
    (err) => console.error("[sealed] classifier load failed:", err),
  );
});
