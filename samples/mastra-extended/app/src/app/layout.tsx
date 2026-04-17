import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "Tasks and Events Demo",
  description:
    "A small Defang sample where background jobs classify and embed tasks and events, and a copilot answers questions using tools.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
