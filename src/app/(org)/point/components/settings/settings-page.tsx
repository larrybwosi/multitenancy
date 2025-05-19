"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TableSettings } from "@/components/settings/table-settings"
import { CategorySettings } from "@/components/settings/category-settings"
import { ProductSettings } from "@/components/settings/product-settings"
import { GeneralSettings } from "@/components/settings/general-settings"
import { UserSettings } from "@/components/settings/user-settings"
import { PaymentSettings } from "@/components/settings/payment-settings"
import { Separator } from "@/components/ui/separator"

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your restaurant settings and configurations</p>
        </div>
      </div>

      <Separator className="mb-6" />

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full h-auto">
          <TabsTrigger value="general" className="py-2">
            General
          </TabsTrigger>
          <TabsTrigger value="tables" className="py-2">
            Tables
          </TabsTrigger>
          <TabsTrigger value="categories" className="py-2">
            Categories
          </TabsTrigger>
          <TabsTrigger value="products" className="py-2">
            Products
          </TabsTrigger>
          <TabsTrigger value="users" className="py-2">
            Users
          </TabsTrigger>
          <TabsTrigger value="payment" className="py-2">
            Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="tables" className="space-y-6">
          <TableSettings />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategorySettings />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductSettings />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserSettings />
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <PaymentSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
