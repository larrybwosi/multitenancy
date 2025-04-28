import type { Metadata } from "next"
import AssistantPageClient from "./assistant-page-client"

export const metadata: Metadata = {
  title: "AI Assistant | Modern POS System",
  description: "Get help and answers about using the POS system with our AI assistant powered by Google Gemini.",
}

export default function AssistantPage() {
  return <AssistantPageClient />
}

