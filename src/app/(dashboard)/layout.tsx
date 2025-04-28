import type React from "react"
import { MainNav } from "@/components/main-nav"
import { Sidebar } from "@/components/sidebar copy"
import { WelcomeTour } from "@/components/onboarding/welcome-tour"
import { SidebarProvider } from "@/components/sidebar-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
          <SidebarProvider>
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <MainNav />
          <main className="flex-1 p-6 pt-4 transition-all duration-300">{children}</main>
        </div>
      </div>
      <WelcomeTour />
      </SidebarProvider>
    </div>
  )
}
