# Sealed — 3-Minute Demo Script

Slot #5, EigenCloud Private Preview Demo Day, May 12 2026, 11:00 AM EDT.

**Time budget:** 3 minutes demo + ~7 minutes Q&A.

**Tabs / windows open before starting:**
1. The Sealed UI on the deployed EigenCompute URL
2. A terminal already `cd`'d into the repo, ready to run `curl /verify | jq`
3. GitHub repo open to the rubric file (`/rubrics/v1.0.md` or wherever)
4. The architecture diagram (single image, full-screen)

---

## 0:00 — 0:25 · Hook (the trust problem)

> "Pay opacity costs American workers a hundred billion dollars a year, and it's not because nobody wants to talk — it's a coordination failure. Whoever shares first gives everything away and learns nothing.
>
> Levels.fyi and Blind aggregate at scale. But the conversation that actually moves a negotiation is *the four people at your level on your team* — and that conversation never happens, because no platform can credibly promise it won't peek at the numbers before the reveal.
>
> Sealed makes that promise enforceable."

**[Switch to UI.]**

---

## 0:25 — 1:30 · Live demo (create → submit → reveal)

**[Click "Create circle". Scope: Google / SWE / L4. Target N = 3.]**

> "Here's an offer comparison circle. Three new-grad SWE offers at Google.
> Each submitter fills this form privately. **[Submit submission #1.]**
> The classifier inside the enclave — Qwen 2.5 3B, running locally, weights baked into the attested image — judges it against this published rubric **[click rubric link]**. Plausible, accepted, sealed."

**[Submit #2, normally.]**

**[Submit #3, but with one obviously bad submission first — base salary of $50.]**

> "Watch what happens with a bad submission. **[Submit.]** Rejected, with a specific reason. The submitter can revise; the company never sees the rejected version."

**[Resubmit with correct numbers.]**

> "Threshold met. Three valid disclosures. The enclave produces a signed reveal."

**[Reveal panel opens.]**

> "All three offers, side by side. Median base, median total comp. Atomic — either everyone reveals or nobody does."

---

## 1:30 — 2:15 · Legibility (the see-proof moment)

**[Click "See Proof".]**

> "This is the part that matters. **[Read off the panel.]**
>
> - The running binary matches GitHub commit `a3f1c2…` — go check the repo.
> - The classifier weights match this sha256 — that's Qwen 2.5 3B's published hash.
> - The rubric version is `v1.0`, pinned in the repo.
> - The reveal was signed by this enclave key — derived inside the enclave, never leaves."

**[Switch to terminal.]**

> "Don't take my word for any of this. **[Run:]**
>
> ```
> curl https://sealed.eigencompute.xyz/verify | jq
> ```
>
> Same hashes. Now watch — **[edit a line in src/classifier/qwen.ts, save, don't deploy]** — if I had tampered, the running image's commit SHA would no longer match the public source. The verifier catches it before anyone trusts a reveal."

---

## 2:15 — 2:45 · The falls-apart-on-AWS sentence

> "If we'd built this on AWS, I — the operator — would have plaintext access to every submission. I could drop the ones I dislike, leak them to recruiters, lower the rubric bar for my friend's submission, or just read the numbers and front-run the reveal.
>
> None of those attacks are possible on EigenCompute. The Intel TDX hardware enforces it. The trust circle is one CPU."

---

## 2:45 — 3:00 · Close + generalization

> "Same engine ships peer review for academic papers, sealed RFP bids, B2B disclosure for partnerships, anonymous performance feedback for managers. We're showing salary circles because the trust problem is sharpest there — but the primitive is general.
>
> Asymmetric reveal, classifier-gated, hardware-attested. Sealed."

**[End. Q&A.]**

---

## Backup answers for Q&A

**"What stops sybil attacks?"**
Optional offer-letter upload that the classifier cross-checks against the numeric claim. Optional USDC bond per submission, returned on validation, kept on rejection. Doesn't solve perfectly — and we say so. Out of scope for v1.

**"What if the classifier is wrong?"**
Possible. But the rubric is public, the model weights are pinned, and every verdict comes with a written reason. The submitter can revise. Compare this to existing platforms where the moderation rules are a black box and the moderator is a Trust & Safety team you can't audit.

**"Why not ZK?"**
We'd need to write the classifier as an arithmetic circuit. Qwen 3B Q4 is ~2 GB of int8 weights with attention. The state of the art for ZK-LLM is a few orders of magnitude away from runnable in a demo budget. TEE gets us 80% of the trust property today, for 1% of the engineering effort. The remaining 20% comes from trusting Intel — which is a much smaller surface than "trust the developer."

**"Why Qwen and not Claude?"**
Claude runs in Anthropic's datacenter. The trust chain stops at "trust Anthropic served what they say they served." Qwen running inside the enclave means the model weights, the prompt, the inference code, and the output are all attested by the same Intel CPU. Strongest possible trust claim.

**"Why 3B and not 4B?"**
Speed on CPU. 4B is ~2x slower for a ~5% quality bump on this narrow rubric task. We tested both. Migration to 4B is a one-line config change if we hit a classification quality ceiling.

**"How does the encrypted memory work exactly?"**
EigenCompute injects the MNEMONIC env var via its KMS at boot, and the value is encrypted with a key bound to this exact image digest. If anyone deploys a modified image, the KMS refuses to release the secret — so the wallet doesn't get derived and the app fails closed.

**"Can someone collude with you to deanonymize?"**
Submissions are sealed by handle (a pseudonym chosen at submit time). I — the operator — never see the submissions before reveal. After reveal, the handle is what's shown; mapping handle back to real identity is on the submitters, not the platform. We can do better here in v2 with per-circle ring signatures.

**"What's the production roadmap?"**
Three things in order: (1) per-circle USDC bonds with on-chain settlement; (2) offer-letter PDF upload with OCR-and-cross-check; (3) production-grade sybil resistance via OAuth-attested email + work history. Currently v1 — built overnight.

---

## Pre-demo checklist (run morning-of)

- [ ] Deployed app responds to `/healthz` with `classifier.state == "ready"`
- [ ] Smoke test passes against deployed URL
- [ ] GitHub repo public at https://github.com/VictorChenCA/sealed
- [ ] Repo commit SHA matches the one shown in `/verify` output
- [ ] One example circle pre-created on the deployed app (so you don't have to wait for cold start)
- [ ] Backup screen recording of the full flow, 90 seconds, ready to play if anything breaks
- [ ] Architecture diagram open in a tab
- [ ] Stage terminal has `curl https://<app>/verify | jq` in shell history
- [ ] Phone on silent. Cat on different floor.

## Environment note

This is deployed to `sepolia` via `--verifiable` mode, which means EigenCompute's
build infrastructure cloned the public GitHub repo at a specific commit, built
the Docker image natively (no qemu cross-compile), and the on-chain record
commits to (commit SHA, image digest). Any skeptical observer can `git clone`,
`docker build`, and confirm the image digest matches.

This is *strictly stronger* than building locally + uploading: the link between
source code and running deployment is verifiable by anyone, not just by us.
