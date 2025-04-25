'use client';

import {NuqsAdapter} from 'nuqs/adapters/next/app';
import Sidebar from '@/components/sidebar';
import {TooltipProvider} from '@/components/ui/tooltip';
import {useSession} from './auth/authClient';
import {sidebarSectionsData} from '@/components/sidebar-routes';

export function Providers({children}: {children: React.ReactNode}) {
  const {data: session} = useSession();

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-screen w-full">
        <Sidebar
          appName="Dealio"
          sections={sidebarSectionsData}
          user={{
            name: session?.user?.name || 'Larry Dean',
            role: session?.user?.role || 'Super Admin',
            avatar: session?.user?.image || undefined,
          }}
        />

        {/* Main content area on the right */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {' '}
          {/* Added subtle bg color */}
          <NuqsAdapter>{children}</NuqsAdapter>
        </main>
      </div>
    </TooltipProvider>
  );
}
