"use client";

import Link from "next/link";
import useSWR from "swr";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Circle } from "@/lib/types";
import { SiteHeader } from "@/components/site-header";

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="container py-12 max-w-5xl">
        <Header />
        <CircleList />
      </main>
    </>
  );
}

function Header() {
  return (
    <div className="flex items-end justify-between mb-10">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-dim mb-2 mono">App</p>
        <h1 className="text-3xl font-semibold tracking-tight">Circles</h1>
      </div>
      <CreateCircleButton />
    </div>
  );
}

function CreateCircleButton() {
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("SWE");
  const [level, setLevel] = useState("L4");
  const [city, setCity] = useState("San Francisco");
  const [target, setTarget] = useState(3);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const c = await api.createCircle({ company, role, level, city }, target);
      window.location.href = `/app/circle/${c.id}`;
    } catch (err) {
      alert("Failed: " + (err instanceof Error ? err.message : err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent text-accent-fg px-4 py-2 text-sm font-medium hover:opacity-90 transition"
      >
        New circle
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-panel p-4 w-[420px] space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company"><input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Google" required /></Field>
        <Field label="Role"><input className="input" value={role} onChange={(e) => setRole(e.target.value)} required /></Field>
        <Field label="Level"><input className="input" value={level} onChange={(e) => setLevel(e.target.value)} required /></Field>
        <Field label="City"><input className="input" value={city} onChange={(e) => setCity(e.target.value)} /></Field>
        <Field label="Threshold (N)"><input className="input" type="number" min={2} max={20} value={target} onChange={(e) => setTarget(Number(e.target.value))} /></Field>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={busy} className="rounded-md bg-accent text-accent-fg px-4 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50">
          {busy ? "Creating…" : "Create circle"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-dim hover:text-text">Cancel</button>
      </div>
    </form>
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

function CircleList() {
  const { data, error, isLoading } = useSWR<Circle[]>("circles", api.listCircles, { refreshInterval: 5000 });

  if (isLoading) return <Skeleton />;
  if (error) return <div className="text-bad text-sm">Failed to load: {String(error)}</div>;
  if (!data || data.length === 0) return <EmptyState />;

  return (
    <div className="space-y-2">
      {data.map((c) => (
        <CircleRow key={c.id} c={c} />
      ))}
    </div>
  );
}

function CircleRow({ c }: { c: Circle }) {
  const pct = Math.round((c.valid_count / c.target_n) * 100);
  return (
    <Link
      href={`/app/circle/${c.id}`}
      className="block rounded-lg border border-border bg-panel hover:bg-panel-2 transition p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="mono text-dim text-xs">{c.id}</span>
          <span className="font-medium">{c.scope.company}</span>
          <span className="text-dim text-sm">{c.scope.role} · {c.scope.level}{c.scope.city ? ` · ${c.scope.city}` : ""}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-dim mono">{c.valid_count}/{c.target_n}</span>
          <StatePill state={c.state} />
        </div>
      </div>
      <div className="mt-3 h-1 rounded-full bg-border overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </Link>
  );
}

function StatePill({ state }: { state: Circle["state"] }) {
  const color =
    state === "revealed" ? "text-good border-good/40 bg-good/10" :
    state === "sealed" ? "text-warn border-warn/40 bg-warn/10" :
    "text-dim border-border bg-panel-2";
  return <span className={`mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${color}`}>{state}</span>;
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border p-12 text-center">
      <p className="text-dim text-sm">No circles yet. Create one to begin.</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-panel h-20 animate-pulse" />
      ))}
    </div>
  );
}
