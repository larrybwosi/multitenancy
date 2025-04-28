"use client"

import { X } from "lucide-react"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface TourStep {
  title: string
  description: string
  target: string
  position: "top" | "right" | "bottom" | "left"
}

const TOUR_STEPS: Record<string, TourStep[]> = {
  "/dashboard": [
    {
      title: "Welcome to your Dashboard",
      description:
        "This is your main overview of warehouse operations. You can see key metrics and recent activities here.",
      target: "h1",
      position: "bottom",
    },
    {
      title: "Warehouse Overview",
      description: "Check the status and capacity of your warehouses at a glance.",
      target: ".warehouse-overview",
      position: "right",
    },
    {
      title: "Inventory Overview",
      description: "Monitor your most critical inventory items and their stock levels.",
      target: ".inventory-overview",
      position: "left",
    },
  ],
  "/warehouses": [
    {
      title: "Warehouse Management",
      description: "Here you can view and manage all your warehouses.",
      target: "h1",
      position: "bottom",
    },
    {
      title: "Add New Warehouse",
      description: "Click here to add a new warehouse to your system.",
      target: "a[href='/warehouses/new']",
      position: "left",
    },
  ],
  "/inventory": [
    {
      title: "Inventory Management",
      description: "Here you can view and manage all your inventory items.",
      target: "h1",
      position: "bottom",
    },
    {
      title: "Stock Status",
      description:
        "Items are color-coded by their stock status: green for in stock, amber for low stock, and red for critical.",
      target: ".inventory-list",
      position: "top",
    },
  ],
}

export function WelcomeTour() {
  const pathname = usePathname()
  const [showTour, setShowTour] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const steps = TOUR_STEPS[pathname] || []

  useEffect(() => {
    // Check if user has seen the tour before
    const hasTourBeenSeen = localStorage.getItem(`tour-seen-${pathname}`)
    if (hasTourBeenSeen) {
      setShowTour(false)
      return
    }

    if (steps.length > 0) {
      const step = steps[currentStep]
      const element = document.querySelector(step.target) as HTMLElement
      
      if (element) {
        setTargetElement(element)
        const rect = element.getBoundingClientRect()
        
          {
        setTargetElement(element)
        const rect = element.getBoundingClientRect()
        
        // Calculate position based on the step's position preference
        let top = 0
        let left = 0
        
        switch (step.position) {
          case "top":
            top = rect.top - 10
            left = rect.left + rect.width / 2 - 150
            break
          case "right":
            top = rect.top + rect.height / 2 - 100
            left = rect.right + 10
            break
          case "bottom":
            top = rect.bottom + 10
            left = rect.left + rect.width / 2 - 150
            break
          case "left":
            top = rect.top + rect.height / 2 - 100
            left = rect.left - 310
            break
        }
        
        // Ensure the tooltip stays within viewport
        if (left < 10) left = 10
        if (left > window.innerWidth - 310) left = window.innerWidth - 310
        if (top < 10) top = 10
        if (top > window.innerHeight - 200) top = window.innerHeight - 200
        
        setPosition({ top, left })
      }
    }
    
    // Reset tour when pathname changes
    setCurrentStep(0)
  }
  }, [pathname, currentStep, steps])
  
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleCloseTour()
    }
  }
  
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleCloseTour = () => {
    setShowTour(false)
    localStorage.setItem(`tour-seen-${pathname}`, "true")
  }
  
  if (!showTour || steps.length === 0) return null
  
  const step = steps[currentStep]
  
  return (
    <div 
      className="fixed z-50 animate-fade-in" 
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        width: "300px"
      }}
    >
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{step.title}</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleCloseTour} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrevStep}>
                Previous
              </Button>
            )}
            <Button size="sm" onClick={handleNextStep}>
              {currentStep < steps.length - 1 ? "Next" : "Finish"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
