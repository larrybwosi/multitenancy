import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import { getServerAuthContext } from "@/actions/auth";
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const generateMetadata = async(): Promise<Metadata> => {
  const {organizationId } = await getServerAuthContext();
  const getOrg = unstable_cache(
    async id => await db.organization.findUnique({ where: { id }, select: { name: true } }),
    [organizationId]
  );
  const org = await getOrg(organizationId);
  return {
    title: org?.name || "Dealio - SaaS Application",
    description:
      "Dealio is a SaaS Application for Invoicing, Pro Account, Spend & Expenses Management and Accounting automation.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
