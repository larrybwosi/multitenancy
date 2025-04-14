"use client"

import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FormNavigationProps {
  onNext?: () => void
  onBack?: () => void
  disableNext?: boolean
  showBack?: boolean
  submitButton?: boolean
  loading?: boolean
  disableSubmit?: boolean
}

export function FormNavigation({
  onNext,
  onBack,
  disableNext = false,
  showBack = true,
  submitButton = false,
  loading = false,
  disableSubmit = false,
}: FormNavigationProps) {
  return (
    <div className="flex justify-between pt-6 border-t border-orange-200 mt-6">
      {showBack && onBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-900"
        >
          Back
        </Button>
      ) : (
        <div></div>
      )}

      {submitButton ? (
        <Button
          type="submit"
          disabled={loading || disableSubmit}
          className="min-w-[150px] bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Organization"
          )}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={disableNext}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md"
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

export default FormNavigation
