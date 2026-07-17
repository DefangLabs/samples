import type { Metadata } from "next";
import { ErrorReporter } from "@/components/error-reporter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Self-updating Todo",
  description: "A todo app that turns user feedback into live code changes.",
};

// Every application page depends on request-time auth or API state.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorReporter />
        {children}
      </body>
    </html>
  );
}
