import type { ReactNode } from "react";
import type { Metadata } from "next";

const title = "SOI Klaviyo MCP";
const description =
  "Custom Klaviyo MCP connector for Claude — manage templates, segments, lists, and flows.";

export const metadata: Metadata = {
  metadataBase: process.env.PUBLIC_URL ? new URL(process.env.PUBLIC_URL) : undefined,
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: title,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
