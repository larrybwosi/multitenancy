import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthContext } from "@/actions/auth";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

// Schema for query parameters
const QuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export async function GET(
  req: NextRequest,
) {
  try {
    // Get server context for authentication and authorization
    const { organizationId } = await getServerAuthContext();

    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, search, sortBy, sortOrder } =
      QuerySchema.parse(queryParams);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where condition for search
    const where: Prisma.RecurringExpenseWhereInput = {
      organizationId: organizationId,
    };

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" }} },
      ];
    }

    function isValidOrderByKey(
      key: string
    ): key is keyof Prisma.RecurringExpenseOrderByWithRelationInput {
      return key in Prisma.RecurringExpenseOrderByWithRelationInput;
    }
    // Build order by condition
    const orderBy: Prisma.RecurringExpenseOrderByWithRelationInput = {};
    if (sortBy && isValidOrderByKey(sortBy)) {
      orderBy[sortBy] = sortOrder || "asc";
    } else {
      orderBy.createdAt = "desc";
    }

    // Fetch recurring expenses
    const [expenses, total] = await Promise.all([
      db.recurringExpense.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          description: true,
          amount: true,
          category: true,
          frequency: true,
          nextDueDate: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.recurringExpense.count({ where }),
    ]);

    return NextResponse.json({
      expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching recurring expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring expenses" },
      { status: 500 }
    );
  }
}
