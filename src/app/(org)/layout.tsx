import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import { getServerAuthContext } from "@/actions/auth";
import { redirect } from "next/navigation";
// import { getServerAuthContext } from "@/actions/auth";
// import { db } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const generateMetadata = async(): Promise<Metadata> => {
  // const {organizationId } = await getServerAuthContext();
  // const org = await db.organization.findUnique({where: {id: organizationId}, select: {name: true}});
  return {
    // title: org?.name || "Dealio - SaaS Application",
    title: "Dealio - SaaS Application",
    description:
      "Dealio is a SaaS Application for Invoicing, Pro Account, Spend & Expenses Management and Accounting automation.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await getServerAuthContext();

  console.log("User ID in RootLayout:", userId);
  if(!userId) {
    return redirect("/login");
  }

  // if(!organizationId) {
  //   return redirect("/organizations");
  // }

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
