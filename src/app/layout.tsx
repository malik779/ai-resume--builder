import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "ResumeAI Pro", template: "%s | ResumeAI Pro" },
  description: "AI-powered resume builder that gets you hired faster. Job alignment, probability scoring, and LinkedIn automation.",
  keywords: ["resume builder", "AI resume", "job search", "ATS optimization"],
  openGraph: {
    type: "website",
    title: "ResumeAI Pro",
    description: "Land your dream job with AI-powered resume optimization",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
