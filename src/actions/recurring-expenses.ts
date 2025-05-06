'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getServerAuthContext } from './auth';
import prisma from '@/lib/db';
import { Prisma } from '@/prisma/client';

// Schema for query parameters
const QueryParamsSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type RecurringExpensesParams = z.infer<typeof QueryParamsSchema>;

export async function getRecurringExpenses(params: RecurringExpensesParams = {}) {
  try {
    const { organizationId } = await getServerAuthContext();

    // Parse and validate query parameters
    const { page, limit, search, sortBy, sortOrder } = QueryParamsSchema.parse(params);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build where condition for search
    const where: Prisma.RecurringExpenseWhereInput = {
      organizationId,
    };
    
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Build order by condition
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }
    
    // Fetch recurring expenses
    const [expenses, total] = await Promise.all([
      prisma.recurringExpense.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          description: true,
          amount: true,
          currency: true,
          category: true,
          frequency: true,
          nextDueDate: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.recurringExpense.count({ where }),
    ]);
    
    return {
      expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
    
  } catch (error) {
    console.error('Error fetching recurring expenses:', error);
    throw new Error('Failed to fetch recurring expenses');
  }
}

const CreateExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  category: z.string(),
  frequency: z.string(),
  nextDueDate: z.date(),
});

export type CreateExpenseData = z.infer<typeof CreateExpenseSchema>;

export async function createRecurringExpense(data: CreateExpenseData) {
  try {
    const { organizationId } = await getServerAuthContext();
    
    // Validate input data
    const validData = CreateExpenseSchema.parse(data);
    
    // Create expense in database
    const expense = await prisma.recurringExpense.create({
      data: {
        ...validData,
        organizationId,
      },
    });
    
    // Revalidate the expenses page
    revalidatePath(`/organizations/${organization.slug}/finance/expenses`);
    
    return { success: true, expense };
  } catch (error) {
    console.error('Error creating recurring expense:', error);
    throw new Error('Failed to create recurring expense');
  }
}

export async function deleteRecurringExpense(id: string) {
  try {
    const { organizationId } = await getServerAuthContext();
    
    // Find the expense first to verify it belongs to this organization
    const expense = await prisma.recurringExpense.findFirst({
      where: {
        id,
        organizationId: organizationId,
      },
    });
    
    if (!expense) {
      throw new Error('Expense not found or does not belong to this organization');
    }
    
    // Delete the expense
    await prisma.recurringExpense.delete({
      where: { id },
    });
    
    // Revalidate the expenses page
    revalidatePath(`/organizations/${organization.slug}/finance/expenses`);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting recurring expense:', error);
    throw new Error('Failed to delete recurring expense');
  }
}

export async function updateRecurringExpense(id: string, data: Partial<CreateExpenseData>) {
  try {
    const { organizationId } = await getServerAuthContext();
    
    // Find the expense first to verify it belongs to this organization
    const expense = await prisma.recurringExpense.findFirst({
      where: {
        id,
        organizationId,
      },
    });
    
    if (!expense) {
      throw new Error('Expense not found or does not belong to this organization');
    }
    
    // Update the expense
    const updatedExpense = await prisma.recurringExpense.update({
      where: { id },
      data,
    });
    
    // Revalidate the expenses page
    revalidatePath(`/organizations/${organization.slug}/finance/expenses`);
    
    return { success: true, expense: updatedExpense };
  } catch (error) {
    console.error('Error updating recurring expense:', error);
    throw new Error('Failed to update recurring expense');
  }
}