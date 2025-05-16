import { getServerAuthContext } from "@/actions/auth"
import { generateSalesReportAction } from "@/actions/reports/sales"
import MarkdownToPdfDocument from "@/utils/prompts/pdf"
import { renderToStream } from "@react-pdf/renderer"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get("dateFrom") || "last-30-days"
  const dataTo = searchParams.get("dataTo") || "overview"
  
    const { organizationId} = await getServerAuthContext()
    const response = await generateSalesReportAction({
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dataTo),
      organizationId,
    });

    if(!response || response.error){
      return new NextResponse('Failed to generate')
    }
  const stream = await renderToStream(<MarkdownToPdfDocument markdownString={response.content} documentTitle="Sales Performance Report" />)
  return new NextResponse(stream as unknown as ReadableStream)
}
