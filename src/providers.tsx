"use client"

import { ReactNode, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {CheckCircle, InfoIcon, LoaderPinwheel} from 'lucide-react';
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { toast, Toaster } from "sonner";


export function Providers({ children }: { children: ReactNode }) {
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
            networkMode: 'offlineFirst', // Default, but explicit
            onError: error => {
              console.error('Global mutation error:', error);
              toast.error(error.message);
            },
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
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
      <NuqsAdapter>{children}</NuqsAdapter>
    </QueryClientProvider>
  );
} 