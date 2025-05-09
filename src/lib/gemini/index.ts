'use server'

import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Gemini API client
let genAI: GoogleGenerativeAI | null = null

// Function to get or initialize the Gemini client
export function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined")
    }

    genAI = new GoogleGenerativeAI(apiKey)
  }

  return genAI
}
