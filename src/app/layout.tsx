import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Providers } from "@/providers";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dealio - SaaS Application",
  description:
    "Dealio is a SaaS Application for Invoicing, Pro Account, Spend & Expenses Management and Accounting automation.",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster />
        <NuqsAdapter>
          <Providers>
            <Suspense>{children}</Suspense>
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
