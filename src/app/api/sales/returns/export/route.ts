import { NextResponse } from "next/server";
import { Prisma, ReturnStatus, ReturnReason } from '@/prisma/client';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") as ReturnStatus | undefined;
    const reason = searchParams.get("reason") as ReturnReason | undefined;
    const dateRange = searchParams.get("dateRange") || undefined;
    const format = searchParams.get("format") || "csv";

    // Calculate date range filters (same as in the main route)
    let dateFilter = {};
    if (dateRange) {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));

      switch (dateRange) {
        case "today":
          dateFilter = {
            gte: startOfDay,
            lte: endOfDay,
          };
          break;
        case "yesterday":
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          dateFilter = {
            gte: new Date(yesterday.setHours(0, 0, 0, 0)),
            lte: new Date(yesterday.setHours(23, 59, 59, 999)),
          };
          break;
        // ... other date ranges same as before
      }
    }

    // Build where clause
    const where = {
      AND: [
        search
          ? {
              OR: [
                { returnNumber: { contains: search, mode: "insensitive" } },
                { saleNumber: { contains: search, mode: "insensitive" } },
                { customerName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        status ? { status } : {},
        reason ? { reason } : {},
        Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      ],
    } as Prisma.ReturnWhereInput;

    // Get all returns matching the filters
    const returns = await prisma.return.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate CSV
    const headers = [
      "Return Number",
      "Sale Number",
      "Date",
      "Customer",
      "Items Count",
      "Total Amount",
      "Reason",
      "Status",
    ].join(",");

    const rows = returns.map((ret) =>
      [
        `"${ret.returnNumber}"`,
        `"${ret.saleNumber}"`,
        `"${ret.createdAt.toISOString()}"`,
        `"${ret.customerName}"`,
        ret.items.length,
        ret.totalAmount.toFixed(2),
        `"${ret.reason.replace("_", " ")}"`,
        `"${ret.status.replace("_", " ")}"`,
      ].join(",")
    );

    const csv = [headers, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=returns-export.csv",
      },
    });
  } catch (error) {
    console.error("Error exporting returns:", error);
    return NextResponse.json(
      { error: "Failed to export returns" },
      { status: 500 }
    );
  }
}
