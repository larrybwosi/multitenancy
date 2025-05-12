import { NextResponse } from "next/server";
import { ReturnStatus, ReturnReason, Prisma } from "@/prisma/client";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status") as ReturnStatus | undefined;
    const reason = searchParams.get("reason") as ReturnReason | undefined;
    const dateRange = searchParams.get("dateRange") || undefined;

    // Calculate date range filters
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
        case "this_week":
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          dateFilter = {
            gte: new Date(startOfWeek.setHours(0, 0, 0, 0)),
            lte: endOfDay,
          };
          break;
        case "last_week":
          const lastWeekStart = new Date();
          lastWeekStart.setDate(
            lastWeekStart.getDate() - lastWeekStart.getDay() - 7
          );
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
          dateFilter = {
            gte: new Date(lastWeekStart.setHours(0, 0, 0, 0)),
            lte: new Date(lastWeekEnd.setHours(23, 59, 59, 999)),
          };
          break;
        case "this_month":
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lte: new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              0,
              23,
              59,
              59,
              999
            ),
          };
          break;
        case "last_month":
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            lte: new Date(
              now.getFullYear(),
              now.getMonth(),
              0,
              23,
              59,
              59,
              999
            ),
          };
          break;
        case "this_year":
          dateFilter = {
            gte: new Date(now.getFullYear(), 0, 1),
            lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
          };
          break;
        case "last_year":
          dateFilter = {
            gte: new Date(now.getFullYear() - 1, 0, 1),
            lte: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
          };
          break;
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
        status ? { status: ReturnStatus[status] } : {},
        reason ? { reason: ReturnReason[reason] } : {},
        Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      ],
    } as Prisma.ReturnWhereInput;

    // Get total count for pagination
    const totalCount = await prisma.return.count({ where });

    // Get paginated returns
    const returns = await prisma.return.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      returns,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 }
    );
  }
}
