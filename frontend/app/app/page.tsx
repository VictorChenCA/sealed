"use client";

import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import type { Circle } from "@/lib/types";
import { SiteHeader } from "@/components/site-header";
import { Pill, StateBadge } from "@/components/atoms";

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR<Circle[]>("circles", () => api.listCircles(), {
    refreshInterval: 5000,
  });
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("all");

  const yourCircles = (data ?? []).filter((c) => c.state !== "open" || c.valid_count > 0);
  const browseCircles = data ?? [];
  const filtered = browseCircles.filter(
    (c) => filter === "all" || c.scope.role.toLowerCase().includes(filter),
  );

  return (
    <>
      <SiteHeader />
      <div className="app-shell">
        {showCreate && <CreateCircleSheet onClose={() => setShowCreate(false)} />}

        <div className="page-head">
          <div>
            <div className="crumb">Dashboard</div>
            <h1>Your circles</h1>
          </div>
          <div className="flex gap-8">
            <Link href="/verify/dashboard" className="btn ghost" style={{ textDecoration: "none" }}>
              How Sealed works
            </Link>
            <button className="btn accent" onClick={() => setShowCreate(true)}>
              + New circle
            </button>
          </div>
        </div>

        {isLoading && <Skeleton />}
        {error && (
          <div className="card" style={{ padding: 16, color: "var(--bad)" }}>
            Could not reach the enclave at <span className="mono">{process.env.NEXT_PUBLIC_API_BASE_URL ?? "(no API URL set)"}</span>.
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="circles-list">
              {yourCircles.length === 0 && (
                <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
                  No circles yet. Create one to begin.
                </div>
              )}
              {yourCircles.map((c) => (
                <CircleCard key={c.id} c={c} />
              ))}
            </div>

            <div className="section-title">
              <h3>Browse circles</h3>
              <div className="meta">{browseCircles.length} public circles</div>
            </div>

            <div className="filter-bar">
              <input placeholder="Search company, role, level…" />
              {(["all", "swe", "ml", "design", "data"] as const).map((f) => (
                <button
                  key={f}
                  className={"chip-filter" + (filter === f ? " on" : "")}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All roles" : f.toUpperCase()}
                </button>
              ))}
            </div>

            <table className="browse">
              <thead>
                <tr>
                  <th>Scope</th>
                  <th>City</th>
                  <th>Progress</th>
                  <th>State</th>
                  <th style={{ textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <BrowseRow key={c.id} c={c} />
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}

function CircleCard({ c }: { c: Circle }) {
  const pct = Math.round((c.valid_count / c.target_n) * 100);
  return (
    <Link href={`/app/circle/${c.id}`} className="circle-card">
      <div>
        <div className="scope">
          {c.scope.company} · {c.scope.role} · {c.scope.level}
          <span className="id mono">/{c.id}</span>
        </div>
        <div className="sub">
          {c.state === "revealed"
            ? `revealed · ${c.valid_count} disclosures`
            : c.state === "sealed"
            ? `sealed · awaiting your read`
            : `${c.target_n - c.valid_count} more to reveal`}
        </div>
      </div>
      <div className="progress">
        <span>
          {c.valid_count}/{c.target_n}
        </span>
        <div className="progress-bar">
          <div className="fill" style={{ width: pct + "%" }} />
        </div>
      </div>
      <div className="flex gap-8 items-center">
        <StateBadge state={c.state} />
        <span style={{ color: "var(--dim)" }}>›</span>
      </div>
    </Link>
  );
}

function BrowseRow({ c }: { c: Circle }) {
  const router = useRouter();
  return (
    <tr onClick={() => router.push(`/app/circle/${c.id}`)}>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>
            {c.scope.company} · {c.scope.role} · {c.scope.level}
          </span>
          <span className="id mono" style={{ color: "var(--dim)" }}>
            /{c.id}
          </span>
        </div>
      </td>
      <td className="num" style={{ color: "var(--muted)" }}>
        {c.scope.city ?? "—"}
      </td>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 200 }}>
          <span className="mono" style={{ fontSize: 12 }}>
            {c.valid_count}/{c.target_n}
          </span>
          <div className="progress-bar" style={{ flex: 1 }}>
            <div className="fill" style={{ width: (c.valid_count / c.target_n) * 100 + "%" }} />
          </div>
        </div>
      </td>
      <td>
        <StateBadge state={c.state} />
      </td>
      <td style={{ textAlign: "right", color: "var(--dim)" }}>›</td>
    </tr>
  );
}

function CreateCircleSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [company, setCompany] = useState("Google");
  const [role, setRole] = useState("SWE");
  const [level, setLevel] = useState("L4");
  const [city, setCity] = useState("San Francisco");
  const [targetN, setTargetN] = useState(3);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const c = await api.createCircle({ company, role, level, city }, targetN);
      router.push(`/app/circle/${c.id}`);
    } catch (err) {
      alert("Failed: " + (err instanceof Error ? err.message : err));
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "color-mix(in oklch, var(--bg) 75%, transparent)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          height: "100%",
          background: "var(--surface-1)",
          borderLeft: "1px solid var(--border-2)",
          padding: 32,
          overflowY: "auto",
        }}
      >
        <div className="eyebrow">New circle</div>
        <h2 className="h-2" style={{ marginTop: 8 }}>
          Define the scope
        </h2>
        <p className="copy-dim" style={{ fontSize: 13, marginTop: 8 }}>
          Only people who fit the scope should join. The classifier uses it as the rubric basis.
        </p>
        <div className="form-grid" style={{ marginTop: 22 }}>
          <div className="field">
            <label>Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Google" />
          </div>
          <div className="field">
            <label>Role</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="SWE" />
          </div>
          <div className="field">
            <label>Level</label>
            <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="L4" />
          </div>
          <div className="field">
            <label>City (optional)</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mountain View" />
          </div>
          <div className="field full">
            <label>
              Target N{" "}
              <span style={{ color: "var(--dim)" }}>
                · reveal when this many valid submissions accumulate
              </span>
            </label>
            <input
              type="number"
              value={targetN}
              onChange={(e) => setTargetN(Number(e.target.value))}
              min={2}
              max={20}
            />
          </div>
        </div>
        <div className="flex gap-8 mt-24">
          <button className="btn accent" disabled={busy} onClick={create}>
            {busy ? "Creating…" : "Create circle"}
          </button>
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="circles-list">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="circle-card"
          style={{ pointerEvents: "none", animation: "pulse 1.4s ease-in-out infinite" }}
        >
          <div>
            <div className="scope" style={{ color: "var(--surface-3)" }}>
              ████████ · ███ · ██
            </div>
            <div className="sub">loading…</div>
          </div>
          <div className="progress">
            <span>—/—</span>
            <div className="progress-bar" style={{ width: 120 }}>
              <div className="fill" style={{ width: "30%" }} />
            </div>
          </div>
          <Pill>—</Pill>
        </div>
      ))}
    </div>
  );
}
