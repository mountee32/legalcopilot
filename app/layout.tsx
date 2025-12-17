import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Legal Copilot | AI-Powered Practice Management for UK Law Firms",
  description:
    "Legal Copilot automates 80% of administrative work for UK law firms. AI handles the drafting, you handle the approvals. Coming soon.",
  keywords: ["legal tech", "law firm software", "practice management", "AI legal", "UK solicitors"],
  openGraph: {
    title: "Legal Copilot | Coming Soon",
    description: "AI-powered practice management for UK law firms. Coming soon.",
    url: "https://legalcopilot.co.uk",
    siteName: "Legal Copilot",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
