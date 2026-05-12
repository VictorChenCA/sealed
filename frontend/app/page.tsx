import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <TrustReceipts />
        <HowItWorks />
        <Footer />
      </main>
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 panel-grid opacity-30 pointer-events-none" />
      <div className="container relative py-28 max-w-4xl">
        <p className="text-xs uppercase tracking-[0.18em] text-dim mb-6 mono">
          TEE-attested · Sepolia · v0.1
        </p>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          The salary conversation
          <br />
          <span className="text-dim">no one starts.</span>
        </h1>
        <p className="mt-8 text-lg text-dim max-w-2xl leading-relaxed">
          Pay opacity isn&apos;t a privacy problem. It&apos;s a coordination failure.
          Whoever shares first gives everything away and learns nothing.
          Sealed runs the disclosure inside an Intel TDX enclave —
          your numbers stay invisible to everyone, including us,
          until a quorum has each submitted.
        </p>
        <div className="mt-10 flex gap-3">
          <Link
            href="/app"
            className="rounded-md bg-accent text-accent-fg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
          >
            Open the app
          </Link>
          <a
            href="https://github.com/VictorChenCA/sealed"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-5 py-2.5 text-sm hover:bg-panel transition"
          >
            View source ↗
          </a>
        </div>
      </div>
    </section>
  );
}

function TrustReceipts() {
  const receipts = [
    {
      n: "01",
      title: "Source matches running code",
      body:
        "Every deployment is built from a pinned commit in the public GitHub repo. The on-chain record commits to (commit SHA, image digest). You can re-clone and re-build to confirm.",
    },
    {
      n: "02",
      title: "Submissions are unreadable until reveal",
      body:
        "The operator (us, EigenCloud, any human) cannot read your number before the threshold is met. Intel TDX hardware enforces the seal in silicon — not a promise in a privacy policy.",
    },
    {
      n: "03",
      title: "Every reveal is signed by the enclave",
      body:
        "When the reveal happens, it&apos;s signed by a key that was generated inside the enclave and never leaves. Any client can verify the signature without trusting us.",
    },
  ];
  return (
    <section className="border-t border-border bg-panel/30">
      <div className="container py-24 max-w-5xl">
        <p className="text-xs uppercase tracking-[0.18em] text-dim mb-3 mono">Trust receipts</p>
        <h2 className="text-3xl font-semibold tracking-tight mb-12">Three things you can verify yourself.</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {receipts.map((r) => (
            <article key={r.n} className="rounded-lg border border-border bg-panel p-6">
              <div className="text-dim mono text-xs mb-4">{r.n}</div>
              <h3 className="font-semibold mb-2">{r.title}</h3>
              <p className="text-dim text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: r.body }} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "1", t: "Create or join a circle", d: "Pick a scope: company, role, level, city. Set N (default 5)." },
    { n: "2", t: "Submit privately", d: "Your numbers go into the enclave. A model validates plausibility against the public rubric." },
    { n: "3", t: "Wait for the quorum", d: "While N-1 others are submitting, no one can see anyone's number — including us." },
    { n: "4", t: "Reveal, atomically", d: "When the Nth validated submission lands, everyone unlocks at once. The enclave signs the payload." },
    { n: "5", t: "Verify", d: "Click 'See proof'. The verifier checks the running code, the model hash, and the signature live in your browser." },
  ];
  return (
    <section className="border-t border-border">
      <div className="container py-24 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-dim mb-3 mono">How it works</p>
        <h2 className="text-3xl font-semibold tracking-tight mb-12">Five steps, no platform trust.</h2>
        <ol className="space-y-6">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-5 border-b border-border/50 pb-6 last:border-0">
              <div className="mono text-dim w-6 shrink-0">{s.n}</div>
              <div>
                <div className="font-medium mb-1">{s.t}</div>
                <div className="text-dim text-sm leading-relaxed">{s.d}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container py-10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between text-sm text-dim">
        <div>Sealed · Built for EigenCloud Private Preview · Sepolia</div>
        <div className="flex gap-5">
          <a href="https://github.com/VictorChenCA/sealed" target="_blank" rel="noreferrer" className="hover:text-text">Repo</a>
          <Link href="/verify/dashboard" className="hover:text-text">Verifier</Link>
          <a href="https://docs.eigencloud.xyz" target="_blank" rel="noreferrer" className="hover:text-text">EigenCloud docs</a>
        </div>
      </div>
    </footer>
  );
}
