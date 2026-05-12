"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";

export function SiteHeader() {
  const privyAvailable = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID && !process.env.NEXT_PUBLIC_PRIVY_APP_ID.startsWith("your-");
  return (
    <header className="border-b border-border bg-bg/80 backdrop-blur sticky top-0 z-20">
      <div className="container flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="size-6 rounded-md bg-accent/20 border border-accent/40 flex items-center justify-center">
            <div className="size-2 rounded-sm bg-accent" />
          </div>
          <span>Sealed</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-dim">
          <Link href="/app" className="hover:text-text transition">App</Link>
          <a href="https://github.com/VictorChenCA/sealed" target="_blank" rel="noreferrer" className="hover:text-text transition">GitHub</a>
          {privyAvailable ? <SignInButton /> : null}
        </nav>
      </div>
    </header>
  );
}

function SignInButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  if (!ready) return null;
  if (!authenticated) {
    return (
      <button onClick={login} className="rounded-md bg-accent text-accent-fg px-3 py-1.5 text-sm font-medium hover:opacity-90 transition">
        Sign in
      </button>
    );
  }
  const handle = user?.email?.address ?? user?.google?.email ?? user?.wallet?.address ?? "you";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-dim mono">{handle.slice(0, 16)}…</span>
      <button onClick={logout} className="text-xs text-dim hover:text-text transition">Sign out</button>
    </div>
  );
}
