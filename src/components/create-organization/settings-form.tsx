"use client"

import type React from "react"

import type { ChangeEvent } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { OrganizationState } from "@/types/organization"

interface SettingsFormProps {
  organization: OrganizationState
  setOrganization: React.Dispatch<React.SetStateAction<OrganizationState>>
}

export function SettingsForm({ organization, setOrganization }: SettingsFormProps) {
  const handleOrganizationChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === "checkbox"
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined

    setOrganization((prev) => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }))
  }

  const handleSelectChange = (name: keyof OrganizationState, value: string) => {
    setOrganization((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSwitchChange = (name: keyof OrganizationState, checked: boolean) => {
    setOrganization((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-orange-200 shadow-sm">
        <h3 className="text-lg font-medium text-orange-900 mb-2">Business Settings</h3>
        <p className="text-sm text-orange-700">
          Configure default operational settings for your organization. These can be changed later.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="grid gap-3">
            <Label htmlFor="defaultCurrency" className="text-orange-900">
              Default Currency <span className="text-red-500">*</span>
            </Label>
            <Select
              name="defaultCurrency"
              value={organization.defaultCurrency}
              onValueChange={(value) => handleSelectChange("defaultCurrency", value)}
            >
              <SelectTrigger className="border-orange-200 focus:ring-orange-500">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-orange-600">Primary currency for transactions and reporting.</p>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="defaultTimezone" className="text-orange-900">
              Default Timezone <span className="text-red-500">*</span>
            </Label>
            <Select
              name="defaultTimezone"
              value={organization.defaultTimezone}
              onValueChange={(value) => handleSelectChange("defaultTimezone", value)}
            >
              <SelectTrigger className="border-orange-200 focus:ring-orange-500">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC - Coordinated Universal Time</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                <SelectItem value="Europe/Berlin">Europe/Berlin (CET/CEST)</SelectItem>
                <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-orange-600">Timezone for date/time recording.</p>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="defaultTaxRate" className="text-orange-900">
              Default Tax Rate (%)
            </Label>
            <Input
              id="defaultTaxRate"
              name="defaultTaxRate"
              type="number"
              value={String(organization.defaultTaxRate)}
              onChange={handleOrganizationChange}
              placeholder="e.g., 16"
              step="0.01"
              min="0"
              max="100"
              className="border-orange-200 focus-visible:ring-orange-500"
            />
            <p className="text-xs text-orange-600">Default sales tax percentage (0 if none).</p>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="inventoryPolicy" className="text-orange-900">
              Inventory Policy
            </Label>
            <Select
              name="inventoryPolicy"
              value={organization.inventoryPolicy}
              onValueChange={(value) => handleSelectChange("inventoryPolicy", value as "FIFO" | "LIFO" | "FEFO")}
            >
              <SelectTrigger className="border-orange-200 focus:ring-orange-500">
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIFO">FIFO - First In, First Out</SelectItem>
                <SelectItem value="LIFO">LIFO - Last In, First Out</SelectItem>
                <SelectItem value="FEFO">FEFO - First Expired, First Out</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-orange-600">Method for valuing inventory cost.</p>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="lowStockThreshold" className="text-orange-900">
              Low Stock Threshold
            </Label>
            <Input
              id="lowStockThreshold"
              name="lowStockThreshold"
              type="number"
              value={String(organization.lowStockThreshold)}
              onChange={handleOrganizationChange}
              placeholder="10"
              min="0"
              className="border-orange-200 focus-visible:ring-orange-500"
            />
            <p className="text-xs text-orange-600">Receive alerts when stock quantity falls below this number.</p>
          </div>

          <div className="flex items-center justify-between space-x-2 rounded-md border border-orange-200 p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
            <div className="space-y-0.5">
              <Label htmlFor="negativeStock" className="text-orange-900">
                Allow Negative Stock
              </Label>
              <p className="text-xs text-orange-600">
                Enable selling products even when inventory count is zero or below.
              </p>
            </div>
            <Switch
              id="negativeStock"
              checked={organization.negativeStock}
              onCheckedChange={(checked) => handleSwitchChange("negativeStock", checked)}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsForm
