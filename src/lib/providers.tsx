'use client'; // This component must be a client component

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional DevTools

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize QueryClient - useState ensures it's created only once per component instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default query options (optional)
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: true, // Refetch on window focus
          },
          mutations: {
            // Default mutation options (optional)
             networkMode: 'offlineFirst', // Default, but explicit
            // onError: (error) => { // Global error handler (optional)
            //   console.error("Global mutation error:", error);
            //   // Show a toast notification, etc.
            // },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Optional: React Query DevTools for debugging */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}