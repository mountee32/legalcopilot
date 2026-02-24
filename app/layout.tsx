import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider, ToastProvider, QueryProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "Legal Copilot | AI-Powered Practice Management for US Law Firms",
  description:
    "Legal Copilot automates administrative legal operations for US law firms. AI handles first-pass drafting and analysis while your team approves critical actions.",
  keywords: ["legal tech", "law firm software", "practice management", "AI legal", "US law firms"],
  openGraph: {
    title: "Legal Copilot",
    description: "AI-powered practice management for US law firms.",
    url: "https://legalcopilot.com",
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
