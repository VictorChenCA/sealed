# Draft Slack message to post in #ext-private-preview

(Task #3 — paste this when you're ready. Non-blocking; we're already deployed.)

---

> Hey @Matt Murray @Mustafa — quick infra question while wrapping up demo prep.
>
> 1. **GPU TEE instances on the roadmap?** Deployed on `g1-standard-4t` (Intel TDX, 4 vCPU, 16 GB) and Qwen 2.5 3B Q4 CPU inference works fine for classifier-grade workloads (~5s per judgment). But for anything bigger than ~7B params or generation-heavy use cases the CPU path gets tight. Curious whether confidential GPU (NVIDIA H100 CC, AMD MI300 SEV-SNP) is on the near roadmap, or if we should plan around CPU-only for the foreseeable future.
>
> 2. **Default ingress without DOMAIN config?** Took me a bit to figure out that `compute-source-env.sh` skips Caddy setup when `DOMAIN` isn't set, which leaves the app unreachable from outside even though status=Running. Worked around it with a `nip.io` wildcard. Worth flagging in the docs that direct-IP access isn't a thing — apps need a domain (real or wildcard) to be reachable externally. Happy to PR a one-line note to the README if useful.
>
> Deployed app: `0x01B009899E66b52CF2295b8F79C3fc4E624c0A64` (sepolia) — looking forward to demoing in slot #5 today 🙏
