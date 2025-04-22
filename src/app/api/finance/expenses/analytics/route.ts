import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthContext } from "@/actions/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Schema for query parameters
const QuerySchema = z.object({
  timeframe: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]).default("monthly"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  year: z.string().default(new Date().getFullYear().toString()),
  limit: z.coerce.number().default(1000),
});

export async function GET(req: NextRequest) {
  try {
    // Get authentication context to retrieve organizationId
    const { organizationId } = await getServerAuthContext();

    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { timeframe, startDate, endDate, year, limit } = QuerySchema.parse(queryParams);

    // Build where condition for date filtering
    const where: Prisma.ExpenseWhereInput = {
      organizationId,
    };

    // Date filtering logic
    if (startDate && endDate) {
      // Use explicit date range if provided
      where.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      // Otherwise filter by year and apply timeframe logic
      const currentYear = parseInt(year);
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

      where.expenseDate = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    // Fetch expenses with related category data
    const expenses = await db.expense.findMany({
      where,
      take: limit,
      select: {
        id: true,
        expenseNumber: true,
        description: true,
        amount: true,
        expenseDate: true,
        paymentMethod: true,
        status: true,
        isReimbursable: true,
        tags: true,
        isBillable: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        member: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        expenseDate: "desc",
      },
    });

    // Transform data for analytics
    const formattedExpenses = expenses.map(expense => ({
      id: expense.id,
      date: expense.expenseDate.toISOString(),
      amount: parseFloat(expense.amount.toString()),
      category: expense.category.name,
      department: expense.location?.name || "Unassigned",
      description: expense.description,
      status: expense.status,
      // Add additional formatted data as needed
    }));

    return NextResponse.json({
      expenses: formattedExpenses,
      metadata: {
        timeframe,
        year,
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0),
      }
    });
  } catch (error) {
    console.error("Error fetching expenses for analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses for analytics" },
      { status: 500 }
    );
  }
} 