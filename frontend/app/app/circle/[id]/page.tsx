"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { Circle, RevealResponse, SubmissionPayload, SubmitResponse } from "@/lib/types";
import { fmtUSD, shorten } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";

export default function CirclePage() {
  const { id } = useParams<{ id: string }>();
  const { data: circle, mutate } = useSWR<Circle>(id ? `circle:${id}` : null, () => api.getCircle(id!), { refreshInterval: 4000 });

  return (
    <>
      <SiteHeader />
      <main className="container py-12 max-w-3xl">
        <div className="mb-8">
          <Link href="/app" className="text-dim text-sm hover:text-text">← All circles</Link>
        </div>
        {!circle ? (
          <div className="rounded-lg border border-border bg-panel h-40 animate-pulse" />
        ) : (
          <>
            <CircleHeader c={circle} />
            {circle.state === "open" ? (
              <SubmitForm circle={circle} onSubmitted={() => mutate()} />
            ) : (
              <RevealView circleId={circle.id} />
            )}
          </>
        )}
      </main>
    </>
  );
}

function CircleHeader({ c }: { c: Circle }) {
  const pct = Math.round((c.valid_count / c.target_n) * 100);
  return (
    <div className="mb-10">
      <p className="text-xs uppercase tracking-[0.18em] text-dim mb-2 mono">Circle {c.id}</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        {c.scope.company} · {c.scope.role} · {c.scope.level}
      </h1>
      <div className="mt-2 text-dim">{c.scope.city}</div>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
          <div className="h-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <span className="mono text-sm text-dim">{c.valid_count}/{c.target_n}</span>
      </div>
    </div>
  );
}

function SubmitForm({ circle, onSubmitted }: { circle: Circle; onSubmitted: () => void }) {
  const [handle, setHandle] = useState("");
  const [base, setBase] = useState(200000);
  const [bonus, setBonus] = useState(15);
  const [signing, setSigning] = useState(50000);
  const [equity, setEquity] = useState(500000);
  const [vest, setVest] = useState(4);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<SubmitResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setVerdict(null);
    try {
      const payload: SubmissionPayload & { submitter_handle: string } = {
        submitter_handle: handle || `anon-${Math.floor(Math.random() * 9999)}`,
        base_salary: base,
        bonus_target_pct: bonus,
        signing_bonus: signing,
        equity_grant_usd: equity,
        vest_years: vest,
        level: circle.scope.level,
        city: circle.scope.city ?? "",
        notes,
      };
      const res = await api.submit(circle.id, payload);
      setVerdict(res);
      onSubmitted();
    } catch (err) {
      alert("Submit failed: " + (err instanceof Error ? err.message : err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-border bg-panel p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Pseudonym in this circle">
          <input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="dragon_jpeg" />
        </Field>
        <Field label="Base salary (USD)">
          <input className="input mono" type="number" value={base} onChange={(e) => setBase(Number(e.target.value))} required />
        </Field>
        <Field label="Bonus target %">
          <input className="input mono" type="number" value={bonus} onChange={(e) => setBonus(Number(e.target.value))} />
        </Field>
        <Field label="Signing bonus (USD)">
          <input className="input mono" type="number" value={signing} onChange={(e) => setSigning(Number(e.target.value))} />
        </Field>
        <Field label="Equity grant total (USD)">
          <input className="input mono" type="number" value={equity} onChange={(e) => setEquity(Number(e.target.value))} required />
        </Field>
        <Field label="Vest years">
          <input className="input mono" type="number" step="0.5" value={vest} onChange={(e) => setVest(Number(e.target.value))} required />
        </Field>
      </div>
      <Field label="Notes (optional, stays inside the enclave)">
        <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent text-accent-fg px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Validating in enclave (~5s)…" : "Submit (sealed)"}
        </button>
        <span className="text-xs text-dim">
          Qwen 2.5 3B running inside the TDX enclave will judge plausibility.
        </span>
      </div>

      {verdict && <VerdictBox v={verdict} />}
    </form>
  );
}

function VerdictBox({ v }: { v: SubmitResponse }) {
  const ok = v.status === "valid";
  return (
    <div
      className={`rounded-md border p-4 text-sm animate-fade-up ${
        ok ? "border-good/40 bg-good/10" : "border-bad/40 bg-bad/10"
      }`}
    >
      <div className="flex items-center gap-2 font-medium mb-1">
        <span className={ok ? "text-good" : "text-bad"}>{ok ? "✓ Accepted" : "✗ Rejected"}</span>
        <span className="text-dim mono text-xs">score {v.classifier.score}</span>
      </div>
      <div className="text-dim">{v.classifier.reason}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-dim mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function RevealView({ circleId }: { circleId: string }) {
  const { data, error, isLoading } = useSWR<RevealResponse>(`reveal:${circleId}`, () => api.reveal(circleId));
  if (isLoading) return <div className="rounded-lg border border-border bg-panel h-40 animate-pulse" />;
  if (error) return <div className="text-bad text-sm">Failed to reveal: {String(error)}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-panel overflow-hidden animate-fade-up">
        <div className="grid grid-cols-5 text-[11px] uppercase tracking-wider text-dim px-5 py-3 border-b border-border">
          <span>Handle</span><span>Base</span><span>Equity</span><span>Bonus %</span><span>Score</span>
        </div>
        {data.submissions.map((s, i) => (
          <div
            key={i}
            className="grid grid-cols-5 px-5 py-4 border-b border-border last:border-0 animate-fade-up text-sm"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="mono">{s.submitter_handle}</span>
            <span className="mono">{fmtUSD(s.payload.base_salary)}</span>
            <span className="mono">{fmtUSD(s.payload.equity_grant_usd)}/{s.payload.vest_years}y</span>
            <span className="mono">{s.payload.bonus_target_pct ?? 0}%</span>
            <span className="mono text-good">{s.classifier_score}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-panel p-6 animate-fade-up" style={{ animationDelay: "400ms" }}>
        <p className="text-xs uppercase tracking-[0.18em] text-dim mb-2 mono">Aggregate</p>
        <div className="grid grid-cols-2 gap-6">
          <Stat label="Median base" value={fmtUSD(data.aggregate.base_salary?.median)} />
          <Stat label="Median total comp / yr" value={fmtUSD(data.aggregate.total_comp_annual?.median)} />
        </div>
      </div>

      <div className="rounded-lg border border-accent/30 bg-accent/5 p-6 flex items-center justify-between animate-fade-up" style={{ animationDelay: "600ms" }}>
        <div>
          <div className="font-medium mb-1">Verify this reveal</div>
          <div className="text-dim text-sm">Three checks. None require trusting us.</div>
        </div>
        <Link
          href={`/verify/${circleId}`}
          className="rounded-md bg-accent text-accent-fg px-5 py-2 text-sm font-medium hover:opacity-90"
        >
          See proof →
        </Link>
      </div>

      <details className="rounded-lg border border-border bg-panel p-4 text-xs">
        <summary className="cursor-pointer text-dim">raw attestation</summary>
        <pre className="mono mt-4 overflow-x-auto text-dim">
{JSON.stringify(data.attestation, null, 2)}
        </pre>
        <div className="mt-3 text-[11px] text-dim">
          pubkey {shorten(data.attestation.enclave_pubkey, 10, 6)} · sig {shorten(data.attestation.signature, 10, 6)}
        </div>
      </details>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-dim mb-1">{label}</div>
      <div className="text-2xl mono">{value}</div>
    </div>
  );
}
