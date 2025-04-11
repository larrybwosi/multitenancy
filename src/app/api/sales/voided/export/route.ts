import { NextResponse } from "next/server";
import { PaymentMethod } from "@prisma/client";
import prisma from "@/lib/db";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const search = searchParams.get("search") || undefined;
    const paymentMethod = searchParams.get("paymentMethod") as
      | PaymentMethod
      | undefined;
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
    

    // Get all voided sales matching the filters
    const sales = await prisma.sale.findMany({
      where: {
        AND: [
          { paymentStatus: "CANCELLED" },
          search
            ? {
                OR: [
                  { saleNumber: { contains: search, mode: "insensitive" } },
                  {
                    customer: {
                      name: { contains: search, mode: "insensitive" },
                    },
                  },
                ],
              }
            : {},
          paymentMethod ? { paymentMethod } : {},
          Object.keys(dateFilter).length > 0 ? { updatedAt: dateFilter } : {},
        ],
      },
      include: {
        customer: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Generate CSV
    const headers = [
      "Sale Number",
      "Original Date",
      "Voided Date",
      "Customer",
      "Amount",
      "Payment Method",
      "Void Reason",
    ].join(",");

    const rows = sales.map((sale) =>
      [
        `"${sale.saleNumber}"`,
        `"${sale.saleDate.toISOString()}"`,
        `"${sale.updatedAt.toISOString()}"`,
        `"${sale.customer?.name || "Walk-in"}"`,
        sale.finalAmount.toFixed(2),
        sale.paymentMethod,
        `"${sale.voidReason || ""}"`,
      ].join(",")
    );

    const csv = [headers, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=voided-sales-export.csv",
      },
    });
  } catch (error) {
    console.error("Error exporting voided sales:", error);
    return NextResponse.json(
      { error: "Failed to export voided sales" },
      { status: 500 }
    );
  }
}
