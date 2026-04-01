import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Mastra Support Ops",
  description: "A multi-service Mastra support and ops copilot sample for Defang.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
