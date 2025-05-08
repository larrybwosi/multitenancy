import { db } from "@/lib/db";
import { GeneratedReport, generateReportWithGeminiAPI, PrismaSalesData, ReportDataInput, ReportFilters } from "@/utils/sale-epense-reports";

export async function generateSalesReportAction(filters: ReportFilters): Promise<GeneratedReport | { error: string }> {
  try {
    const { organizationId, dateFrom, dateTo, customerId, memberId, locationId } = filters;

    // Fetch sales data using Prisma
    const salesData: PrismaSalesData[] = await db.sale.findMany({
      where: {
        organizationId,
        saleDate: {
          gte: dateFrom,
          lte: dateTo,
        },
        ...(customerId && { customerId }),
        ...(memberId && { memberId }), // Filter by sales person
        ...(locationId && { locationId }), // Filter by branch/location
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    category: true, // For category performance
                  },
                },
              },
            },
            stockBatch: true, // To potentially access batch-specific costs if SaleItem.unitCost is not definitive
          },
        },
        customer: true,
        member: {
          // Salesperson details
          include: {
            user: {
              select: { name: true, id: true, email: true }, // Select only needed user fields
            },
          },
        },
        location: true, // Branch/Location details
        organization: {
          // To get organization name if needed for prompt (though using ID for now)
          select: { name: true },
        },
        // Add other relations as required by the detailed prompt
      },
      orderBy: {
        saleDate: 'desc',
      },
    });

    if (!salesData || salesData.length === 0) {
      return { error: 'No sales data found for the given criteria. Cannot generate report.' };
    }

    // Prepare data for the Gemini API
    const reportInput: ReportDataInput = {
      organizationId, // or salesData[0].organization.name if fetched and preferred
      startDate: dateFrom.toISOString().split('T')[0],
      endDate: dateTo.toISOString().split('T')[0],
      data: salesData,
    };

    // Call the Gemini API to generate the report
    const report = await generateReportWithGeminiAPI('sales', reportInput);
    return report;
    //eslint-disable-next-line
  } catch (error: any) {
    console.error('Error in generateSalesReportAction:', error);
    return { error: `Failed to generate sales report: ${error.message}` };
  }
}
