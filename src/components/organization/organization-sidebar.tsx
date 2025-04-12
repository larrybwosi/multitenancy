"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Users,
  Mail,
  UserPlus,
  Settings,
  CreditCard,
  FileText,
  Wrench,
  Truck,
  Briefcase,
  Package,
  Bell,
  Building,
  ShoppingCart,
  Warehouse,
  BarChart2,
  ShoppingBag,
} from "lucide-react"

export function OrganizationSidebar() {
  const pathname = usePathname()

  const routes = [
    {
      name: "Dashboard",
      href: "/organization/dashboard",
      icon: BarChart3,
    },
    {
      name: "Staff",
      href: "/organization/members",
      icon: Users,
    },
    {
      name: "Warehouses",
      href: "/organization/warehouse",
      icon: Warehouse,
    },
    {
      name: "Inventory",
      href: "/organization/inventory",
      icon: Package,
    },
    {
      name: "Products",
      href: "/organization/products",
      icon: ShoppingBag,
    },
    {
      name: "Point of Sale",
      href: "/organization/pos",
      icon: ShoppingCart,
    },
    {
      name: "Reports",
      href: "/organization/reports",
      icon: BarChart2,
    },
    {
      name: "Payment voucher",
      href: "/organization/payment",
      icon: CreditCard,
    },
    {
      name: "Payroll",
      href: "/organization/payroll",
      icon: CreditCard,
    },
    {
      name: "Circulars",
      href: "/organization/circulars",
      icon: FileText,
    },
    {
      name: "Maintenance",
      href: "/organization/maintenance",
      icon: Wrench,
    },
    {
      name: "Logistics",
      href: "/organization/logistics",
      icon: Truck,
    },
    {
      name: "Office budget",
      href: "/organization/budget",
      icon: Briefcase,
    },
    {
      name: "Notifications",
      href: "/organization/notifications",
      icon: Bell,
    },
    {
      name: "Capacity building",
      href: "/organization/capacity",
      icon: Building,
    },
    {
      name: "Procurements",
      href: "/organization/procurements",
      icon: ShoppingCart,
    },
  ]

  const adminRoutes = [
    {
      name: "Invitations",
      href: "/organization/invitations",
      icon: Mail,
    },
    {
      name: "Invite Member",
      href: "/organization/invite",
      icon: UserPlus,
    },
    {
      name: "Settings",
      href: "/organization/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <Link href="/organization/dashboard" className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white mr-2">
            <span className="font-bold">O</span>
          </div>
          <span className="text-xl font-bold text-indigo-600">Orlando</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                pathname === route.href ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <route.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  pathname === route.href ? "text-indigo-600" : "text-gray-500 group-hover:text-gray-600",
                )}
              />
              {route.name}
            </Link>
          ))}
        </nav>

        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Administration</h3>
          <nav className="mt-2 space-y-1 px-2">
            {adminRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                  pathname === route.href ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <route.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    pathname === route.href ? "text-indigo-600" : "text-gray-500 group-hover:text-gray-600",
                  )}
                />
                {route.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <button className="w-full text-sm text-indigo-600 font-medium">Upgrade plan</button>
        </div>
      </div>
    </div>
  )
}
