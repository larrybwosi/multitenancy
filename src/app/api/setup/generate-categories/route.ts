import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { businessType, businessDescription, categoryDescription } = await request.json()

    if (!businessType || !categoryDescription) {
      return NextResponse.json({ error: "Business type and category description are required" }, { status: 400 })
    }

    // Create a prompt for Gemini
    const prompt = `
      Generate a list of product categories for a ${businessType} business.
      
      Business description: ${businessDescription || "Not provided"}
      Additional details: ${categoryDescription}
      
      Please provide 5-10 categories that would be appropriate for this business.
      For each category, include a short description.
      
      Format the response as a JSON array with objects containing 'name' and 'description' fields.
      Example:
      [
        {
          "name": "Category Name",
          "description": "Brief description of the category"
        }
      ]
    `

    // Generate categories using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s)

    if (!jsonMatch) {
      console.error("Failed to parse Gemini response:", text)
      return NextResponse.json({ error: "Failed to generate categories" }, { status: 500 })
    }

    try {
      const categories = JSON.parse(jsonMatch[0])
      return NextResponse.json({ categories })
    } catch (error) {
      console.error("Error parsing JSON:", error)
      return NextResponse.json({ error: "Failed to parse generated categories" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error generating categories:", error)
    return NextResponse.json({ error: "An error occurred while generating categories" }, { status: 500 })
  }
}

