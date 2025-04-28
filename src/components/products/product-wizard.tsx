"use client"

import { CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: string
  title: string
  description: string
}

interface ProductWizardProps {
  steps: Step[]
  currentStep: number
  setCurrentStep: (step: number) => void
  errors: Record<string, any>
}

export function ProductWizard({ steps, currentStep, setCurrentStep, errors }: ProductWizardProps) {
  // Function to check if a step has errors
  const hasStepErrors = (stepId: string) => {
    switch (stepId) {
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

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">Product Setup</h3>
      <nav>
        <ol className="space-y-4">
          {steps.map((step, index) => {
            const isActive = currentStep === index
            const isCompleted = index < currentStep
            const hasErrors = hasStepErrors(step.id)

            return (
              <li key={step.id}>
                <button
                  type="button"
                  className={cn(
                    "flex items-center w-full text-left px-3 py-2 rounded-md transition-colors",
                    isActive && "bg-primary/10 text-primary",
                    isCompleted && !hasErrors && "text-primary",
                    !isActive && !isCompleted && "hover:bg-muted",
                  )}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className="mr-3">
                    {isCompleted && !hasErrors ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : hasErrors ? (
                      <Circle className="h-5 w-5 text-destructive" />
                    ) : (
                      <Circle className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
