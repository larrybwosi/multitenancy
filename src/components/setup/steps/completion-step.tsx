"use client"

import { Check, Store } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { BusinessType, BusinessDetails, Category, ModuleSelection, BusinessCustomization } from "../setup-wizard"

interface CompletionStepProps {
  businessType: BusinessType | null
  businessDetails: BusinessDetails
  categories: Category[]
  modules: ModuleSelection[]
  customization: BusinessCustomization
}

export function CompletionStep({ businessType, businessDetails, categories, modules, customization }: CompletionStepProps) {
  const formatCategoryCount = (count: number) => {
    if (count === 0) return "No categories"
    if (count === 1) return "1 category"
    return `${count} categories`
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-green-50 rounded-full mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Setup Complete!
        </h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          Your POS system has been set up successfully. You&apos;re now ready to
          start using your new point of sale system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div>
          <h3 className="font-semibold text-lg mb-4">Business Information</h3>
          <Card>
            <CardContent className="p-5">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Business Type</span>
                  <span className="font-medium text-gray-800">
                    {businessType?.name || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Business Name</span>
                  <span className="font-medium text-gray-800">
                    {businessDetails.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-800">
                    {businessDetails.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium text-gray-800">
                    {businessDetails.phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Address</span>
                  <span className="font-medium text-gray-800">
                    {businessDetails.address}, {businessDetails.city}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Categories</span>
                  <span className="font-medium text-gray-800">
                    {formatCategoryCount(categories.length)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-4">
            Modules & Customization
          </h3>
          <Card>
            <CardContent className="p-5">
              <h4 className="font-medium mb-2">Active Modules</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {modules.map((module) => (
                  <Badge
                    key={module.id}
                    variant="secondary"
                    className="rounded-md text-xs"
                  >
                    {module.name}
                  </Badge>
                ))}
              </div>

              <h4 className="font-medium mb-2 mt-4">Customization</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Primary Color</span>
                  <div
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: customization.primaryColor }}
                  />
                  <span className="text-gray-700 text-xs">
                    {customization.primaryColor}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Secondary Color</span>
                  <div
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: customization.secondaryColor }}
                  />
                  <span className="text-gray-700 text-xs">
                    {customization.secondaryColor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Theme</span>
                  <span className="font-medium text-gray-800">
                    {customization.theme}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Template</span>
                  <span className="font-medium text-gray-800">
                    {customization.invoiceTemplate}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
        <Store className="h-8 w-8 text-blue-600 mx-auto mb-3" />
        <h3 className="font-semibold text-lg text-blue-800 mb-2">
          What&apos;s Next?
        </h3>
        <p className="text-blue-700 mb-4">
          Your POS system is now set up and ready to use. Here are some next
          steps to get started:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-100 rounded-full h-6 w-6 flex items-center justify-center text-blue-600 font-medium">
                1
              </div>
              <h4 className="font-medium">Add Your Products</h4>
            </div>
            <p className="text-sm text-gray-600">
              Start by adding your products to the inventory system.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-100 rounded-full h-6 w-6 flex items-center justify-center text-blue-600 font-medium">
                2
              </div>
              <h4 className="font-medium">Set Up Staff Accounts</h4>
            </div>
            <p className="text-sm text-gray-600">
              Create accounts for your staff members with appropriate
              permissions.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-100 rounded-full h-6 w-6 flex items-center justify-center text-blue-600 font-medium">
                3
              </div>
              <h4 className="font-medium">Make Your First Sale</h4>
            </div>
            <p className="text-sm text-gray-600">
              Head to the Point of Sale page to process your first transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

