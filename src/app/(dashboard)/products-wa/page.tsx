"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, FormProvider } from "react-hook-form"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { AddProductSchema, type AddProductSchemaType } from "@/lib/schemas/product-schema"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ProductWizard } from "@/components/products/product-wizard"
import { ProductBasicInfo } from "@/components/products/product-basic-info"
import { ProductPricing } from "@/components/products/product-pricing"
import { ProductDimensions } from "@/components/products/product-dimensions"
import { ProductVariants } from "@/components/products/product-variants"
import { ProductSuppliers } from "@/components/products/product-suppliers"
import { ProductImages } from "@/components/products/product-images"
import { AddVariantModal } from "@/components/products/add-variant-modal"
import { AddSupplierModal } from "@/components/products/add-supplier-modal"

export default function AddProductPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps = [
    { id: "basic", title: "Basic Info", description: "Product name, SKU, and category" },
    { id: "images", title: "Images", description: "Upload product images" },
    { id: "pricing", title: "Pricing", description: "Set retail and wholesale prices" },
    { id: "dimensions", title: "Dimensions", description: "Product size and weight" },
    { id: "variants", title: "Variants", description: "Add product variations" },
    { id: "suppliers", title: "Suppliers", description: "Link product suppliers" },
  ]

  const form = useForm({
    resolver: zodResolver(AddProductSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      categoryId: "",
      basePrice: 0,
      baseCost: 0,
      wholesalePrice: 0,
      wholesaleMinQty: 1,
      reorderPoint: 5,
      isActive: true,
      imageUrls: [],
      baseUnit: "piece",
      sellingUnits: [{ unit: "piece", conversionFactor: 1, isDefault: true }],
      variants: [],
      suppliers: [],
    },
    mode: "onChange",
  })

  const { handleSubmit, formState, watch, setValue } = form
  const { errors, isValid } = formState

  const variants = watch("variants") || []
  const suppliers = watch("suppliers") || []
  const imageUrls = watch("imageUrls") || []

  const onSubmit = async (data: AddProductSchemaType) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      console.log("Submitting product data:", data)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast.success("Product added successfully", {
        description: `${data.name} has been added to your inventory.`,
      })

      // Redirect to products list
      router.push("/products")
    } catch (error) {
      console.error("Error adding product:", error)
      toast.error("Failed to add product", {
        description: "Please try again or contact support if the issue persists.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddVariant = (variant: any) => {
    setValue("variants", [...variants, variant])
    setIsVariantModalOpen(false)
    toast.success("Variant added", {
      description: `${variant.name} has been added to this product.`,
    })
  }

  const handleAddSupplier = (supplier: any) => {
    setValue("suppliers", [...suppliers, supplier])
    setIsSupplierModalOpen(false)
    toast.success("Supplier added", {
      description: `Supplier has been linked to this product.`,
    })
  }

  const handleRemoveVariant = (index: number) => {
    setValue(
      "variants",
      variants.filter((_, i) => i !== index),
    )
    toast.info("Variant removed")
  }

  const handleRemoveSupplier = (index: number) => {
    setValue(
      "suppliers",
      suppliers.filter((_, i) => i !== index),
    )
    toast.info("Supplier removed")
  }

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  // Check if current step has errors
  const hasCurrentStepErrors = () => {
    const currentStepId = steps[currentStep].id

    switch (currentStepId) {
      case "basic":
        return !!errors.name || !!errors.sku || !!errors.categoryId || !!errors.description || !!errors.barcode
      case "images":
        return !!errors.imageUrls
      case "pricing":
        return (
          !!errors.basePrice ||
          !!errors.baseCost ||
          !!errors.wholesalePrice ||
          !!errors.reorderPoint ||
          !!errors.baseUnit ||
          !!errors.sellingUnits
        )
      case "dimensions":
        return !!errors.width || !!errors.height || !!errors.length || !!errors.weight
      case "variants":
        return !!errors.variants
      case "suppliers":
        return !!errors.suppliers
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case "basic":
        return <ProductBasicInfo control={form.control} errors={errors} />
      case "images":
        return <ProductImages control={form.control} errors={errors} />
      case "pricing":
        return <ProductPricing control={form.control} errors={errors} />
      case "dimensions":
        return <ProductDimensions control={form.control} errors={errors} />
      case "variants":
        return (
          <ProductVariants
            variants={variants}
            onRemove={handleRemoveVariant}
            onAdd={() => setIsVariantModalOpen(true)}
          />
        )
      case "suppliers":
        return (
          <ProductSuppliers
            suppliers={suppliers}
            onRemove={handleRemoveSupplier}
            onAdd={() => setIsSupplierModalOpen(true)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
            <p className="text-muted-foreground">Create a new product in your inventory</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/products">Cancel</Link>
          </Button>
          {isLastStep && (
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || !isValid}>
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Product
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <FormProvider {...form}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="p-6">
              <ProductWizard steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} errors={errors} />
            </Card>
          </div>
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
                <p className="text-muted-foreground">{steps[currentStep].description}</p>
              </div>

              {renderStepContent()}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep} disabled={isFirstStep}>
                  Previous
                </Button>

                {!isLastStep ? (
                  <Button onClick={nextStep} disabled={hasCurrentStepErrors()}>
                    Next
                  </Button>
                ) : (
                  <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || !isValid}>
                    {isSubmitting ? "Saving..." : "Save Product"}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </FormProvider>

      <AddVariantModal open={isVariantModalOpen} onOpenChange={setIsVariantModalOpen} onAdd={handleAddVariant} />
      <AddSupplierModal open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen} onAdd={handleAddSupplier} />
    </div>
  )
}
