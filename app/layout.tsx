import type { ReactNode } from "react";

export const metadata = {
  title: "SLO Klaviyo MCP",
  description: "Custom Klaviyo MCP connector",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
