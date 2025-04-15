"use client"

import { useState, type FormEvent } from "react"
import OrganizationHeader from "@/components/create-organization/organization-header"
import SidePanel from "@/components/create-organization/side-panel"
import DetailForm from "@/components/create-organization/detail-form"
import SettingsForm from "@/components/create-organization/settings-form"
import FormNavigation from "@/components/create-organization/form-navigation"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { toast } from "sonner"

// --- TypeScript Interfaces ---

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

  // Calculate completion progress
  const getProgress = () => {
    let progress = 0;
    const totalSteps = 2; // Total number of steps/tabs
    
    // Add points for completion of details tab
    if (organization.name) progress += 0.25;
    if (organization.slug) progress += 0.25;
    
    // Add points for completion of settings tab
    if (activeTab === "settings") progress += 0.5;
    
    return Math.min(100, Math.round((progress / totalSteps) * 100));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setApiError(null)

    const finalOrganizationData = {
      ...organization,
      // Ensure numeric fields are numbers
      defaultTaxRate: Number.parseFloat(String(organization.defaultTaxRate)) || 0,
      lowStockThreshold: Number.parseInt(String(organization.lowStockThreshold), 10) || 0,
    }

    console.log("Submitting Organization Data:", finalOrganizationData)

    try {
      // Replace with your actual API endpoint for creating the organization
      const response = await fetch("/api/organization", {
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
      toast.success(`${organization.name||"Organization"} created successfully!`, { duration: 5000 });
      
      // Show success message with animation
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
  const isReadyToSubmit = isDetailsComplete

  // Animations
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <OrganizationHeader activeTab={activeTab} />
      
      <div className="container py-8 px-4 mx-auto">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-orange-600">
            Create Your Dealio Organization
          </h1>
          <p className="text-center text-gray-600 max-w-2xl mx-auto">
            Set up your business profile and start managing your inventory effortlessly
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Left Side - Image and Info */}
          <div className="lg:col-span-4 space-y-6">
            <SidePanel activeTab={activeTab} />
            
            {/* Progress indicator */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-md border border-orange-100"
            >
              <h3 className="font-medium text-gray-700 mb-2">Setup Progress</h3>
              <Progress value={getProgress()} className="h-2 mb-2 bg-orange-100" />
              <p className="text-sm text-gray-500">{getProgress()}% complete</p>
            </motion.div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:col-span-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="overflow-hidden border-orange-200 shadow-xl bg-white">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-8 px-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-bold">Create Your Organization</CardTitle>
                      <p className="text-orange-50 mt-2">
                        Set up your business profile on Dealio
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <div className="bg-white/10 p-3 rounded-full">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zm5 2a2 2 0 11-4 0 2 2 0 014 0zm-8 8c0-1.657.895-3 2-3s2 1.343 2 3-1.346 3-3 3-3-1.343-3-3zm6-2a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                  {apiError && (
                    <div className="px-8 pt-6">
                      <Alert variant="destructive" className="mb-0 border-red-300 bg-red-50">
                        <AlertDescription className="text-red-700">{apiError}</AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <div className="px-8 pt-6">
                      <TabsList className="grid w-full grid-cols-2 mb-6 bg-orange-100 p-1 rounded-lg">
                        <TabsTrigger
                          value="details"
                          className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
                        >
                          1. Organization Details
                        </TabsTrigger>
                        <TabsTrigger
                          value="settings"
                          className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
                        >
                          2. Business Settings
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <CardContent className="p-0">
                      {/* Step 1: Details */}
                      <TabsContent
                        value="details"
                        className="space-y-6 px-8 pb-8"
                      >
                        <DetailForm
                          organization={organization}
                          setOrganization={setOrganization}
                        />
                        <FormNavigation
                          onNext={() => setActiveTab("settings")}
                          disableNext={!isDetailsComplete}
                          showBack={false}
                        />
                      </TabsContent>
                      
                      {/* Step 2: Settings */}
                      <TabsContent
                        value="settings"
                        className="space-y-6 px-8 pb-8"
                      >
                        <SettingsForm
                          organization={organization}
                          setOrganization={setOrganization}
                        />
                        <FormNavigation
                          onBack={() => setActiveTab("details")}
                          submitButton
                          loading={loading}
                          disableSubmit={!isReadyToSubmit}
                        />
                      </TabsContent>
                    </CardContent>
                  </Tabs>
                </form>

                <CardFooter className="flex justify-between items-center border-t pt-6 pb-6 px-8 bg-orange-50">
                  <p className="text-sm text-orange-700">
                    © {new Date().getFullYear()} Dealio
                  </p>
                  <div className="flex space-x-4">
                    <a href="#" className="text-sm text-orange-700 hover:text-orange-900">Terms</a>
                    <a href="#" className="text-sm text-orange-700 hover:text-orange-900">Privacy</a>
                    <a href="#" className="text-sm text-orange-700 hover:text-orange-900">Help</a>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}