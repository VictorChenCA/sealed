"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { Pill } from "./atoms";

export function SiteHeader() {
  const privyAvailable =
    !!process.env.NEXT_PUBLIC_PRIVY_APP_ID && !process.env.NEXT_PUBLIC_PRIVY_APP_ID.startsWith("your-");
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand">
          <span className="mark" />
          <span>SEALED</span>
        </Link>
        <div className="navlinks">
          <Link href="/app">Dashboard</Link>
          <Link href="/verify/dashboard">Verify</Link>
          <a href="https://github.com/VictorChenCA/sealed" target="_blank" rel="noreferrer">
            Repo&nbsp;↗
          </a>
        </div>
        <div className="topbar-right">
          <Pill dot tone="ok">
            enclave online
          </Pill>
          {privyAvailable ? <PrivyAuthButton /> : <NoPrivyButtons />}
        </div>
      </div>
    </div>
  );
}

function PrivyAuthButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  if (!ready) return null;
  if (!authenticated) {
    return (
      <>
        <button className="btn ghost sm" onClick={login}>
          Sign in
        </button>
        <button className="btn sm" onClick={login}>
          Get started
        </button>
      </>
    );
  }
  const handle =
    user?.email?.address ??
    user?.google?.email ??
    user?.wallet?.address ??
    "you";
  const short =
    handle.length > 18 ? handle.slice(0, 8) + "…" + handle.slice(-4) : handle;
  return (
    <button className="btn ghost sm" onClick={logout}>
      <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
        {short}
      </span>
    </button>
  );
}

function NoPrivyButtons() {
  return (
    <Link href="/app" className="btn sm" style={{ textDecoration: "none" }}>
      Open app
    </Link>
  );
}
