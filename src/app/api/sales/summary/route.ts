import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerAuthContext } from "@/actions/auth";
import { Prisma } from "@/prisma/client";

export async function GET(request: Request) {
  try {
    const { organizationId } = await getServerAuthContext();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters for date filtering
    const dateRange = searchParams.get("dateRange") || undefined;
    
    // Calculate date range filters
    let dateFilter: { gte?: Date; lte?: Date } = {};
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
          const yesterdayStart = new Date(startOfDay);
          yesterdayStart.setDate(yesterdayStart.getDate() - 1);
          const yesterdayEnd = new Date(endOfDay);
          yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
          dateFilter = {
            gte: yesterdayStart,
            lte: yesterdayEnd,
          };
          break;
        case "this_week":
          const thisWeekStart = new Date(startOfDay);
          thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
          dateFilter = {
            gte: thisWeekStart,
            lte: endOfDay,
          };
          break;
        case "last_week":
          const lastWeekStart = new Date(startOfDay);
          lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
          const lastWeekEnd = new Date(startOfDay);
          lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay() - 1);
          lastWeekEnd.setHours(23, 59, 59, 999);
          dateFilter = {
            gte: lastWeekStart,
            lte: lastWeekEnd,
          };
          break;
        case "this_month":
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lte: endOfDay,
          };
          break;
        case "last_month":
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
          };
          break;
        case "this_year":
          dateFilter = {
            gte: new Date(now.getFullYear(), 0, 1),
            lte: endOfDay,
          };
          break;
        case "last_year":
          dateFilter = {
            gte: new Date(now.getFullYear() - 1, 0, 1),
            lte: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
          };
          break;
        default:
          // Default to all time if not specified
          break;
      }
    }

    // Build where clause
    const where = {
      organizationId,
      ...(Object.keys(dateFilter).length > 0 ? { saleDate: dateFilter } : {}),
    };

    // Get total sales amount and count
    const salesSummary = await prisma.sale.aggregate({
      where,
      _sum: {
        finalAmount: true,
        taxAmount: true,
        discountAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get total items sold
    const itemsSold = await prisma.saleItem.aggregate({
      where: {
        sale: where,
      },
      _sum: {
        quantity: true,
      },
    });

    // Get total unique customers
    const uniqueCustomers = await prisma.sale.groupBy({
      by: ['customerId'],
      where,
      _count: {
        customerId: true,
      },
      having: {
        customerId: {
          _count: {
            gt: 0,
          },
        },
      },
    });

    // Calculate total profit (assuming 30% profit margin)
    // In a real scenario, this would be calculated from actual cost data
    const totalSales = salesSummary._sum.finalAmount?.toNumber() || 0;
    const estimatedProfit = totalSales * 0.3;

    // Calculate average sale value
    const averageSaleValue = 
      salesSummary._count.id > 0 
        ? totalSales / salesSummary._count.id 
        : 0;

    // Calculate recent sales trend (compared to previous period)
    // This is a simplified approach
    const previousPeriodWhere: Prisma.SaleWhereInput = {
      organizationId,
    };
    
    // Only add date filter if we have both start and end dates
    if (dateFilter.gte && dateFilter.lte) {
      const timeDiff = dateFilter.lte.getTime() - dateFilter.gte.getTime();
      const previousPeriodStart = new Date(dateFilter.gte.getTime() - timeDiff);
      
      previousPeriodWhere.saleDate = {
        lt: dateFilter.gte,
        gte: previousPeriodStart,
      };
    }

    const previousPeriodSales = await prisma.sale.aggregate({
      where: previousPeriodWhere,
      _sum: {
        finalAmount: true,
      },
    });

    const previousPeriodTotal = previousPeriodSales._sum.finalAmount?.toNumber() || 0;
    const salesGrowth = previousPeriodTotal > 0 
      ? ((totalSales - previousPeriodTotal) / previousPeriodTotal) * 100
      : 0;

    return NextResponse.json({
      totalSales: totalSales,
      salesCount: salesSummary._count.id,
      totalTax: salesSummary._sum.taxAmount?.toNumber() || 0,
      totalDiscount: salesSummary._sum.discountAmount?.toNumber() || 0,
      totalProfit: estimatedProfit,
      itemsSold: itemsSold._sum.quantity || 0,
      uniqueCustomers: uniqueCustomers.length,
      averageSaleValue: averageSaleValue,
      salesGrowth: salesGrowth,
    });
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales summary" },
      { status: 500 }
    );
  }
} 