"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart2,
  ChevronDown,
  HelpCircle,
  Home,
  Layers,
  LogOut,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Sidebar() {
  const pathname = usePathname()
  const [currentRestaurant, setCurrentRestaurant] = useState("Bounty Catch Branch 1")

  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Orders", href: "/orders", icon: ShoppingCart },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Discounts", href: "/discounts", icon: Percent },
    { name: "Ordering table", href: "/ordering-table", icon: Layers },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Order lists", href: "/order-lists", icon: ShoppingCart },
    { name: "Analysis", href: "/analysis", icon: BarChart2 },
  ]

  const bottomNavItems = [
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Help center", href: "/help", icon: HelpCircle },
  ]

  return (
    <div className="w-64 h-full border-r bg-background flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold">F</div>
          <span className="font-semibold">FoodPoint</span>
        </div>

        <div className="text-xs text-muted-foreground mb-2">Current restaurant</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="truncate">{currentRestaurant}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => setCurrentRestaurant("Bounty Catch Branch 1")}>
              Bounty Catch Branch 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrentRestaurant("Bounty Catch Branch 2")}>
              Bounty Catch Branch 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrentRestaurant("Bounty Catch Branch 3")}>
              Bounty Catch Branch 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="text-xs text-muted-foreground mt-1">11435 Market Street, San Francisco, California</div>
      </div>

      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
                item.name === "Discounts" && "text-emerald-600",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t">
        <nav className="grid gap-1 px-2 py-2">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
              <AvatarFallback>AF</AvatarFallback>
            </Avatar>
            <div className="grid gap-0.5 text-sm">
              <div className="font-medium">Antonio Fainaga</div>
              <div className="text-xs text-muted-foreground">antonio@gmail.com</div>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
