import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LinkedIn Scrapper",
    template: "%s · LinkedIn Scrapper",
  },
  description: "Self-hosted LinkedIn people-search extraction: structured filters in, leads out.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
