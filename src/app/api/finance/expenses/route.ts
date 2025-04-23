import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthContext } from "@/actions/auth";
import { db } from "@/lib/db";

// Schema for query parameters
const QuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  category: z.string().optional(),
  department: z.string().optional(),
  vendor: z.string().optional(),
  approvalStatus: z.string().optional(),
  taxDeductible: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isRecurring: z.string().optional(),
});

// --- POST: Create Expense (including recurring) ---
const CreateExpenseSchema = z.object({
  description: z.string().min(3),
  amount: z.number().positive(),
  category: z.string().min(1),
  date: z.string(),
  paymentMethod: z.string().min(1),
  vendor: z.string().min(1),
  department: z.string().min(1),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
  recurringEndDate: z.string().optional().nullable(),
  taxDeductible: z.boolean().default(false),
  taxCategory: z.string().optional(),
  project: z.string().optional(),
  costCenter: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await getServerAuthContext();
    const body = await req.json();
    const data = CreateExpenseSchema.parse(body);

    if (data.isRecurring) {
      // Create RecurringExpense
      const recurring = await db.recurringExpense.create({
        data: {
          description: data.description,
          amount: data.amount,
          category: { connect: { name: data.category } },
          paymentMethod: data.paymentMethod,
          frequency: data.recurringFrequency?.toUpperCase() || 'MONTHLY',
          startDate: new Date(data.date),
          endDate: data.recurringEndDate ? new Date(data.recurringEndDate) : null,
          isActive: true,
          organization: { connect: { id: organizationId } },
          // Optionally connect vendor, department, etc.
          ...(data.vendor && { vendor: { connect: { name: data.vendor } } }),
          ...(data.department && { department: { connect: { name: data.department } } }),
          ...(data.taxDeductible !== undefined && { taxDeductible: data.taxDeductible }),
          ...(data.taxCategory && { taxCategory: { connect: { name: data.taxCategory } } }),
        },
      });
      return NextResponse.json({ recurringExpense: recurring });
    } else {
      // Create normal Expense
      const expense = await db.expense.create({
        data: {
          description: data.description,
          amount: data.amount,
          expenseDate: new Date(data.date),
          category: { connect: { name: data.category } },
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          organization: { connect: { id: organizationId } },
          // Optionally connect vendor, department, etc.
          ...(data.vendor && { vendor: { connect: { name: data.vendor } } }),
          ...(data.department && { department: { connect: { name: data.department } } }),
          ...(data.taxDeductible !== undefined && { taxDeductible: data.taxDeductible }),
          ...(data.taxCategory && { taxCategory: { connect: { name: data.taxCategory } } }),
        },
      });
      return NextResponse.json({ expense });
    }
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get server context for authentication and authorization
    const { organizationId } = await getServerAuthContext();

    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, search, sortBy, sortOrder, category, department, vendor, approvalStatus, taxDeductible, startDate, endDate, isRecurring } = QuerySchema.parse(queryParams);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build where condition for search
    type ExpenseWhereInput = Parameters<typeof db.expense.findMany>[0]['where'];
    type RecurringExpenseWhereInput = Parameters<typeof db.recurringExpense.findMany>[0]['where'];
    let where: ExpenseWhereInput | RecurringExpenseWhereInput = { organizationId };
    if (search) {
      where = {
        ...where,
        OR: [
          { description: { contains: search, mode: "insensitive" } },
        ],
      };
    }
    if (category && category !== "all") where = { ...where, category: { name: category } };
    if (department && department !== "all") where = { ...where, department };
    if (vendor && vendor !== "all") where = { ...where, vendor };
    if (approvalStatus && approvalStatus !== "all") where = { ...where, status: approvalStatus };
    if (taxDeductible && taxDeductible !== "all") where = { ...where, taxDeductible: taxDeductible === "true" };
    if (startDate) where = { ...where, expenseDate: { ...(where['expenseDate'] || {}), gte: new Date(startDate) } };
    if (endDate) where = { ...where, expenseDate: { ...(where['expenseDate'] || {}), lte: new Date(endDate) } };

    let orderBy: Record<string, any> = { createdAt: "desc" };
    if (sortBy && sortOrder) orderBy = { [sortBy]: sortOrder };

    let expenses = [];
    let total = 0;
    if (isRecurring === "true") {
      // RecurringExpense
      [expenses, total] = await Promise.all([
        db.recurringExpense.findMany({
          where: where as RecurringExpenseWhereInput,
          skip,
          take: limit,
          orderBy,
        }),
        db.recurringExpense.count({ where: where as RecurringExpenseWhereInput }),
      ]);
    } else {
      // Normal Expense
      [expenses, total] = await Promise.all([
        db.expense.findMany({
          where: where as ExpenseWhereInput,
          skip,
          take: limit,
          orderBy,
        }),
        db.expense.count({ where: where as ExpenseWhereInput }),
      ]);
    }

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
