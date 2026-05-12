"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { VerifyResponse, RevealResponse } from "@/lib/types";
import { shorten } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";

export default function VerifyPage() {
  const { id } = useParams<{ id: string }>();
  const { data: v } = useSWR<VerifyResponse>("verify", api.verify, { refreshInterval: 8000 });
  const { data: reveal } = useSWR<RevealResponse | null>(
    id && id !== "dashboard" ? `reveal:${id}` : null,
    () => api.reveal(id!).catch(() => null),
  );

  return (
    <>
      <SiteHeader />
      <main className="container py-12 max-w-3xl">
        <Link href="/app" className="text-dim text-sm hover:text-text">← Back</Link>
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.18em] text-dim mb-2 mono">Trust chain</p>
          <h1 className="text-3xl font-semibold tracking-tight">See proof</h1>
          <p className="text-dim mt-2 max-w-xl">
            Four checks. Each verifiable by a third party with no trust in us.
            If any one fails, treat the reveal as compromised.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <CheckCard
            n="01"
            title="Running code matches public source"
            value={v ? shorten(v.commit_sha, 10, 4) : "loading…"}
            href={v ? `${v.repo_url}/tree/${v.commit_sha}` : undefined}
            ok={!!v}
            description="The ecloud build pipeline cloned this exact commit, built the image, and signed the provenance. Click to open the source at the verified commit."
          />
          <CheckCard
            n="02"
            title="Classifier model verified"
            value={v?.classifier.model_sha256 ? shorten(v.classifier.model_sha256, 12, 6) : "loading…"}
            href="https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/tree/7dabda4d13d513e3e842b20f0d435c732f172cbe"
            ok={v?.classifier.state === "ready"}
            description="The model weights inside the enclave hash to this sha256. The same hash is pinned in the public Dockerfile. Click to inspect the HuggingFace revision."
          />
          <CheckCard
            n="03"
            title="Rubric pinned"
            value={v ? v.rubric_version : "loading…"}
            href={v ? `${v.repo_url}/blob/${v.commit_sha}/src/classifier/qwen.ts` : undefined}
            ok={!!v}
            description="The classifier prompt is part of the audited source. Every submission across every circle is judged by the same rule set."
          />
          <CheckCard
            n="04"
            title="Reveal signed by enclave key"
            value={v ? shorten(typeof v.enclave_pubkey === "string" ? v.enclave_pubkey : "—", 10, 6) : "loading…"}
            href={
              v && typeof v.enclave_pubkey === "string" && v.enclave_pubkey.startsWith("0x")
                ? `https://sepolia.etherscan.io/address/${v.enclave_pubkey}`
                : undefined
            }
            ok={!!v && typeof v.enclave_pubkey === "string" && v.enclave_pubkey.startsWith("0x")}
            description="The key was generated inside the enclave's TPM and never leaves. Any client can verify the signature locally."
          />
        </div>

        {reveal && (
          <div className="mt-10 rounded-lg border border-border bg-panel p-6 text-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-dim mb-3 mono">This reveal&apos;s receipt</p>
            <pre className="mono text-xs overflow-x-auto text-dim">
{JSON.stringify(reveal.attestation, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-10 rounded-lg border border-border bg-panel p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-dim mb-2 mono">Verify locally</p>
          <p className="text-sm text-dim mb-4">
            Don&apos;t trust this UI. Run the checks yourself on your own machine.
          </p>
          <pre className="mono text-xs bg-bg rounded-md p-3 border border-border overflow-x-auto">
{`git clone https://github.com/VictorChenCA/sealed && cd sealed
bash scripts/verify-locally.sh ${process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://your-backend"}`}
          </pre>
        </div>
      </main>
    </>
  );
}

function CheckCard({
  n,
  title,
  value,
  href,
  ok,
  description,
}: {
  n: string;
  title: string;
  value: string;
  href?: string;
  ok: boolean;
  description: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-panel p-6">
      <div className="flex items-start gap-4">
        <div className={`mono text-xs pt-1 ${ok ? "text-good" : "text-dim"}`}>
          {ok ? "✓" : "…"} {n}
        </div>
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className="text-dim text-sm mt-1 leading-relaxed">{description}</div>
        </div>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mono text-xs text-accent hover:underline whitespace-nowrap"
          >
            {value} ↗
          </a>
        ) : (
          <div className="mono text-xs text-dim">{value}</div>
        )}
      </div>
    </article>
  );
}
