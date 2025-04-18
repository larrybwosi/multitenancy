import type { Metadata } from "next"
import { DocumentationPage } from "@/components/organization/documentation/documentation-page"

export const metadata: Metadata = {
  title: "Organization Documentation",
  description: "Comprehensive documentation for the organization administration system",
}

export default function DocumentationPageRoute() {
  return <DocumentationPage />
}
