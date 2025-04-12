'use client';

import React, { useState, useCallback } from 'react';
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
  Group,
} from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { CheckCircle, InfoIcon, LoaderPinwheel } from "lucide-react";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { toast } from 'sonner';
import Sidebar from '@/components/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

// Type definitions (interfaces are preferred for component props)
interface RouteItem {
  id: string;
  title: string;
  path: string;
  icon: React.ReactNode; // Use ReactNode for icons
  children?: RouteItem[];
}

interface RouteGroup {
  id: string;
  title: string;
  routes: RouteItem[];
}

// Explicitly type the routes array
const routes: RouteGroup[] = [
  {
    id: "sales",
    title: "SALES",
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
        path: "/sales",
        icon: <History size={18} />,
        children: [
          {
            id: "all-sales",
            title: "All Sales",
            path: "/sales",
            icon: null, 
          },
          {
            id: "returns",
            title: "Returns",
            path: "/sales/history/returned",
            icon: null,
          },
          {
            id: "voided",
            title: "Voided Sales",
            path: "/sales/history/voided",
            icon: null,
          },
        ],
      },
      {
        id: "customers",
        title: "Customers",
        path: "/customers",
        icon: <Users size={18} className='w-5 h-5' />,
        children: [
          {
            id: "customer-list",
            title: "Customer List",
            path: "/customers",
            icon: null,
          },
          {
            id: "customer-groups",
            title: "Customer Groups",
            path: "/customers/groups",
            icon: null,
          },
          {
            id: "loyalty-program",
            title: "Loyalty Program",
            path: "/customers/loyalty",
            icon: null,
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
        icon: <Group size={18} />,
      },
      {
        id: "inventory-management",
        title: "Inventory Management",
        path: "/inventory",
        icon: <Warehouse size={18} />,
        children: [
          {
            id: "stock-levels",
            title: "Stock Levels",
            path: "/inventory/levels",
            icon: null,
          },
          {
            id: "stock-transfers",
            title: "Stock Transfers",
            path: "/inventory/transfers",
            icon: null,
          },
          {
            id: "stock-adjustments",
            title: "Adjustments",
            path: "/inventory/adjustments",
            icon: null,
          },
          {
            id: "inventory-count",
            title: "Inventory Count",
            path: "/inventory/count",
            icon: null,
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
        path: "/financials/reports",
        icon: <FileText size={18} />,
        children: [
          {
            id: "sales-reports",
            title: "Sales Reports",
            path: "/financials/reports/sales",
            icon: null,
          },
          {
            id: "inventory-reports",
            title: "Inventory Reports",
            path: "/financials/reports/inventory",
            icon: null,
          },
          {
            id: "financial-reports",
            title: "Financial Reports",
            path: "/financials/reports/financial",
            icon: null,
          },
          {
            id: "customer-reports",
            title: "Customer Reports",
            path: "/financials/reports/customer",
            icon: null,
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
        path: "/admin/employees",
        icon: <User size={18} />,
        children: [
          {
            id: "employee-list",
            title: "Employee List",
            path: "/admin/employees/list",
            icon: null,
          },
          {
            id: "roles-permissions",
            title: "Roles & Permissions",
            path: "/admin/employees/roles",
            icon: null,
          },
          {
            id: "shifts",
            title: "Shifts",
            path: "/admin/employees/shifts",
            icon: null,
          },
        ],
      },
      {
        id: "settings",
        title: "System Settings",
        path: "/admin/settings",
        icon: <Settings size={18} />,
        children: [
          {
            id: "general-settings",
            title: "General Settings",
            path: "/admin/settings/general",
            icon: null,
          },
          {
            id: "pos-settings",
            title: "POS Settings",
            path: "/admin/settings/pos",
            icon: null,
          },
          {
            id: "tax-settings",
            title: "Tax Settings",
            path: "/admin/settings/tax",
            icon: null,
          },
          {
            id: "printer-settings",
            title: "Printer Settings",
            path: "/admin/settings/printer",
            icon: null,
          },
          {
            id: "barcode-settings",
            title: "Barcode Settings",
            path: "/admin/settings/barcode",
            icon: null,
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Use useCallback for the toggle function to prevent unnecessary re-renders
  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prevState => !prevState);
  }, []);

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
          {/* Removed outer aside wrapper as Sidebar component now handles its own container */}
          <Sidebar
            routeGroups={routes}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
          />

          {/* Main content area on the right */}
          <main className="flex-1 overflow-auto bg-gray-50"> {/* Added subtle bg color */}
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