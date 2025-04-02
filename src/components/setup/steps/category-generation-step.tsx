"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Sparkles } from "lucide-react"
import type { BusinessType } from "../setup-wizard"

interface CategoryGenerationStepProps {
  businessType: BusinessType | null
  description: string
  onDescriptionChange: (description: string) => void
  onGenerate: () => void
  isGenerating: boolean
}

export function CategoryGenerationStep({
  businessType,
  description,
  onDescriptionChange,
  onGenerate,
  isGenerating,
}: CategoryGenerationStepProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Generate Product Categories</h2>
      <p className="text-gray-600 mb-6">
        We&apos;ll use AI to generate product categories based on your business type and description. Provide additional
        details to help create more accurate categories.
      </p>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          The more specific your description, the better the generated categories will match your business needs.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="business-description">Business Description</Label>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <Textarea
            id="business-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={`Describe your ${businessType?.name || "business"} in detail. Include the types of products you sell, your target audience, and any specific categories you'd like to include.`}
            className="min-h-[150px]"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Example Description</h3>
          <p className="text-sm text-gray-600">
            {businessType?.id === "retail" &&
              "We're a general retail store specializing in home goods, kitchenware, and small appliances. We also carry seasonal items like holiday decorations and outdoor furniture during summer. Our target audience is homeowners aged 25-55."}
            {businessType?.id === "restaurant" &&
              "We're a casual dining restaurant serving Italian cuisine. Our menu includes appetizers, pasta dishes, pizzas, main courses, desserts, and beverages. We also offer a kids menu and have daily specials."}
            {businessType?.id === "coffee-shop" &&
              "We're a specialty coffee shop offering various coffee drinks, teas, and pastries. We also sell coffee beans, brewing equipment, and merchandise. We have seasonal menu items and cater to both coffee enthusiasts and casual customers."}
            {businessType?.id === "fashion" &&
              "We're a boutique clothing store focusing on women's fashion. We carry casual wear, formal attire, accessories, and footwear. We also have a small section for seasonal items and limited designer collections."}
            {businessType?.id === "salon" &&
              "We're a full-service hair salon offering haircuts, coloring, styling, and treatments. We also sell professional hair care products, styling tools, and accessories. We serve both men and women of all ages."}
            {businessType?.id === "pharmacy" &&
              "We're an independent pharmacy offering prescription medications, over-the-counter drugs, health supplements, personal care items, and medical supplies. We also have a small section for convenience items and seasonal health products."}
            {businessType?.id === "bookstore" &&
              "We're an independent bookstore specializing in fiction, non-fiction, children's books, and educational materials. We also carry stationery, gifts, and local artisan products. We host regular book clubs and author events."}
            {businessType?.id === "hardware" &&
              "We're a neighborhood hardware store offering tools, building materials, plumbing supplies, electrical components, paint, and garden supplies. We cater to both DIY homeowners and professional contractors."}
            {businessType?.id === "custom" &&
              "Describe your business in detail. Include the types of products or services you offer, your target audience, and any specific categories you'd like to include."}
          </p>
        </div>
      </div>
    </div>
  )
}

