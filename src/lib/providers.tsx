'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional DevTools
import {
  ShoppingCart,
  History,
  Users,
  Package,
  Warehouse,
  Truck,
  Boxes,
  CreditCard,
  DollarSign,
  Percent,
  FileText,
  User,
  Settings,
  Database,
  FolderKanban,
  Mail,
  ClipboardEdit,
  ArrowLeftRight,
  Layers3,
} from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { CheckCircle, InfoIcon, LoaderPinwheel } from "lucide-react";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { toast } from 'sonner';
import Sidebar,{SectionItem} from '@/components/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useSession } from './auth/authClient';


export const sidebarSectionsData: SectionItem[] = [
  {
    id: "sales",
    title: "SALES",
    initiallyExpanded: true,
    routes: [
      {
        id: "point-of-sale",
        title: "Point of Sale",
        path: "/pos",
        icon: <ShoppingCart size={18} />,
      },
      {
        id: "sales-history",
        title: "Sales History",
        icon: <History size={18} />,
        // path: "/sales", // Optional: Parent path if clickable itself
        children: [
          {
            id: "all-sales",
            title: "All Sales",
            path: "/sales", // Child path
            // icon is optional for children, null is fine, or omit it
          },
          {
            id: "returns",
            title: "Returns",
            path: "/sales/history/returned",
          },
          {
            id: "voided",
            title: "Voided Sales",
            path: "/sales/history/voided",
          },
        ],
      },
      {
        id: "customers",
        title: "Customers",
        icon: <Users size={18} />, // Using 'Users' (plural) icon
        // path: "/customers", // Optional: Parent path if clickable itself
        children: [
          {
            id: "customer-list",
            title: "Customer List",
            path: "/customers", // Child path
          },
          {
            id: "customer-groups",
            title: "Customer Groups",
            path: "/customers/groups",
          },
          {
            id: "loyalty-program",
            title: "Loyalty Program",
            path: "/customers/loyalty",
          },
        ],
      },
    ],
  },
  {
    id: "inventory",
    title: "INVENTORY",
    routes: [
      {
        id: "products",
        title: "Products",
        path: "/products",
        icon: <Package size={18} />,
      },
      {
        id: "categories",
        title: "Categories",
        path: "/categories",
        icon: <FolderKanban size={18} />,
      },
      {
        id: "inventory-management",
        title: "Inventory Management",
        icon: <Package size={18} />,
        // path: "/inventory", // Optional: Parent path
        children: [
          {
            id: "stock-levels",
            title: "Stock Levels",
            path: "/stocks/levels",
            icon: <Layers3 size={18} />,
          },
          {
            id: "stock-transfers",
            title: "Stock Transfers",
            path: "/stocks/transfers",
            icon: <ArrowLeftRight size={18} />,
            
          },
          {
            id: "stock-adjustments",
            title: "Adjustments",
            path: "/stocks/adjustments",
            icon: <ClipboardEdit size={18} />,
          },
        ],
      },
      {
        id: "suppliers",
        title: "Suppliers",
        path: "/suppliers",
        icon: <Truck size={18} />,
      },
      {
        id: "warehouses",
        title: "Warehouses",
        path: "/warehouses",
        icon: <Boxes size={18} />,
      },
    ],
  },
  {
    id: "financials",
    title: "FINANCIALS",
    routes: [
      {
        id: "transactions",
        title: "Transactions",
        path: "/financials/transactions",
        icon: <CreditCard size={18} />,
      },
      {
        id: "expenses",
        title: "Expenses",
        path: "/financials/expenses",
        icon: <DollarSign size={18} />,
      },
      {
        id: "taxes",
        title: "Taxes",
        path: "/financials/taxes",
        icon: <Percent size={18} />,
      },
      {
        id: "reports",
        title: "Reports",
        icon: <FileText size={18} />,
        // path: "/financials/reports", // Optional: Parent path
        children: [
          {
            id: "sales-reports",
            title: "Sales Reports",
            path: "/financials/reports/sales",
          },
          {
            id: "inventory-reports",
            title: "Inventory Reports",
            path: "/financials/reports/inventory",
          },
          {
            id: "financial-reports",
            title: "Financial Reports",
            path: "/financials/reports/financial",
          },
          {
            id: "customer-reports",
            title: "Customer Reports",
            path: "/financials/reports/customer",
          },
        ],
      },
    ],
  },
  {
    id: "administration",
    title: "ADMINISTRATION",
    routes: [
      {
        id: "employees",
        title: "Employees",
        icon: <User size={18} />, // Using 'User' (single) icon
        // path: "/admin/employees", // Optional: Parent path
        children: [
          {
            id: "employee-list",
            title: "Employee List",
            path: "/admin/employees/list",
          },
          {
            id: "roles-permissions",
            title: "Roles & Permissions",
            path: "/admin/employees/roles",
          },
          {
            id: "shifts",
            title: "Shifts",
            path: "/admin/employees/shifts",
          },
        ],
      },
      {
        id: "invitations",
        title: "Invitations",
        path: "/invitations",
        icon: <Mail size={18} />, // Using Mail icon for Invitations
      },
      {
        id: "settings",
        title: "System Settings",
        icon: <Settings size={18} />,
        // path: "/admin/settings", // Optional: Parent path
        children: [
          {
            id: "general-settings",
            title: "General Settings",
            path: "/admin/settings/general",
          },
          {
            id: "pos-settings",
            title: "POS Settings",
            path: "/admin/settings/pos",
          },
          {
            id: "tax-settings",
            title: "Tax Settings",
            path: "/admin/settings/tax",
          },
          {
            id: "printer-settings",
            title: "Printer Settings",
            path: "/admin/settings/printer",
          },
          {
            id: "barcode-settings",
            title: "Barcode Settings",
            path: "/admin/settings/barcode",
          },
        ],
      },
      {
        id: "backup",
        title: "Backup & Restore",
        path: "/admin/backup",
        icon: <Database size={18} />,
      },
    ],
  },
];
export function Providers({ children }: { children: React.ReactNode }) {
  const {data: session} = useSession();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
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
            hotelName="Grand Sylhet Hotel"
            hotelAddress="2 admins online"
            sections={sidebarSectionsData}
            currentRoute={"/manage-staff/attendance"}
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}