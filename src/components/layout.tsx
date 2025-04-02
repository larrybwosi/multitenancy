import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";
// import { BusinessNavigation } from "@/components/business-navigation";
// import { getBusinessDetails } from "@/actions/business";
// import Image from "next/image";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ClevPOS - Modern Point of Sale System",
  description:
    "A modern POS system built for the modern market with all the features you need including inventory management, point of sale, customer management, ai assistant and more.",
  generator: "v0.dev",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch business details to customize the layout
  // const businessDetails = await getBusinessDetails();
  
  return (
    <html lang={ "en"} suppressHydrationWarning>
      <body className={`font-sans ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
              <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* <Link href="/" className="flex items-center gap-2">
                    {businessDetails?.logoUrl ? (
                      <Image
                        src={businessDetails.logoUrl} 
                        width={32} 
                        height={32}
                        alt={businessDetails.name || "ClevPOS"} 
                        className="h-8 w-auto"
                      />
                    ) : (
                      <span className="font-bold">
                        {businessDetails?.name || "ClevPOS"}
                      </span>
                    )}
                  </Link> */}
                  
                  {/* Dynamic navigation based on business type and enabled modules */}
                  {/* <BusinessNavigation 
                    businessType={businessDetails?.type} 
                    activeModules={businessDetails?.activeModules || []}
                  /> */}
                </div>
                
                {/* User profile and other controls can be added here */}
                <div className="flex items-center gap-4">
                  
                  {/* Theme toggle, notifications, and user menu can be added here */}
                </div>
              </div>
            </header>
            <main className="flex-1">
              <NuqsAdapter>{children}</NuqsAdapter>
            </main>
            
            {/* Conditional footer based on business needs */}
            {/* {businessDetails?.customizations?.showFooter && (
              <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row"> */}
                  {/* <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} {businessDetails.name}. All rights reserved.
                  </p> */}
                  
                  {/* Additional footer content based on business requirements */}
                {/* </div>
              </footer>
            )} */}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
