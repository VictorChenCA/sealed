"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { Hash } from "@/components/atoms";
import { SiteHeader } from "@/components/site-header";

const COMMIT_SHA = "acc0545c6be0b29ab2eb35b441faec5504dc30c4";
const MODEL_SHA =
  "626b4a6678b86442240e33df819e00132d3ba7dddfe1cdc4fbb18e0a9615c62d";
const ENCLAVE_PUBKEY = "0x850cDA18d259FD6735d862Dea6731e2616e1cfdE";

export default function LandingPage() {
  return (
    <div className="page-landing">
      <SiteHeader />

      <section className="hero">
        <div>
          <HeroEyebrow />
          <h1 className="h-display" style={{ marginTop: 20 }}>
            The salary conversation that doesn&apos;t happen — because no one shares first.
          </h1>
          <p className="lede" style={{ marginTop: 22 }}>
            Sealed runs inside a hardware enclave. Submissions stay unreadable — even to us —
            until N validated entries accumulate. Then everyone reveals at once, signed by a key
            that only exists inside the chip.
          </p>
          <CtaRow />
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">3–5</div>
              <div className="lbl">People per circle</div>
            </div>
            <div className="hero-stat">
              <div className="num">Qwen 2.5 3B</div>
              <div className="lbl">Classifier in enclave</div>
            </div>
            <div className="hero-stat">
              <div className="num">0</div>
              <div className="lbl">Operator reads, ever</div>
            </div>
          </div>
        </div>
        <HeroVisual />
      </section>

      <ProblemSection />
      <MechanismSection />
      <ReceiptsSection />

      <div className="footer">
        <div className="footer-inner">
          <div>SEALED · v1.0 · MIT · sepolia</div>
          <div>
            <Link href="/verify/dashboard">Verify a reveal</Link>
            <a href="https://github.com/VictorChenCA/sealed" target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            <a
              href="https://verify-sepolia.eigencloud.xyz/app/0x01B009899E66b52CF2295b8F79C3fc4E624c0A64"
              target="_blank"
              rel="noreferrer"
            >
              Ecloud verifier ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroEyebrow() {
  return (
    <div className="hero-eye">
      <span className="dot">●</span>
      <span>Live on EigenCompute · Intel TDX · Sepolia</span>
    </div>
  );
}

function CtaRow() {
  const privyAvailable =
    !!process.env.NEXT_PUBLIC_PRIVY_APP_ID && !process.env.NEXT_PUBLIC_PRIVY_APP_ID.startsWith("your-");
  if (privyAvailable) {
    return <PrivyCta />;
  }
  return (
    <div className="hero-cta">
      <Link className="btn lg accent" href="/app" style={{ textDecoration: "none" }}>
        Open the app
      </Link>
      <Link className="btn lg ghost" href="/verify/dashboard" style={{ textDecoration: "none" }}>
        How the proof works →
      </Link>
    </div>
  );
}

function PrivyCta() {
  const { login, authenticated } = usePrivy();
  return (
    <div className="hero-cta">
      {authenticated ? (
        <Link className="btn lg accent" href="/app" style={{ textDecoration: "none" }}>
          Open the app
        </Link>
      ) : (
        <button className="btn lg accent" onClick={login}>
          Start a circle
        </button>
      )}
      <Link className="btn lg ghost" href="/verify/dashboard" style={{ textDecoration: "none" }}>
        How the proof works →
      </Link>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="vh">
        <div className="lights">
          <span />
          <span />
          <span />
        </div>
        <span style={{ marginLeft: 6 }}>circle://google/swe/L4 · 2 of 3 sealed</span>
      </div>
      <div className="vb">
        <ul className="ring">
          <li className="sealed">
            <span className="num">01</span>
            <span>
              <span style={{ color: "var(--muted)" }}>dragon_jpeg</span> · base{" "}
              <span className="val">$204,000</span> · equity <span className="val">$612,000</span>
            </span>
            <span className="seal">⬢ sealed</span>
          </li>
          <li className="sealed">
            <span className="num">02</span>
            <span>
              <span style={{ color: "var(--muted)" }}>harbor_owl</span> · base{" "}
              <span className="val">$218,000</span> · equity <span className="val">$580,000</span>
            </span>
            <span className="seal">⬢ sealed</span>
          </li>
          <li className="empty">
            <span className="num">03</span>
            <span>awaiting submission…</span>
            <span>○ open</span>
          </li>
        </ul>
        <div className="footnote">
          <span>↑</span> commit <span className="hash" style={{ padding: "1px 5px" }}>
            {COMMIT_SHA.slice(0, 8)}
          </span>{" "}
          · model <span className="hash" style={{ padding: "1px 5px" }}>
            {MODEL_SHA.slice(0, 8)}…
          </span>{" "}
          · rubric <span className="hash" style={{ padding: "1px 5px" }}>v1.0</span>
        </div>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className="section">
      <div className="section-hdr">
        <div className="num">01 / The problem</div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Coordination failure
          </div>
          <h2 className="h-1">A market that won&apos;t clear because no one moves first.</h2>
        </div>
      </div>
      <div className="grid-3">
        <div className="feature">
          <div className="ico">↓</div>
          <h4>$100B/yr in wage opacity</h4>
          <p>
            The asymmetry isn&apos;t between you and HR — it&apos;s between you and the four other
            people at your level on your team.
          </p>
        </div>
        <div className="feature">
          <div className="ico">⇆</div>
          <h4>Aggregates miss the room</h4>
          <p>
            Levels.fyi tells you the band. It can&apos;t tell you what your two peers and the new
            hire actually have.
          </p>
        </div>
        <div className="feature">
          <div className="ico">✕</div>
          <h4>Group chats leak</h4>
          <p>
            The first to share gives everything away and learns nothing. Trust collapses before
            anyone types.
          </p>
        </div>
      </div>
    </section>
  );
}

function MechanismSection() {
  return (
    <section className="section">
      <div className="section-hdr">
        <div className="num">02 / The mechanism</div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Hardware-enforced privacy
          </div>
          <h2 className="h-1">Sealed inside the chip. Released when the threshold breaks.</h2>
          <p className="copy mt-12" style={{ maxWidth: "56ch" }}>
            Submissions are encrypted to a key that exists only inside an Intel TDX enclave on
            EigenCompute. A classifier — Qwen 2.5 3B, weights baked into the attested image —
            judges each one against a public rubric. Reveals are signed by the enclave; the
            operator can&apos;t peek, edit, or front-run.
          </p>
        </div>
      </div>
      <div className="grid-3">
        <div className="feature">
          <div className="ico">1</div>
          <h4>Encrypt on submit</h4>
          <p>
            The browser seals your disclosure to a public key derived inside the enclave. Bytes
            leave you encrypted.
          </p>
        </div>
        <div className="feature">
          <div className="ico">2</div>
          <h4>Classify in enclave</h4>
          <p>
            The model decrypts, scores against the rubric, and re-seals. Verdict comes out; numbers
            don&apos;t.
          </p>
        </div>
        <div className="feature">
          <div className="ico">3</div>
          <h4>Atomic reveal</h4>
          <p>
            When N submissions validate, the enclave signs the full set with its private key.
            Everyone unlocks together.
          </p>
        </div>
      </div>
    </section>
  );
}

function ReceiptsSection() {
  return (
    <section className="section">
      <div className="section-hdr">
        <div className="num">03 / The receipts</div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Every reveal is inspectable
          </div>
          <h2 className="h-1">Three things you can verify, without trusting us.</h2>
        </div>
      </div>
      <div className="receipts">
        <div className="receipt">
          <div className="check">✓</div>
          <div>
            <div className="title">Running code matches public source</div>
            <div className="sub">
              EigenCompute built the image from this exact commit. The on-chain record commits to
              (commit SHA, image digest).
            </div>
          </div>
          <Hash value={COMMIT_SHA} short={12} link />
        </div>
        <div className="receipt">
          <div className="check">✓</div>
          <div>
            <div className="title">Classifier model verified</div>
            <div className="sub">
              Qwen 2.5 3B Instruct Q4_K_M — weights baked into the image. Sha256 matches
              HuggingFace&apos;s pinned revision.
            </div>
          </div>
          <Hash value={MODEL_SHA} short={12} link />
        </div>
        <div className="receipt">
          <div className="check">✓</div>
          <div>
            <div className="title">Reveal signed by enclave key</div>
            <div className="sub">
              A wallet derived inside the TDX enclave. Sealed by KMS to this specific image digest
              — never exists outside.
            </div>
          </div>
          <Hash value={ENCLAVE_PUBKEY} short={10} link />
        </div>
      </div>
    </section>
  );
}
