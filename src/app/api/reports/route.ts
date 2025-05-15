import { getServerAuthContext } from "@/actions/auth";
import { generateSalesReportAction } from "@/actions/reports/sales";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { organizationId} = await getServerAuthContext()
  const response = await generateSalesReportAction({
    dateFrom: new Date('2025-01-15T12:26:08.433Z'),
    dateTo: new Date('2025-05-15T12:26:08.433Z'),
    organizationId,
  });
  console.log(response)
  return NextResponse.json(response)
}