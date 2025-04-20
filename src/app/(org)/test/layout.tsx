import { Header } from "@/components/test/header"
import type React from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
