"use client"

import {
  BarChart3,
  Box,
  Building2,
  ChevronLeft,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  Users,
  Warehouse,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useSidebar } from "@/components/sidebar-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipHelper } from "@/components/ui/tooltip-helper"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, setIsOpen, isMobile } = useSidebar()

  return (
    <TooltipProvider>
      <>
        {isOpen && isMobile && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
        )}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-all duration-300 ease-in-out",
            isOpen ? "translate-x-0 animate-slide-in-right" : "-translate-x-full",
            "md:relative md:z-0 md:translate-x-0",
          )}
        >
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Warehouse className="h-6 w-6" />
              <span className="font-bold">WMS</span>
            </Link>
            {isMobile && (
              <Button variant="ghost" size="icon" className="absolute right-4 top-3" onClick={() => setIsOpen(false)}>
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Close sidebar</span>
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1 px-4 py-4">
            <nav className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                  pathname === "/dashboard" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
              <Link
                href="/warehouses"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                  pathname.startsWith("/warehouses") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Building2 className="h-5 w-5" />
                Warehouses
                <TooltipHelper content="Manage your warehouses and storage locations" side="right" />
              </Link>
              <Link
                href="/inventory"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                  pathname.startsWith("/inventory") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Package className="h-5 w-5" />
                Inventory
                <TooltipHelper content="Manage your inventory across all warehouses" side="right" />
              </Link>
              <Link
                href="/transfers"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                  pathname.startsWith("/transfers") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Truck className="h-5 w-5" />
                Transfers
                <TooltipHelper content="Manage stock movements between warehouses" side="right" />
              </Link>
              <div className="mt-2 px-3 py-2">
                <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Management</h3>
                <div className="flex flex-col gap-1">
                  <Link
                    href="/products"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                      pathname.startsWith("/products") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Box className="h-5 w-5" />
                    Products
                  </Link>
                  <Link
                    href="/suppliers"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                      pathname.startsWith("/suppliers") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Truck className="h-5 w-5" />
                    Suppliers
                  </Link>
                  <Link
                    href="/purchases"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                      pathname.startsWith("/purchases") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    )}
                  >
                    <ClipboardList className="h-5 w-5" />
                    Purchases
                  </Link>
                </div>
              </div>
              <div className="mt-2 px-3 py-2">
                <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Reports</h3>
                <div className="flex flex-col gap-1">
                  <Link
                    href="/reports/stock"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                      pathname.startsWith("/reports/stock")
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <BarChart3 className="h-5 w-5" />
                    Stock Levels
                  </Link>
                  <Link
                    href="/reports/movements"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                      pathname.startsWith("/reports/movements")
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Truck className="h-5 w-5" />
                    Movements
                  </Link>
                  <Link
                    href="/reports/expenses"
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                      pathname.startsWith("/reports/expenses")
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <CircleDollarSign className="h-5 w-5" />
                    Expenses
                  </Link>
                </div>
              </div>
            </nav>
          </ScrollArea>
          <div className="mt-auto border-t p-4">
            <nav className="flex flex-col gap-1">
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                  pathname.startsWith("/settings") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
              <Link
                href="/users"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                  pathname.startsWith("/users") ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Users className="h-5 w-5" />
                Users
              </Link>
            </nav>
          </div>
        </aside>
      </>
    </TooltipProvider>
  )
}
