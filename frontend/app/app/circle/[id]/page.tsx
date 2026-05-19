"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { usePrivy } from "@privy-io/react-auth";
import { api } from "@/lib/api";
import type { Circle, RevealResponse, SubmissionPayload, SubmitResponse } from "@/lib/types";
import { fmtUSD, Hash, Pill, StateBadge } from "@/components/atoms";
import { SiteHeader } from "@/components/site-header";

/* Derive a stable, anonymous-feeling handle from whatever Privy gives us.
   The handle is what shows up in the reveal — we want it to feel like a
   pseudonym (no real email leaked), so we hash the identifier into a
   small word-pair pool. */
const HANDLE_ANIMALS = ["owl","fox","raven","stag","heron","ibex","lynx","otter","wren","hare","tern","shrike","mink","crane","newt","ferret"];
const HANDLE_COLORS = ["amber","cobalt","violet","crimson","sage","onyx","azure","copper","ash","slate","ivory","ochre","rust","fern","mauve","clay"];
function handleFromIdentity(identity: string | null | undefined): string {
  if (!identity) return "";
  let h = 0;
  for (let i = 0; i < identity.length; i++) h = ((h << 5) - h + identity.charCodeAt(i)) | 0;
  const a = HANDLE_ANIMALS[Math.abs(h) % HANDLE_ANIMALS.length];
  const c = HANDLE_COLORS[Math.abs(h >> 8) % HANDLE_COLORS.length];
  const n = Math.abs(h >> 16) % 90 + 10;
  return `${c}_${a}_${n}`;
}

export default function CirclePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: circle, mutate } = useSWR<Circle>(
    id ? `circle:${id}` : null,
    () => api.getCircle(id!),
    { refreshInterval: 4000 },
  );

  if (!circle) {
    return (
      <>
        <SiteHeader />
        <div className="app-shell">
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            Loading circle…
          </div>
        </div>
      </>
    );
  }

  const subState =
    circle.state === "revealed" || circle.state === "sealed"
      ? "reveal"
      : circle.valid_count === 0
      ? "submit"
      : "waiting";

  return (
    <>
      <SiteHeader />
      <div className="app-shell">
        <div className="crumb">
          <Link href="/app" style={{ color: "inherit", textDecoration: "none" }}>
            Dashboard
          </Link>
          <span style={{ margin: "0 8px", color: "var(--dim)" }}>/</span>
          <span>
            {circle.scope.company} · {circle.scope.role} · {circle.scope.level}
          </span>
        </div>

        <div className="circle-hdr">
          <div>
            <div className="scope-line">CIRCLE / {circle.id}</div>
            <h1>
              {circle.scope.company} · {circle.scope.role} · {circle.scope.level}
            </h1>
            <div className="meta-row">
              <StateBadge state={circle.state} />
              <Pill>target N = {circle.target_n}</Pill>
              <Pill>
                rubric{" "}
                <span className="accent" style={{ marginLeft: 4 }}>
                  {circle.rubric_version ?? "v1.0"}
                </span>
              </Pill>
              <Pill dot tone="ok">
                classifier ready
              </Pill>
            </div>
          </div>
          <div className="flex gap-8 items-center">
            <button
              className="btn ghost sm"
              onClick={() => router.push(`/verify/${circle.id}`)}
            >
              Verify deployment
            </button>
          </div>
        </div>

        <Stepper sub={subState} />

        {subState === "submit" && <SubmitForm circle={circle} onSubmitted={() => mutate()} />}
        {subState === "waiting" && <WaitingState circle={circle} />}
        {subState === "reveal" && <RevealView circleId={circle.id} />}
      </div>
    </>
  );
}

function Stepper({ sub }: { sub: "submit" | "waiting" | "reveal" }) {
  return (
    <div className="stepper">
      <div className={"step " + (sub === "submit" ? "current" : "done")}>
        <span className="pip">{sub === "submit" ? "1" : "✓"}</span> Submit
      </div>
      <div className="bar" />
      <div className={"step " + (sub === "waiting" ? "current" : sub === "reveal" ? "done" : "")}>
        <span className="pip">{sub === "reveal" ? "✓" : "2"}</span> Wait
      </div>
      <div className="bar" />
      <div className={"step " + (sub === "reveal" ? "current" : "")}>
        <span className="pip">3</span> Reveal
      </div>
    </div>
  );
}

