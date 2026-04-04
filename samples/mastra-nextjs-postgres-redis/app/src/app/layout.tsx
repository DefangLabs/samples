import "./globals.css";
import type { ReactNode } from "react";

import { companyContext } from "@/lib/demo";

export const metadata = {
  title: companyContext.commandCenterName,
  description: `${companyContext.productSummary} A realistic internal customer-operations sample built with Mastra, Next.js, PostgreSQL, Redis, and Defang.`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
