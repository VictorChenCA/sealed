import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Sealed — salary disclosure circles",
  description:
    "Sealed runs inside an Intel TDX enclave. Salary disclosures stay unreadable — even to the operator — until N validated submissions accumulate, then everyone reveals at once.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="stage">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
