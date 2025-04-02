'use server'

import { GoogleGenerativeAI } from "@google/generative-ai"
import type { BusinessType, BusinessDetails, BusinessCustomization } from "@/components/setup/setup-wizard"

// Initialize the Gemini API client
let genAI: GoogleGenerativeAI | null = null

// Function to get or initialize the Gemini client
function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined")
    }

    genAI = new GoogleGenerativeAI(apiKey)
  }

  return genAI
}

/**
 * Get design recommendations for a business based on its type and details
 */
export async function getDesignRecommendations(
  businessType: BusinessType, 
  businessDetails?: BusinessDetails
): Promise<Partial<BusinessCustomization>> {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    const prompt = `
    Generate design and customization recommendations for a ${businessType.name} business called "${businessDetails?.name || 'New Business'}".
    
    The business is in the ${businessType.name} industry. Use this information to suggest a color palette and design that would appeal to their target audience.
    
    Please provide the following in JSON format:
    - primaryColor: A hex color code for the main brand color
    - secondaryColor: A hex color code for the secondary brand color
    - accentColor: A hex color code for accent elements
    - fonts: { heading: "Font name for headings", body: "Font name for body text" }
    - theme: A theme name (choose from: "DEFAULT", "LIGHT", "DARK", or any of these business-specific themes if applicable: "RESTAURANT_MODERN", "RESTAURANT_CLASSIC", "RETAIL_ELEGANT", "RETAIL_MINIMAL", "SALON_LUXURY", "SALON_MODERN")
    - invoiceTemplate: A template name (choose from: "DEFAULT", "RESTAURANT", "RESTAURANT_DETAILED", "RETAIL", "RETAIL_DETAILED", "PHARMACY", "PRESCRIPTION", "SERVICE", "APPOINTMENT")
    
    Return ONLY the JSON object with these fields, nothing else.
    `

    const result = await model.generateContent(prompt)
    const response = result.response.text()
    
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : response
      
      // Parse the JSON
      const recommendations = JSON.parse(jsonStr)
      
      // Add default values for any missing fields
      const defaultSettings = getDefaultRecommendations(businessType)
      
      return {
        ...defaultSettings,
        ...recommendations,
        // Ensure notifications and printOptions are preserved
        notifications: {
          ...defaultSettings.notifications,
          ...(recommendations.notifications || {})
        },
        printOptions: {
          ...defaultSettings.printOptions,
          ...(recommendations.printOptions || {})
        }
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError)
      return getDefaultRecommendations(businessType)
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return getDefaultRecommendations(businessType)
  }
}

// Fallback function with default recommendations based on business type
function getDefaultRecommendations(businessType: BusinessType): Partial<BusinessCustomization> {
  if (businessType.id === "restaurant") {
    return {
      primaryColor: "#8B4513", // Brown
      secondaryColor: "#FF6347", // Tomato
      accentColor: "#FFD700", // Gold
      theme: "RESTAURANT_MODERN",
      fonts: { heading: "Poppins", body: "Open Sans" },
      invoiceTemplate: "RESTAURANT",
      notifications: {
        lowStock: true,
        newOrder: true,
        customerBirthday: false,
      },
      printOptions: {
        includeLogo: true,
        includeQrCode: true,
        compactMode: false,
      },
    }
  } else if (businessType.id === "retail") {
    return {
      primaryColor: "#2C3E50", // Dark blue
      secondaryColor: "#E74C3C", // Red
      accentColor: "#F1C40F", // Yellow
      theme: "RETAIL_ELEGANT",
      fonts: { heading: "Montserrat", body: "Roboto" },
      invoiceTemplate: "RETAIL",
      notifications: {
        lowStock: true,
        newOrder: true,
        customerBirthday: true,
      },
      printOptions: {
        includeLogo: true,
        includeQrCode: true,
        compactMode: false,
      },
    }
  } else if (businessType.id === "salon") {
    return {
      primaryColor: "#663399", // Purple
      secondaryColor: "#FF69B4", // Pink
      accentColor: "#20B2AA", // Light Sea Green
      theme: "SALON_LUXURY",
      fonts: { heading: "Poppins", body: "Lato" },
      invoiceTemplate: "SERVICE",
      notifications: {
        lowStock: true,
        newOrder: true,
        customerBirthday: true,
      },
      printOptions: {
        includeLogo: true,
        includeQrCode: false,
        compactMode: false,
      },
    }
  } else {
    return {
      primaryColor: "#3498DB", // Blue
      secondaryColor: "#2ECC71", // Green
      accentColor: "#E67E22", // Orange
      theme: "DEFAULT",
      fonts: { heading: "Inter", body: "Inter" },
      invoiceTemplate: "DEFAULT",
      notifications: {
        lowStock: true,
        newOrder: true,
        customerBirthday: false,
      },
      printOptions: {
        includeLogo: true,
        includeQrCode: false,
        compactMode: false,
      },
    }
  }
} 