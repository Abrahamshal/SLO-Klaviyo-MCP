import type { ReactNode } from "react";

export const metadata = {
  title: "SOI Klaviyo MCP",
  description: "Custom Klaviyo MCP connector",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
