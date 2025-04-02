"use client"

import { useState } from "react"
import { Check, ChevronRight, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SetupLayout } from "./setup-layout"
import { BusinessTypeStep } from "./steps/business-type-step"
import { BusinessDetailsStep } from "./steps/business-details-step"
import { CategoryGenerationStep } from "./steps/category-generation-step"
import { CategoryReviewStep } from "./steps/category-review-step"
import CustomizationStep from "./steps/customization-step"
import { ModulesSelectionStep } from "./steps/modules-selection-step"
import { CompletionStep } from "./steps/completion-step"
import { useRouter } from "next/navigation"

export type BusinessType = {
  id: string
  name: string
  description: string
  icon?: React.ReactNode
  color?: string
  value?: string // Used for the API
}

export type BusinessDetails = {
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  email: string
  website?: string
  taxId?: string
  logoUrl?: string
  taxRate?: number
}

export type Category = {
  id?: number
  name: string
  description: string
  isCustom?: boolean
}

export type ModuleSelection = {
  id: string 
  name: string
  description: string
  isRequired?: boolean
  isActive: boolean
  value: string // Enum value for API
}

export type BusinessCustomization = {
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  receiptHeader?: string
  receiptFooter?: string 
  theme: string
  showFooter: boolean
  tableLayout?: Record<string, unknown> // For restaurant floor plans
  invoiceTemplate?: string
  customFields?: Record<string, unknown>
  fonts?: {
    heading?: string
    body?: string
  }
  logos?: {
    primary?: string
    secondary?: string
    favicon?: string
  }
  printOptions?: {
    includeLogo: boolean
    includeQrCode: boolean
    compactMode: boolean
  }
  notifications?: {
    lowStock: boolean
    newOrder: boolean
    customerBirthday: boolean
  }
  uiDensity?: "compact" | "comfortable" | "spacious"
  currencyFormat?: string
  dateFormat?: string
  timeFormat?: "12h" | "24h"
  languagePreference?: string
}

// Add two steps for customization and modules selection
const steps = [
  { id: "business-type", name: "Business Type" },
  { id: "business-details", name: "Business Details" },
  { id: "modules-selection", name: "Modules" },
  { id: "customization", name: "Customization" },
  { id: "category-generation", name: "Category Generation" },
  { id: "category-review", name: "Category Review" },
  { id: "completion", name: "Completion" },
]

