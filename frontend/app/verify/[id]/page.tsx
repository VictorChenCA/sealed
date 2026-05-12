"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { VerifyResponse, RevealResponse } from "@/lib/types";
import { Hash, JsonBlock, Pill } from "@/components/atoms";
import { SiteHeader } from "@/components/site-header";

export default function VerifyPage() {
  const { id } = useParams<{ id: string }>();
  const showCircle = id && id !== "dashboard";

  const { data: v } = useSWR<VerifyResponse>("verify", () => api.verify(), {
    refreshInterval: 10_000,
  });
  const { data: reveal } = useSWR<RevealResponse | null>(
    showCircle ? `reveal:${id}` : null,
    () => api.reveal(id!).catch(() => null),
  );

  const [rawOpen, setRawOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const cmd = `git clone https://github.com/VictorChenCA/sealed && cd sealed && bash scripts/verify-locally.sh https://34-178-145-214.nip.io`;
  const copyCmd = () => {
    navigator.clipboard?.writeText(cmd).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  if (!v) {
    return (
      <>
        <SiteHeader />
        <div className="app-shell">
          <div className="card" style={{ padding: 40, color: "var(--muted)" }}>
            Loading attestation surface…
          </div>
        </div>
      </>
    );
  }

  const items: Array<{
    title: string;
    sub: string;
    hash: string | null;
    hashLabel: string;
    href: string;
    hrefLabel: string;
    ok: boolean;
  }> = [
    {
      title: "Running code matches public source",
      sub:
        "EigenCompute built this image from the public repo at the recorded commit. The on-chain record commits to (commit SHA, image digest).",
      hash: v.commit_sha,
      hashLabel: "commit",
      href: `${v.repo_url}/tree/${v.commit_sha}`,
      hrefLabel: "View on GitHub",
      ok: !!v.commit_sha && v.commit_sha !== "dev",
    },
    {
      title: "Classifier model verified",
      sub:
        "Qwen 2.5 3B Instruct Q4_K_M, weights baked into the attested image. Sha256 matches HuggingFace's pinned revision.",
      hash: v.classifier.model_sha256,
      hashLabel: "model sha256",
      href: `https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/blob/7dabda4d13d513e3e842b20f0d435c732f172cbe/qwen2.5-3b-instruct-q4_k_m.gguf`,
      hrefLabel: "View on HuggingFace",
      ok: v.classifier.state === "ready" && !!v.classifier.model_sha256,
    },
    {
      title: `Rubric pinned at ${v.rubric_version}`,
      sub:
        "The classifier judges every submission in this circle against the same versioned rubric — public and auditable.",
      hash: v.rubric_version,
      hashLabel: "rubric",
      href: `${v.repo_url}/blob/${v.commit_sha}/src/classifier/qwen.ts`,
      hrefLabel: "View rubric source",
      ok: !!v.rubric_version,
    },
    {
      title: "Reveal signed by enclave key",
      sub:
        "Wallet derived inside the TDX enclave, sealed by KMS to this exact image digest. The private key cannot exist outside the chip.",
      hash: typeof v.enclave_pubkey === "string" ? v.enclave_pubkey : null,
      hashLabel: "enclave",
      href: `https://sepolia.etherscan.io/address/${v.enclave_pubkey}`,
      hrefLabel: "View on Sepolia Etherscan",
      ok: typeof v.enclave_pubkey === "string" && v.enclave_pubkey.startsWith("0x"),
    },
  ];

  const okCount = items.filter((i) => i.ok).length;

  return (
    <>
      <SiteHeader />
      <div className="app-shell">
        <div className="crumb">
          <Link href="/app" style={{ color: "inherit", textDecoration: "none" }}>
            Dashboard
          </Link>
          <span style={{ margin: "0 8px", color: "var(--dim)" }}>/</span>
          <span>Verify{showCircle ? ` · ${id}` : ""}</span>
        </div>

        <div className="circle-hdr">
          <div>
            <div className="scope-line">TRUST CHAIN</div>
            <h1>Four things you can verify without trusting us.</h1>
            <p className="copy mt-8" style={{ maxWidth: "62ch" }}>
              Every receipt below resolves to a public artifact. Click each hash to confirm it
              independently — against GitHub, HuggingFace, the repo itself, and Sepolia.
            </p>
          </div>
          <div className="flex gap-8">
            <Pill tone={okCount === 4 ? "ok" : "warn"} dot>
              {okCount} / 4 verified
            </Pill>
          </div>
        </div>

        <div className="trust-chain">
          {items.map((t, i) => (
            <div key={i} className="trust-card">
              <div className="check">{t.ok ? "✓" : "…"}</div>
              <div>
                <div className="title">
                  <span className="mono" style={{ color: "var(--dim)", fontSize: 11, marginRight: 6 }}>
                    0{i + 1}
                  </span>
                  {t.title}
                </div>
                <div className="sub">{t.sub}</div>
                <div className="hash-line">
                  <Hash value={t.hash ?? "—"} short={20} label={t.hashLabel} />
                </div>
              </div>
              <div className="right">
                <a
                  href={t.href}
                  target="_blank"
                  rel="noreferrer"
                  className="btn ghost sm"
                  style={{ textDecoration: "none" }}
                >
                  {t.hrefLabel} ↗
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="section-title">
          <h3>Verify locally</h3>
          <div className="meta">One command · idempotent · safe</div>
        </div>
        <p className="copy-dim" style={{ fontSize: 13, marginTop: -4 }}>
          Re-runs the same checks in your shell: re-clones the repo at the commit, verifies the
          model sha256 against the Dockerfile-pinned value, and checks the running deployment.
        </p>
        <div className="copy-cmd">
          <span>
            <span className="prompt">$</span>
            {cmd}
          </span>
          <button className="btn ghost sm" onClick={copyCmd}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>

        <div className="section-title">
          <h3>Raw attestation</h3>
          <button className="btn ghost sm" onClick={() => setRawOpen(!rawOpen)}>
            {rawOpen ? "Hide" : "Expand"} {rawOpen ? "↑" : "↓"}
          </button>
        </div>
        {rawOpen && (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>
                /verify response
              </div>
              <JsonBlock value={v} />
            </div>
            {reveal && (
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  Reveal attestation · {id}
                </div>
                <JsonBlock value={reveal.attestation} />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
