import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { Suspense } from "react";
import {GoogleAnalytics} from '@next/third-parties/google';
// import WarmLayout from "@/components/warm-layout";

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
    "Dealio is a SaaS Application for Invoicing, Pro Account, Spend & Expenses Management, Warehouse Management, POS, Supplier Management, Customer Management and Accounting automation.",
  keywords: [
    "Dealio",
    "SaaS",
    "Application",
    "Invoicing",
    'Accounting',
    'POS',
    'Expenses',
    'Management',
    'Supplier',
    'Restaurant Management',
    'Supplier Management',
  ]
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <GoogleAnalytics gaId="G-M6G43VGKNX" />
          <Suspense>
            {/* <WarmLayout> */}
              {children}
              {/* </WarmLayout> */}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
