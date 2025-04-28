"use client"

import { Bell, Menu, Search, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ThemeConfig } from "@/app/theme-config"
import { useSidebar } from "@/components/sidebar-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

export function MainNav() {
  const pathname = usePathname()
  const { isOpen, setIsOpen, isMobile } = useSidebar()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 transition-all duration-300">
      {isMobile && (
        <Button variant="outline" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      )}
      <div className="w-full flex-1">
        <div className="hidden md:flex">
          <nav className="flex items-center space-x-4 lg:space-x-6">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/warehouses"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname.startsWith("/warehouses") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Warehouses
            </Link>
            <Link
              href="/inventory"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname.startsWith("/inventory") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Inventory
            </Link>
            <Link
              href="/transfers"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname.startsWith("/transfers") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Transfers
            </Link>
          </nav>
        </div>
        <div className="md:hidden">
          <h1 className="text-lg font-semibold">
            {pathname === "/dashboard" && "Dashboard"}
            {pathname.startsWith("/warehouses") && "Warehouses"}
            {pathname.startsWith("/inventory") && "Inventory"}
            {pathname.startsWith("/transfers") && "Transfers"}
          </h1>
        </div>
      </div>
      <div className="hidden md:flex md:flex-1 md:items-center md:justify-end md:space-x-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search inventory..."
            className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
          />
        </div>
      </div>
      <ThemeConfig />
      <Button variant="outline" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
          3
        </span>
        <span className="sr-only">Notifications</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
