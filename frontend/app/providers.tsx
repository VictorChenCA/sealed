"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
  if (!appId || appId.startsWith("your-")) {
    return (
      <>
        <div className="bg-warn/15 text-warn text-xs px-3 py-2 text-center border-b border-warn/30">
          NEXT_PUBLIC_PRIVY_APP_ID not configured. Auth disabled. Set it in .env.local.
        </div>
        {children}
      </>
    );
  }
  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#7c5cff",
          logo: undefined,
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
