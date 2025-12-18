import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider, ToastProvider, QueryProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "Legal Copilot | AI-Powered Practice Management for UK Law Firms",
  description:
    "Legal Copilot automates 80% of administrative work for UK law firms. AI handles the drafting, you handle the approvals.",
  keywords: ["legal tech", "law firm software", "practice management", "AI legal", "UK solicitors"],
  openGraph: {
    title: "Legal Copilot",
    description: "AI-powered practice management for UK law firms.",
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
      <body className="font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