function SubmitForm({ circle, onSubmitted }: { circle: Circle; onSubmitted: () => void }) {
  const { user, authenticated } = usePrivy();
  // Pick a stable identity string from whichever Privy method was used.
  const identity =
    user?.email?.address ??
    user?.google?.email ??
    user?.apple?.email ??
    user?.github?.username ??
    user?.discord?.username ??
    user?.farcaster?.username ??
    user?.wallet?.address ??
    user?.id ??
    null;
  const derivedHandle = useMemo(() => handleFromIdentity(identity), [identity]);
  const [handle, setHandle] = useState(derivedHandle || "anon_jpeg_42");
  // Re-derive when user changes (sign-out + sign-in as different account)
  useEffect(() => {
    if (derivedHandle) setHandle(derivedHandle);
  }, [derivedHandle]);

  const [level, setLevel] = useState(circle.scope.level);
  const [city, setCity] = useState(circle.scope.city ?? "San Francisco");
  const [base, setBase] = useState(204000);
  const [bonus, setBonus] = useState(15);
  const [signing, setSigning] = useState(50000);
  const [equity, setEquity] = useState(612000);
  const [vest, setVest] = useState(4);
  const [notes, setNotes] = useState("New grad offer, standard 4-yr vest.");

  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [verdict, setVerdict] = useState<SubmitResponse | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const STAGES = [
    "Sealing payload",
    "Submitting to enclave",
    "Decrypting inside TDX",
    "Running Qwen 2.5 3B",
    "Recording verdict",
  ];
  const stageText = pending ? STAGES[Math.min(Math.floor(progress * STAGES.length), STAGES.length - 1)] : null;

  async function submit() {
    setVerdict(null);
    setPending(true);
    setProgress(0);

    let i = 0;
    timer.current = setInterval(() => {
      i++;
      setProgress((prev) => Math.min(prev + 1 / STAGES.length, 0.95));
      if (i >= STAGES.length) {
        if (timer.current) clearInterval(timer.current);
      }
    }, 700);

    try {
      const payload: SubmissionPayload & { submitter_handle: string } = {
        submitter_handle: handle || `anon-${Math.floor(Math.random() * 9999)}`,
        base_salary: base,
        bonus_target_pct: bonus,
        signing_bonus: signing,
        equity_grant_usd: equity,
        vest_years: vest,
        level,
        city,
        notes,
      };
      const res = await api.submit(circle.id, payload);
      if (timer.current) clearInterval(timer.current);
      setProgress(1);
      setTimeout(() => {
        setPending(false);
        setVerdict(res);
        if (res.status === "valid") onSubmitted();
      }, 200);
    } catch (err) {
      if (timer.current) clearInterval(timer.current);
      setPending(false);
      alert("Submit failed: " + (err instanceof Error ? err.message : err));
    }
  }

  function simulateReject() {
    setBase(50000);
    setTimeout(() => submit(), 50);
  }

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  return (
    <div className="card">
      <div className="card-hdr">
        <div className="flex items-center gap-8">
          <h3>Submit your disclosure</h3>
          <Pill>encrypted client-side to enclave</Pill>
        </div>
        <Pill tone="ok" dot>
          classifier ready
        </Pill>
      </div>
      <div className="card-body">
        <div className="form-grid">
          <div className="field">
            <label>
              Pseudonym{" "}
              <span style={{ color: "var(--dim)" }}>
                {authenticated ? "· derived from your sign-in, editable" : "· shown in reveal"}
              </span>
            </label>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} />
          </div>
          <div className="field">
            <label>Level</label>
            <input value={level} onChange={(e) => setLevel(e.target.value)} />
          </div>
          <div className="field">
            <label>City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="field">
            <label>Vest years</label>
            <input
              type="number"
              step={0.5}
              value={vest}
              onChange={(e) => setVest(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Base salary</label>
            <div className="input-prefix">
              <span>$</span>
              <input type="number" value={base} onChange={(e) => setBase(Number(e.target.value))} />
            </div>
          </div>
          <div className="field">
            <label>Bonus target</label>
            <div className="input-prefix">
              <span>%</span>
              <input type="number" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} />
            </div>
          </div>
          <div className="field">
            <label>Signing bonus</label>
            <div className="input-prefix">
              <span>$</span>
              <input
                type="number"
                value={signing}
                onChange={(e) => setSigning(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="field">
            <label>
              Equity grant <span style={{ color: "var(--dim)" }}>· total</span>
            </label>
            <div className="input-prefix">
              <span>$</span>
              <input
                type="number"
                value={equity}
                onChange={(e) => setEquity(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="field full">
            <label>
              Notes <span style={{ color: "var(--dim)" }}>· optional, classifier-readable</span>
            </label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {pending && (
          <div
            className="mt-24"
            style={{
              padding: "16px 18px",
              border: "1px solid var(--border)",
              background: "var(--surface-0)",
              borderRadius: 10,
            }}
          >
            <div className="flex items-center gap-12">
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid var(--surface-3)",
                  borderTopColor: "var(--accent)",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--text)" }}>{stageText}…</div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--dim)",
                    marginTop: 4,
                  }}
                >
                  3–8s typical · classifier runs locally inside TDX
                </div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                {Math.round(progress * 100)}%
              </div>
            </div>
            <div className="progress-bar" style={{ marginTop: 12, height: 3 }}>
              <div
                className="fill"
                style={{ width: progress * 100 + "%", transition: "width 0.4s ease" }}
              />
            </div>
          </div>
        )}

        {verdict && (
          <div className={"verdict " + (verdict.status === "valid" ? "ok" : "bad")}>
            <div className="icon">{verdict.status === "valid" ? "✓" : "✕"}</div>
            <div>
              <div className="title">
                {verdict.status === "valid"
                  ? "Accepted & sealed"
                  : "Rejected — submission did not pass the rubric"}
              </div>
              <div className="reason">{verdict.classifier.reason}</div>
              <div className="score">
                <span>classifier score</span>
                <span className="hash">{verdict.classifier.score}</span>
                <span style={{ color: "var(--dim)" }}>·</span>
                <span>rubric v1.0</span>
                <span style={{ color: "var(--dim)" }}>·</span>
                <span>signed inside enclave</span>
              </div>
              {verdict.status === "rejected" && (
                <button className="btn ghost sm mt-12" onClick={() => setVerdict(null)}>
                  Revise & resubmit
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="card-foot">
        <div className="copy-dim" style={{ fontSize: 12 }}>
          Once accepted, your numbers are unreadable — even to the operator — until {circle.target_n}{" "}
          valid submissions accumulate.
        </div>
        <div className="flex gap-8">
          <button className="btn ghost sm" onClick={simulateReject} disabled={pending}>
            Simulate reject
          </button>
          <button className="btn accent" onClick={submit} disabled={pending}>
            {pending ? "Classifying…" : "Seal & submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WaitingState({ circle }: { circle: Circle }) {
  return (
    <div className="waiting">
      <div className="lockup">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11 V8 a4 4 0 0 1 8 0 v3" />
          <circle cx="12" cy="16" r="1.2" fill="currentColor" />
        </svg>
      </div>
      <div className="label">Sealed in enclave</div>
      <div className="count-big">
        {circle.valid_count}
        <span className="of"> / {circle.target_n}</span>
      </div>
      <div className="slots">
        {Array.from({ length: circle.target_n }).map((_, i) => (
          <div key={i} className={"slot" + (i < circle.valid_count ? " filled" : "")} />
        ))}
      </div>
      <p className="copy">
        Your disclosure is locked. {circle.target_n - circle.valid_count} more validated{" "}
        {circle.target_n - circle.valid_count === 1 ? "submission" : "submissions"} to go. Neither
        the operator nor anyone in this circle — including you — can read any value until the
        threshold breaks.
      </p>
      <div className="flex gap-8 mt-24">
        <button
          className="btn ghost sm"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
          }}
        >
          Copy invite link
        </button>
      </div>
    </div>
  );
}

function RevealView({ circleId }: { circleId: string }) {
  const { data, error, isLoading } = useSWR<RevealResponse>(`reveal:${circleId}`, () => api.reveal(circleId));
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 350);
    return () => clearTimeout(t);
  }, [data]);

  const totalCompMedian = useMemo(() => data?.aggregate.total_comp_annual?.median, [data]);

  if (isLoading) return <div className="card" style={{ padding: 40, color: "var(--muted)" }}>Loading reveal…</div>;
  if (error || !data) return <div className="card" style={{ padding: 40, color: "var(--bad)" }}>Could not load reveal.</div>;

  const avgScore = data.submissions.length
    ? data.submissions.reduce((acc, s) => acc + (s.classifier_score || 0), 0) / data.submissions.length
    : 0;

  return (
    <div>
      <div className="reveal-banner">
        <div>
          <div className="title">Threshold met. Reveal signed.</div>
          <div className="sub">
            {data.aggregate.n} of {data.target_n} valid · attested by enclave
            {data.revealed_at ? " · " + new Date(data.revealed_at).toUTCString().replace("GMT", "UTC") : ""}
          </div>
        </div>
        <div className="flex gap-8 items-center">
          <Hash value={data.attestation.signature} short={10} label="sig" link />
          <button
            className="btn accent"
            onClick={() => router.push(`/verify/${circleId}`)}
          >
            See proof →
          </button>
        </div>
      </div>

      <div className="reveal-stats">
        <div className="stat-cell">
          <div className="lbl">Median base</div>
          <div className="val">{fmtUSD(data.aggregate.base_salary?.median)}</div>
          <div className="delta">
            range {fmtUSD(data.aggregate.base_salary?.min, { short: true })} –{" "}
            {fmtUSD(data.aggregate.base_salary?.max, { short: true })}
          </div>
        </div>
        <div className="stat-cell">
          <div className="lbl">Median total comp / yr</div>
          <div className="val">{fmtUSD(totalCompMedian)}</div>
          <div className="delta">
            range {fmtUSD(data.aggregate.total_comp_annual?.min, { short: true })} –{" "}
            {fmtUSD(data.aggregate.total_comp_annual?.max, { short: true })}
          </div>
        </div>
        <div className="stat-cell">
          <div className="lbl">Valid disclosures</div>
          <div className="val">{data.aggregate.n}</div>
          <div className="delta">avg classifier score {avgScore.toFixed(2)}</div>
        </div>
        <div className="stat-cell">
          <div className="lbl">Rubric</div>
          <div className="val">{data.rubric_version}</div>
          <div className="delta">pinned in repo</div>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <h3>Submissions · side-by-side</h3>
          <div className="copy-dim mono" style={{ fontSize: 11 }}>
            {data.submissions.length} rows · signed by {data.attestation.enclave_pubkey.slice(0, 6)}…
            {data.attestation.enclave_pubkey.slice(-4)}
          </div>
        </div>
        <table className="reveal">
          <thead>
            <tr>
              <th>Handle</th>
              <th>Base</th>
              <th>Bonus</th>
              <th>Signing</th>
              <th>Equity / vest</th>
              <th>City</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {data.submissions.map((s, i) => (
              <tr
                key={i}
                style={{
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? "translateY(0)" : "translateY(8px)",
                  filter: revealed ? "blur(0)" : "blur(8px)",
                  transition: `opacity 0.6s ease ${i * 0.12}s, transform 0.6s ease ${i * 0.12}s, filter 0.6s ease ${i * 0.12}s`,
                }}
              >
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        background: [
                          "oklch(0.72 0.12 30)",
                          "oklch(0.74 0.12 160)",
                          "oklch(0.72 0.12 270)",
                          "oklch(0.74 0.12 70)",
                          "oklch(0.72 0.12 200)",
                        ][i % 5],
                        opacity: 0.5,
                      }}
                    />
                    <span className="mono">{s.submitter_handle}</span>
                  </div>
                </td>
                <td className="num">{fmtUSD(s.payload.base_salary)}</td>
                <td className="num">{s.payload.bonus_target_pct ?? 0}%</td>
                <td className="num">{fmtUSD(s.payload.signing_bonus ?? 0)}</td>
                <td className="num">
                  {fmtUSD(s.payload.equity_grant_usd, { short: true })} / {s.payload.vest_years}y
                </td>
                <td style={{ color: "var(--muted)" }}>{s.payload.city}</td>
                <td className="num">
                  <Pill tone="ok">{Number(s.classifier_score).toFixed(2)}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="card-foot">
          <div className="flex items-center gap-12">
            <Hash value={data.attestation.payload_sha256} short={14} label="payload sha256" />
          </div>
          <button
            className="btn ghost sm"
            onClick={() => router.push(`/verify/${circleId}`)}
          >
            Inspect attestation →
          </button>
        </div>
      </div>
    </div>
  );
}