export function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [businessType, setBusinessType] = useState<BusinessType | null>(null)
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    taxId: "",
    logoUrl: "",
    taxRate: 8,
  })
  
  // Default modules based on all business types
  const [modules, setModules] = useState<ModuleSelection[]>([
    { id: "pos", name: "Point of Sale", description: "Core POS functionality for sales and transactions", isRequired: true, isActive: true, value: "POS" },
    { id: "inventory", name: "Inventory Management", description: "Track and manage your inventory", isRequired: false, isActive: true, value: "INVENTORY" },
    { id: "customers", name: "Customer Management", description: "Manage customer information and history", isRequired: false, isActive: true, value: "CUSTOMERS" },
    { id: "reporting", name: "Reporting", description: "Sales and business reports", isRequired: false, isActive: true, value: "REPORTING" },
    { id: "supplier", name: "Supplier Management", description: "Manage suppliers and orders", isRequired: false, isActive: false, value: "SUPPLIER_MANAGEMENT" },
    { id: "employee", name: "Employee Management", description: "Manage staff, shifts and permissions", isRequired: false, isActive: false, value: "EMPLOYEE_MANAGEMENT" },
    { id: "accounting", name: "Accounting Integration", description: "Connect with accounting software", isRequired: false, isActive: false, value: "ACCOUNTING" },
    { id: "loyalty", name: "Loyalty Programs", description: "Reward your customers", isRequired: false, isActive: false, value: "LOYALTY" },
    { id: "ai_assistant", name: "AI Assistant", description: "AI-powered business insights and help", isRequired: false, isActive: false, value: "AI_ASSISTANT" },
    { id: "booking", name: "Booking & Appointments", description: "Schedule appointments and reservations", isRequired: false, isActive: false, value: "BOOKING" },
    { id: "rental", name: "Rental Management", description: "Track and manage rental items", isRequired: false, isActive: false, value: "RENTAL" },
  ])
  
  // Default customization with brand colors
  const [customization, setCustomization] = useState<BusinessCustomization>({
    primaryColor: "#4f46e5", // Default indigo
    secondaryColor: "#f97316", // Default orange
    accentColor: "#22c55e", // Default green
    theme: "DEFAULT",
    showFooter: true,
    receiptHeader: "",
    receiptFooter: "Thank you for your business!",
    invoiceTemplate: "DEFAULT",
    fonts: {
      heading: "Inter",
      body: "Inter"
    },
    printOptions: {
      includeLogo: true,
      includeQrCode: true,
      compactMode: false
    },
    notifications: {
      lowStock: true,
      newOrder: true,
      customerBirthday: false
    },
    uiDensity: "comfortable",
    currencyFormat: "KES",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    languagePreference: "en"
  })
  
  const [categoryDescription, setCategoryDescription] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBusinessTypeSelect = (type: BusinessType) => {
    setBusinessType(type)
    
    // Set default modules based on business type
    if (type.id) {
      // Update modules based on business type
      setModules(prevModules => {
        const updatedModules = [...prevModules]
        
        // Reset all non-required modules
        updatedModules.forEach(module => {
          if (!module.isRequired) {
            module.isActive = false
          }
        })
        
        // Activate specific modules based on business type
        switch (type.id) {
          case "restaurant":
            // Enable booking for table reservations, employee management, etc.
            updatedModules.find(m => m.id === "booking")!.isActive = true
            updatedModules.find(m => m.id === "employee")!.isActive = true
            break
          case "retail":
            // Enable supplier management, loyalty, etc.
            updatedModules.find(m => m.id === "supplier")!.isActive = true
            updatedModules.find(m => m.id === "loyalty")!.isActive = true
            break
          case "pharmacy":
            // Enable customer management, inventory
            updatedModules.find(m => m.id === "customers")!.isActive = true
            updatedModules.find(m => m.id === "inventory")!.isActive = true
            break
          case "salon":
            // Enable booking for appointments, employee management
            updatedModules.find(m => m.id === "booking")!.isActive = true
            updatedModules.find(m => m.id === "employee")!.isActive = true
            break
          case "hardware":
            // Enable rental management and supplier management
            updatedModules.find(m => m.id === "rental")!.isActive = true
            updatedModules.find(m => m.id === "supplier")!.isActive = true
            break
        }
        
        return updatedModules
      })
      
      // Set customization defaults based on business type
      switch (type.id) {
        case "restaurant":
          setCustomization({
            ...customization,
            primaryColor: "#ef4444", // Red
            secondaryColor: "#eab308", // Yellow
            invoiceTemplate: "RESTAURANT",
            tableLayout: { tables: [] }, // Initialize empty table layout
          })
          break
        case "retail":
          setCustomization({
            ...customization,
            primaryColor: "#3b82f6", // Blue
            secondaryColor: "#10b981", // Green
            invoiceTemplate: "RETAIL",
          })
          break
        case "pharmacy":
          setCustomization({
            ...customization,
            primaryColor: "#10b981", // Green
            secondaryColor: "#6366f1", // Indigo
            invoiceTemplate: "PHARMACY",
            customFields: { prescriptionTracking: true },
          })
          break
        case "salon":
          setCustomization({
            ...customization,
            primaryColor: "#8b5cf6", // Purple
            secondaryColor: "#ec4899", // Pink
            invoiceTemplate: "SERVICE",
          })
          break
      }
    }
  }

  const handleBusinessDetailsChange = (details: BusinessDetails) => {
    setBusinessDetails(details)
  }
  
  const handleModulesChange = (updatedModules: ModuleSelection[]) => {
    setModules(updatedModules)
  }
  
  const handleCustomizationChange = (customData: BusinessCustomization) => {
    setCustomization(customData)
  }

  const handleCategoryDescriptionChange = (description: string) => {
    setCategoryDescription(description)
  }

  const handleGenerateCategories = async () => {
    if (!businessType) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/setup/generate-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessType: businessType.name,
          businessDescription: businessDetails.name,
          categoryDescription,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate categories")
      }

      const data = await response.json()
      setCategories(data.categories)
      handleNext()
    } catch (error) {
      console.error("Error generating categories:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCategoryChange = (updatedCategories: Category[]) => {
    setCategories(updatedCategories)
  }

  const handleComplete = async () => {
    //remove the icon from the business type
    const business = {
      ...businessType,
      icon: undefined,
      id: undefined,
      color: undefined,
      value: businessType?.id?.toUpperCase() || businessType?.name?.toUpperCase()
    };
    
    setIsSubmitting(true);
    try {
      // Get active modules
      const activeModules = modules
        .filter(module => module.isActive)
        .map(module => module.value);
      
      // Get locations
      const locations = [
        {
          name: "Main Location",
          address: businessDetails.address,
          city: businessDetails.city,
          state: businessDetails.state,
          zipCode: businessDetails.zipCode,
          country: businessDetails.country,
          isDefault: true
        }
      ];
      
      const safeData = {
        businessType: business,
        businessDetails: JSON.parse(JSON.stringify(businessDetails)),
        categories: categories.map((category) => ({
          name: category.name,
          description: category.description,
        })),
        customizations: customization,
        locations: locations,
        activeModules: activeModules
      };
      
      console.log(safeData);

      const response = await fetch("/api/setup/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(safeData),
      });

      if (!response.ok) throw new Error("Failed to complete setup");

      const responseData = await response.json();
      console.log(responseData);

      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error("Error completing setup:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SetupLayout>
      <div className="flex items-center gap-3 mb-8">
        <Store className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">ClevPOS Setup Wizard</h1>
      </div>

      <div className="mb-10">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`text-xs font-medium ${index <= currentStep ? "text-primary" : "text-gray-400"}`}
            >
              {step.name}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="mb-10">
        {currentStep === 0 && <BusinessTypeStep selectedType={businessType} onSelect={handleBusinessTypeSelect} />}
        {currentStep === 1 && (
          <BusinessDetailsStep businessDetails={businessDetails} onChange={handleBusinessDetailsChange} />
        )}
        {currentStep === 2 && (
          <ModulesSelectionStep
            modules={modules}
            businessType={businessType}
            onChange={handleModulesChange}
          />
        )}
        {currentStep === 3 && (
          <CustomizationStep
            customization={customization}
            businessType={businessType}
            onChange={handleCustomizationChange}
            businessDetails={businessDetails}
          />
        )}
        {currentStep === 4 && (
          <CategoryGenerationStep
            businessType={businessType}
            description={categoryDescription}
            onDescriptionChange={handleCategoryDescriptionChange}
            onGenerate={handleGenerateCategories}
            isGenerating={isGenerating}
          />
        )}
        {currentStep === 5 && <CategoryReviewStep categories={categories} onChange={handleCategoryChange} />}
        {currentStep === 6 && (
          <CompletionStep 
            businessType={businessType} 
            businessDetails={businessDetails} 
            categories={categories}
            modules={modules.filter(m => m.isActive)}
            customization={customization}
          />
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || currentStep === steps.length - 1}>
          Back
        </Button>

        {currentStep < steps.length - 3 && (
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 0 && !businessType) ||
              (currentStep === 1 && (!businessDetails.name || !businessDetails.email))
            }
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {currentStep === 2 && (
          <Button onClick={handleNext}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        
        {currentStep === 3 && (
          <Button onClick={handleNext}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {currentStep === 4 && (
          <Button onClick={handleGenerateCategories} disabled={isGenerating || !categoryDescription}>
            {isGenerating ? "Generating..." : "Generate Categories"}
          </Button>
        )}

        {currentStep === 5 && (
          <Button onClick={handleComplete} disabled={isSubmitting || categories.length === 0}>
            {isSubmitting ? "Saving..." : "Complete Setup"}
          </Button>
        )}

        {currentStep === 6 && (
          <Button onClick={() => router.push("/")}>
            Go to Dashboard <Check className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </SetupLayout>
  )
}

