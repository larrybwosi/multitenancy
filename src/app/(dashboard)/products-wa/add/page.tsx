"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowLeft, Plus, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { AddProductSchema, type AddProductSchemaType } from "@/lib/schemas/product-schema"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormWrapper } from "@/components/form-provider"
import { ProductBasicInfo } from "@/components/products/product-basic-info"
import { ProductPricing } from "@/components/products/product-pricing"
import { ProductDimensions } from "@/components/products/product-dimensions"
import { ProductVariants } from "@/components/products/product-variants"
import { ProductSuppliers } from "@/components/products/product-suppliers"
import { ProductImages } from "@/components/products/product-images"
import { AddVariantModal } from "@/components/products/add-variant-modal"
import { AddSupplierModal } from "@/components/products/add-supplier-modal"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AddProductPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      reorderPoint: 5,
      isActive: true,
      imageUrls: [],
      variants: [],
      suppliers: [],
    },
  })

  const { handleSubmit, formState, control, setValue, watch } = form
  const { errors } = formState

  const variants = watch("variants") || []
  const suppliers = watch("suppliers") || []

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
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
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
        </div>
      </div>

      <FormWrapper methods={form}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <ScrollArea className="w-full">
                  <TabsList className="w-full justify-start px-4 pt-2">
                    <TabsTrigger value="basic" className="relative">
                      Basic Info
                      {Object.keys(errors).some((key) =>
                        ["name", "description", "sku", "barcode", "categoryId"].includes(key),
                      ) && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />}
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="relative">
                      Pricing
                      {Object.keys(errors).some((key) => ["basePrice", "baseCost", "reorderPoint"].includes(key)) && (
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="dimensions" className="relative">
                      Dimensions
                      {Object.keys(errors).some((key) => ["width", "height", "length", "weight"].includes(key)) && (
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="variants" className="relative">
                      Variants ({variants.length})
                      {errors.variants && (
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="suppliers" className="relative">
                      Suppliers ({suppliers.length})
                      {errors.suppliers && (
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
                      )}
                    </TabsTrigger>
                  </TabsList>
                </ScrollArea>

                <TabsContent value="basic" className="p-6 animate-fade-in">
                  <ProductBasicInfo control={control} errors={errors} />
                </TabsContent>

                <TabsContent value="pricing" className="p-6 animate-fade-in">
                  <ProductPricing control={control} errors={errors} />
                </TabsContent>

                <TabsContent value="dimensions" className="p-6 animate-fade-in">
                  <ProductDimensions control={control} errors={errors} />
                </TabsContent>

                <TabsContent value="variants" className="p-6 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Product Variants</h3>
                    <Button onClick={() => setIsVariantModalOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variant
                    </Button>
                  </div>
                  <ProductVariants variants={variants} onRemove={handleRemoveVariant} />
                </TabsContent>

                <TabsContent value="suppliers" className="p-6 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Product Suppliers</h3>
                    <Button onClick={() => setIsSupplierModalOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Supplier
                    </Button>
                  </div>
                  <ProductSuppliers suppliers={suppliers} onRemove={handleRemoveSupplier} />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Product Images</h3>
              <ProductImages control={control} errors={errors} />
            </Card>
          </div>
        </div>
      </FormWrapper>

      <AddVariantModal open={isVariantModalOpen} onOpenChange={setIsVariantModalOpen} onAdd={handleAddVariant} />

      <AddSupplierModal open={isSupplierModalOpen} onOpenChange={setIsSupplierModalOpen} onAdd={handleAddSupplier} />
    </div>
  )
}
