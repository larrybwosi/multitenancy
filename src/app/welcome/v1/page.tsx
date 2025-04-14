"use client"

import { useState, type FormEvent } from "react"

import OrganizationHeader from "@/components/create-organization/organization-header"
import SidePanel from "@/components/create-organization/side-panel"
import DetailForm from "@/components/create-organization/detail-form"
import CategoryManager from "@/components/create-organization/category-manager"
import SettingsForm from "@/components/create-organization/settings-form"
import FormNavigation from "@/components/create-organization/form-navigation"

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

// --- TypeScript Interfaces ---
interface Category {
  id?: string; // Optional: If your backend assigns IDs
  name: string;
  description: string;
}

interface OrganizationState {
  name: string;
  slug: string;
  description: string;
  logoUrl: string | null; // Added for logo
  defaultCurrency: string;
  defaultTimezone: string;
  defaultTaxRate: number | string; // Allow string for input control
  inventoryPolicy: 'FIFO' | 'LIFO' | 'FEFO';
  lowStockThreshold: number | string; // Allow string for input control
  negativeStock: boolean;
}
// --- Component ---
export default function CreateOrganizationPage() {
  const [activeTab, setActiveTab] = useState<string>("details")
  const [loading, setLoading] = useState<boolean>(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const [organization, setOrganization] = useState<OrganizationState>({
    name: "",
    slug: "",
    description: "",
    logoUrl: null,
    defaultCurrency: "USD",
    defaultTimezone: "UTC",
    defaultTaxRate: 0,
    inventoryPolicy: "FEFO",
    lowStockThreshold: 10,
    negativeStock: false,
  })

  const [categories, setCategories] = useState<Category[]>([])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setApiError(null)

    const finalOrganizationData = {
      ...organization,
      // Ensure numeric fields are numbers
      defaultTaxRate: Number.parseFloat(String(organization.defaultTaxRate)) || 0,
      lowStockThreshold: Number.parseInt(String(organization.lowStockThreshold), 10) || 0,
      categories: categories.map(({ id, ...rest }) => rest), // Remove temporary IDs before sending
    }

    console.log("Submitting Organization Data:", finalOrganizationData)

    try {
      // Replace with your actual API endpoint for creating the organization
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalOrganizationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to create organization (status ${response.status})`)
      }

      const result = await response.json()
      console.log("Organization created successfully:", result)
      alert("Organization created successfully!")
      // Redirect or update UI state upon success
      // e.g., router.push(`/organizations/${result.id}`);

      //eslint-disable-next-line
    } catch (error: any) {
      console.error("Error creating organization:", error)
      setApiError(error.message || "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isDetailsComplete = organization.name && organization.slug
  const isReadyToSubmit = isDetailsComplete && categories.length > 0

  return (
    <>
      <OrganizationHeader activeTab={activeTab} />
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-orange-50 to-amber-50">
        <main className="container py-8  items-center flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side - Image and Info */}
            <div className="lg:col-span-4 space-y-6">
              <SidePanel activeTab={activeTab} />
            </div>

            {/* Right Side - Form */}
            <div className="lg:col-span-8">
              <Card className="h-full border-orange-200 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                  <CardTitle>Create Your Organization</CardTitle>
                  <p className="text-orange-100">
                    Set up your business profile on Drongo
                  </p>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                  {apiError && (
                    <div className="px-6 pt-6">
                      <Alert variant="destructive" className="mb-0">
                        <AlertDescription>{apiError}</AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <div className="px-6 pt-6">
                      <TabsList className="grid w-full grid-cols-3 mb-6 bg-orange-100 p-1 rounded-lg">
                        <TabsTrigger
                          value="details"
                          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                        >
                          Details
                        </TabsTrigger>
                        <TabsTrigger
                          value="categories"
                          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                        >
                          Categories
                        </TabsTrigger>
                        <TabsTrigger
                          value="settings"
                          className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                        >
                          Settings
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Step 1: Details */}
                    <TabsContent
                      value="details"
                      className="space-y-6 px-6 pb-6"
                    >
                      <DetailForm
                        organization={organization}
                        setOrganization={setOrganization}
                      />
                      <FormNavigation
                        onNext={() => setActiveTab("categories")}
                        disableNext={!isDetailsComplete}
                        showBack={false}
                      />
                    </TabsContent>

                    {/* Step 2: Categories */}
                    <TabsContent
                      value="categories"
                      className="space-y-6 px-6 pb-6"
                    >
                      <CategoryManager
                        organization={organization}
                        categories={categories}
                        setCategories={setCategories}
                      />
                      <FormNavigation
                        onNext={() => setActiveTab("settings")}
                        onBack={() => setActiveTab("details")}
                      />
                    </TabsContent>

                    {/* Step 3: Settings */}
                    <TabsContent
                      value="settings"
                      className="space-y-6 px-6 pb-6"
                    >
                      <SettingsForm
                        organization={organization}
                        setOrganization={setOrganization}
                      />
                      <FormNavigation
                        onBack={() => setActiveTab("categories")}
                        submitButton
                        loading={loading}
                        disableSubmit={!isReadyToSubmit}
                      />
                    </TabsContent>
                  </Tabs>
                </form>

                <CardFooter className="flex justify-center border-t pt-6 pb-8 bg-orange-50">
                  <p className="text-xs text-orange-700">
                    © {new Date().getFullYear()} Drongo. All rights reserved.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
