"use client";

import { useMemo, useState } from "react";

export function fmtUSD(n: number | null | undefined, opts: { short?: boolean } = {}): string {
  if (n == null || isNaN(n)) return "—";
  if (opts.short && Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
    return "$" + (n / 1000).toFixed(0) + "k";
  }
  return "$" + Math.round(n).toLocaleString();
}

type PillProps = {
  children: React.ReactNode;
  tone?: "ok" | "bad" | "warn" | "accent";
  dot?: boolean;
};
export function Pill({ children, tone, dot }: PillProps) {
  const cls = "pill" + (tone ? " " + tone : "");
  return (
    <span className={cls}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function Hash({
  value,
  short = 10,
  link = false,
  label,
  onClick,
}: {
  value?: string | null;
  short?: number;
  link?: boolean;
  label?: string;
  onClick?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="hash">—</span>;
  const display = value.length > short + 2 ? value.slice(0, short) + "…" + value.slice(-4) : value;
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };
  return (
    <span className="flex items-center gap-8">
      <span className={"hash" + (link ? " link" : "")} title={value} onClick={onClick}>
        {label ? <span style={{ color: "var(--muted)" }}>{label} </span> : null}
        {display}
      </span>
      <button className="copy-btn" onClick={copy} title="Copy" aria-label="Copy">
        {copied ? (
          "✓"
        ) : (
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="4" width="9" height="9" rx="1.5" />
            <path d="M11 4 V3 a1 1 0 0 0 -1 -1 H3 a1 1 0 0 0 -1 1 v7 a1 1 0 0 0 1 1 h1" />
          </svg>
        )}
      </button>
    </span>
  );
}

export function JsonBlock({ value }: { value: unknown }) {
  const lines = useMemo(() => {
    const text = JSON.stringify(value, null, 2);
    return text.split("\n").map((line, i) => {
      let html = line
        .replace(/("([^"\\]|\\.)*")(\s*:)/g, '<span class="k">$1</span>$3')
        .replace(/:\s*("([^"\\]|\\.)*")/g, ': <span class="s">$1</span>')
        .replace(/:\s*(true|false|null)\b/g, ': <span class="b">$1</span>')
        .replace(/:\s*(-?\d+(\.\d+)?([eE][+-]?\d+)?)/g, ': <span class="n">$1</span>')
        .replace(/^([{}\[\]]+,?\s*)$/gm, '<span class="p">$1</span>');
      return <div key={i} dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }} />;
    });
  }, [value]);
  return <pre className="json">{lines}</pre>;
}

export function StateBadge({ state }: { state: "open" | "sealed" | "revealed" | string }) {
  if (state === "open") return <Pill dot>open</Pill>;
  if (state === "sealed")
    return (
      <Pill tone="accent" dot>
        sealed
      </Pill>
    );
  if (state === "revealed")
    return (
      <Pill tone="ok" dot>
        revealed
      </Pill>
    );
  return <Pill>{state}</Pill>;
}
