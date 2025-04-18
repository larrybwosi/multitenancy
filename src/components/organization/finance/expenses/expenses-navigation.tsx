"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BarChart3, Calendar, Clock, FileText, LayoutDashboard } from "lucide-react"

export function ExpensesNavigation() {
  const pathname = usePathname()

  const links = [
    {
      href: "/finance/expenses",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: "/finance/expenses/recurring",
      label: "Recurring",
      icon: Clock,
    },
    {
      href: "/finance/expenses/analytics",
      label: "Analytics",
      icon: BarChart3,
    },
    {
      href: "/finance/expenses/calendar",
      label: "Calendar",
      icon: Calendar,
    },
    {
      href: "/finance/expenses/reports",
      label: "Reports",
      icon: FileText,
    },
  ]

  return (
    <nav className="flex overflow-auto pb-2">
      <div className="flex gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted",
              pathname === link.href
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground",
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
