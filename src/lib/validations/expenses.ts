import { z } from 'zod';
import { ExpenseStatus, PaymentMethod } from '@/prisma/client';


// Helper schema for date validation
const dateSchema = z
  .union([z.date(), z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
  .transform(val => new Date(val));

// Create Expense Schema
export const CreateExpenseSchema = z
  .object({
    description: z.string().min(1, 'Description is required').max(255),
    amount: z.coerce.number().positive('Amount must be a positive number'),
    expenseDate: dateSchema,
    categoryId: z.string().min(1, 'Category ID is required'),
    paymentMethod: z.nativeEnum(PaymentMethod),
    receiptUrl: z.string().url('Invalid URL format').optional().nullable(),
    notes: z.string().optional().nullable(),
    isReimbursable: z.boolean().optional().default(false),
    locationId: z.string().cuid('Invalid location ID'),
    supplierId: z.string().cuid('Invalid supplier ID').optional().nullable(),
    purchaseId: z.string().cuid('Invalid purchase ID').optional().nullable(),
    budgetId: z.string().cuid('Invalid budget ID').optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
    taxAmount: z.coerce.number().min(0).optional().nullable(),
    mileage: z.number().min(0).optional().nullable(),
    isBillable: z.boolean().optional().default(false),
  })
  .strict();

  export type CreateExpense = z.infer<typeof CreateExpenseSchema>;
// Update Expense Status Schema
export const UpdateExpenseStatusSchema = z
  .object({
    expenseId: z.string().uuid('Invalid expense ID'),
    comments: z.string().optional().nullable(),
  })
  .strict();

// List Expenses Filter Schema
export const ListExpensesFilterSchema = z
  .object({
    status: z.nativeEnum(ExpenseStatus).optional(),
    memberId: z.string().uuid('Invalid member ID').optional(),
    approverId: z.string().uuid('Invalid approver ID').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    locationId: z.string().uuid('Invalid location ID').optional(),
    budgetId: z.string().uuid('Invalid budget ID').optional(),
    isReimbursable: z.boolean().optional(),
    isBillable: z.boolean().optional(),
    dateFrom: dateSchema.optional(),
    dateTo: dateSchema.optional(),
    tags: z.array(z.string()).optional(),
    skip: z.number().int().min(0).optional(),
    take: z.number().int().min(1).max(100).optional(),
  })
  .strict();

/**
 * Input type for filtering expenses list.
 */
export type ListExpensesFilter = {
    status?: ExpenseStatus;
    memberId?: string; // Filter by submitter
    approverId?: string; // Filter by approver
    categoryId?: string;
    locationId?: string;
    budgetId?: string;
    isReimbursable?: boolean;
    isBillable?: boolean;
    dateFrom?: Date | string;
    dateTo?: Date | string;
    tags?: string[]; // Filter by tags (contains any)
    // Add pagination options
    skip?: number;
    take?: number;
};
