'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


import { Toaster } from "@/components/ui/sonner";
import { CheckCircle, InfoIcon, LoaderPinwheel } from "lucide-react";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { toast } from 'sonner';
import Sidebar from '@/components/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSession } from './auth/authClient';
import { sidebarSectionsData } from '@/components/sidebar-routes';


export function Providers({ children }: { children: React.ReactNode }) {
  const {data: session} = useSession();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
            gcTime: 1000 * 60 * 60 * 12, // 12 hours
          },
          mutations: {
            networkMode: "offlineFirst", // Default, but explicit
            onError: (error) => {
              console.error("Global mutation error:", error);
              toast.error(error.message);
            },
          },
        },
      })
  );
  

  return (
    <QueryClientProvider client={queryClient}>
      {/* Wrap relevant parts with TooltipProvider */}
      <TooltipProvider delayDuration={100}>
        <div className="flex h-screen w-full">
          {/* Sidebar on the left - Pass state and toggle function */}
          <Sidebar
            appName="Dealio"
            hotelAddress="2 admins online"
            sections={sidebarSectionsData}
            user={{
              name: session?.user?.name || "Larry Dean",
              role: session?.user?.role || "Super Admin",
              avatar: session?.user?.image || undefined,
            }}
          />

          {/* Main content area on the right */}
          <main className="flex-1 overflow-auto bg-gray-50">
            {" "}
            {/* Added subtle bg color */}
            <NuqsAdapter>{children}</NuqsAdapter>
          </main>
        </div>
      </TooltipProvider>

      <Toaster
        position="bottom-right"
        toastOptions={{ duration: 3000 }}
        icons={{
          success: <CheckCircle className="text-green-500" />,
          info: <InfoIcon className="text-blue-500" />,
          warning: <InfoIcon className="text-orange-500" />,
          error: <InfoIcon className="text-red-500" />,
          loading: <LoaderPinwheel className="animate-spin" />,
        }}
        richColors
      />
    </QueryClientProvider>
  );
}