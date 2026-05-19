"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { useEffect, useState, type ReactNode } from "react";

const RAW_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

// A real Privy app id is a 25-character cuid-like string.
// Reject obvious placeholders/dummies so SSG doesn't crash.
const PRIVY_APP_ID =
  RAW_APP_ID.length >= 20 && !RAW_APP_ID.startsWith("your-") && RAW_APP_ID !== "dummy"
    ? RAW_APP_ID
    : "";

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Render plain children on the server (and the very first client render
  // before mount) — Privy can only initialize in the browser. This avoids
  // SSG crashes when the app id isn't configured. Falls back to no-auth
  // mode silently when Privy isn't set up — the UI degrades gracefully.
  if (!mounted || !PRIVY_APP_ID) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#5eead4",
          showWalletLoginFirst: false,
        },
        loginMethods: ["email", "google", "apple", "github", "discord", "wallet", "farcaster"],
        embeddedWallets: { createOnLogin: "users-without-wallets" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
