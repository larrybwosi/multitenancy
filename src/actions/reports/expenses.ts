import { db } from "@/lib/db";
import { GeneratedReport, generateReportWithGeminiAPI, PrismaExpensesData, ReportDataInput, ReportFilters } from "@/utils/sale-epense-reports";

export async function generateExpensesReportAction(
  filters: ReportFilters
): Promise<GeneratedReport | { error: string }> {
  try {
    const { organizationId, dateFrom, dateTo, categoryId, memberId, locationId, supplierId } = filters;

    const expensesData: PrismaExpensesData[] = await db.expense.findMany({
      where: {
        organizationId,
        expenseDate: {
          gte: dateFrom,
          lte: dateTo,
        },
        ...(categoryId && { categoryId }), // Filter by expense category
        ...(memberId && { memberId }), // Filter by member who submitted
        ...(locationId && { locationId }), // Filter by location
        ...(supplierId && { supplierId }), // Filter by supplier
      },
      include: {
        category: true, // Expense category details
        member: {
          // Submitter details
          include: {
            user: {
              select: { name: true, id: true, email: true },
            },
          },
        },
        approver: {
          // Approver details
          include: {
            user: {
              select: { name: true, id: true, email: true },
            },
          },
        },
        location: true, // Location of expense
        supplier: true, // Supplier details
        budget: true, // Budget details if linked
        attachments: {
          // For compliance checks on receipts
          select: { fileUrl: true, fileName: true, mimeType: true },
        },
        organization: {
          // To get organization name if needed for prompt
          select: { name: true },
        },
        // Add other relations as required by the detailed prompt
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });

    if (!expensesData || expensesData.length === 0) {
      return { error: 'No expenses data found for the given criteria. Cannot generate report.' };
    }

    const reportInput: ReportDataInput = {
      organizationId, // or expensesData[0].organization.name if fetched and preferred
      startDate: dateFrom.toISOString().split('T')[0],
      endDate: dateTo.toISOString().split('T')[0],
      data: expensesData,
    };

    // Call the Gemini API to generate the report
    const report = await generateReportWithGeminiAPI('expenses', reportInput);
    return report;
    //eslint-disable-next-line
  } catch (error: any) {
    console.error('Error in generateExpensesReportAction:', error);
    return { error: `Failed to generate expenses report: ${error.message}` };
  }
}
