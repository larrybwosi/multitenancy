import { NextResponse } from "next/server"
import { getDesignRecommendations } from "@/lib/gemini"
import type { BusinessType, BusinessDetails } from "@/components/setup/setup-wizard"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { businessType, businessDetails } = body
    
    if (!businessType) {
      return NextResponse.json(
        { error: "Business type is required" },
        { status: 400 }
      )
    }
    
    // Call the Gemini API to get recommendations
    const recommendations = await getDesignRecommendations(
      businessType as BusinessType,
      businessDetails as BusinessDetails
    )
    
    // Return the recommendations
    return NextResponse.json(recommendations)
  } catch (error) {
    console.error("Error getting recommendations:", error)
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    )
  }
} 