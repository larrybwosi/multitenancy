"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Search,
  FileText,
  Users,
  CreditCard,
  Package,
  Settings,
  BarChart,
  ShoppingCart,
  Warehouse,
  Receipt,
  Calculator,
  PieChart,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DashboardDocs,
  MembersDocs,
  FinanceDocs,
  InventoryDocs,
  SettingsDocs,
  ApiDocs,
  GlossaryDocs,
} from "@/components/organization/documentation/documentation-content"

export function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("dashboard")

  const sidebarItems = [
    {
      title: "Getting Started",
      icon: <FileText className="h-4 w-4" />,
      items: [
        { title: "Dashboard", href: "#dashboard", id: "dashboard", icon: <BarChart className="h-4 w-4" /> },
        { title: "Members", href: "#members", id: "members", icon: <Users className="h-4 w-4" /> },
      ],
    },
    {
      title: "Financial Management",
      icon: <CreditCard className="h-4 w-4" />,
      items: [
        { title: "Transactions", href: "#transactions", id: "transactions", icon: <CreditCard className="h-4 w-4" /> },
        { title: "Expenses", href: "#expenses", id: "expenses", icon: <Receipt className="h-4 w-4" /> },
        { title: "Taxes", href: "#taxes", id: "taxes", icon: <Calculator className="h-4 w-4" /> },
        {
          title: "Financial Reports",
          href: "#financial-reports",
          id: "financial-reports",
          icon: <PieChart className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Inventory Management",
      icon: <Package className="h-4 w-4" />,
      items: [
        { title: "Warehouses", href: "#warehouses", id: "warehouses", icon: <Warehouse className="h-4 w-4" /> },
        { title: "Inventory", href: "#inventory", id: "inventory", icon: <Package className="h-4 w-4" /> },
        { title: "Products", href: "#products", id: "products", icon: <ShoppingCart className="h-4 w-4" /> },
      ],
    },
    {
      title: "System",
      icon: <Settings className="h-4 w-4" />,
      items: [
        { title: "Settings", href: "#settings", id: "settings", icon: <Settings className="h-4 w-4" /> },
        { title: "API Reference", href: "#api", id: "api", icon: <FileText className="h-4 w-4" /> },
        { title: "Glossary", href: "#glossary", id: "glossary", icon: <FileText className="h-4 w-4" /> },
      ],
    },
  ]

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Scroll to the section
    const element = document.getElementById(value)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/organization/dashboard" className="flex items-center gap-2 font-semibold">
          <FileText className="h-6 w-6" />
          <span>Documentation</span>
        </Link>
        <div className="w-full flex-1">
          <form>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search documentation..."
                className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </form>
        </div>
        <Button asChild>
          <Link href="/organization/dashboard">Back to Dashboard</Link>
        </Button>
      </header>
      <div className="grid flex-1 md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr]">
        <aside className="hidden border-r md:block">
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-2 p-6">
              <h3 className="text-lg font-semibold">Documentation</h3>
              <p className="text-sm text-muted-foreground">Learn how to use the organization administration system</p>
            </div>
            <div className="flex flex-col gap-4 p-6 pt-0">
              {sidebarItems.map((section) => (
                <div key={section.title} className="flex flex-col gap-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    {section.icon}
                    {section.title}
                  </h4>
                  <div className="flex flex-col gap-1">
                    {section.items.map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className={cn(
                          "justify-start gap-2 text-muted-foreground",
                          activeTab === item.id && "bg-muted font-medium text-foreground",
                        )}
                        onClick={() => handleTabChange(item.id)}
                      >
                        {item.icon}
                        {item.title}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>
        <div className="flex flex-col">
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={handleTabChange} className="flex-1">
            <div className="flex items-center border-b px-4 md:hidden">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                {sidebarItems.flatMap((section) =>
                  section.items.map((item) => (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      className={cn(
                        "rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                      )}
                    >
                      {item.title}
                    </TabsTrigger>
                  )),
                )}
              </TabsList>
            </div>
            <ScrollArea className="flex-1">
              <div className="max-w-4xl p-6 pt-8 md:p-10">
                <TabsContent value="dashboard" className="mt-0 border-0 p-0">
                  <DashboardDocs />
                </TabsContent>
                <TabsContent value="members" className="mt-0 border-0 p-0">
                  <MembersDocs />
                </TabsContent>
                <TabsContent value="transactions" className="mt-0 border-0 p-0">
                  <FinanceDocs section="transactions" />
                </TabsContent>
                <TabsContent value="expenses" className="mt-0 border-0 p-0">
                  <FinanceDocs section="expenses" />
                </TabsContent>
                <TabsContent value="taxes" className="mt-0 border-0 p-0">
                  <FinanceDocs section="taxes" />
                </TabsContent>
                <TabsContent value="financial-reports" className="mt-0 border-0 p-0">
                  <FinanceDocs section="reports" />
                </TabsContent>
                <TabsContent value="warehouses" className="mt-0 border-0 p-0">
                  <InventoryDocs section="warehouses" />
                </TabsContent>
                <TabsContent value="inventory" className="mt-0 border-0 p-0">
                  <InventoryDocs section="inventory" />
                </TabsContent>
                <TabsContent value="products" className="mt-0 border-0 p-0">
                  <InventoryDocs section="products" />
                </TabsContent>
                <TabsContent value="settings" className="mt-0 border-0 p-0">
                  <SettingsDocs />
                </TabsContent>
                <TabsContent value="api" className="mt-0 border-0 p-0">
                  <ApiDocs />
                </TabsContent>
                <TabsContent value="glossary" className="mt-0 border-0 p-0">
                  <GlossaryDocs />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
