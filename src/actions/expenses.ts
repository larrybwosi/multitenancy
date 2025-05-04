import { CreateExpenseSchema, ListExpensesFilter } from '@/lib/validations/epenses';
import { Expense, MemberRole, ExpenseStatus, ApprovalStatus, Prisma } from '../../prisma/src/generated/prisma/client';
import { getServerAuthContext } from './auth';
import prisma from '@/lib/db';

/**
 * Input data for approving or rejecting an expense.
 */
type UpdateExpenseStatusInput = {
  expenseId: string;
  comments?: string | null;
};

/**
 * Standard response structure for service functions.
 */
type ServiceResponse<T> = {
  success: boolean;
  data?: T | null;
  error?: string | null;
  errorCode?: number | null; // Optional HTTP status code or custom error code
};

// --- Helper Functions ---

/**
 * Checks if a member has the required role(s) for an action.
 * @param memberRole - The role of the current member.
 * @param requiredRoles - An array of roles that are permitted.
 * @returns True if the member has a required role, false otherwise.
 */
const hasRequiredRole = (memberRole: MemberRole, requiredRoles: MemberRole[]): boolean => {
  return requiredRoles.includes(memberRole);
};

/**
 * Validates and converts amount/taxAmount to Decimal.
 * @param value - The value to convert.
 * @param fieldName - The name of the field for error messages.
 * @returns The Decimal value.
 * @throws Error if the value is invalid.
 */
const validateAndConvertToDecimal = (
  value: number | string | Prisma.Decimal | null | undefined,
  fieldName: string
): Prisma.Decimal | null => {
  if (value === null || value === undefined) {
    return null;
  }
  try {
    return new Prisma.Decimal(value);
  } catch (e) {
    console.error(`Error converting ${fieldName}:`, e);
    throw new Error(`Invalid ${fieldName} format. Must be a valid number.`);
  }
};

// --- Core Expense Functions ---

/**
 * Creates a new expense record.
 * It checks user authentication, validates input, determines initial status based on organization rules,
 * and creates the Expense record in the database.
 *
 * @param input - The data for the new expense.
 * @returns A ServiceResponse containing the created Expense object or an error message.
 */
export const createExpense = async (input: unknown): Promise<ServiceResponse<Expense>> => {
  try {
    // 1. Authentication and Authorization
    const { memberId, organizationId } = await getServerAuthContext();

    // 2. Input Validation with Zod
    const validationResult = CreateExpenseSchema.safeParse(input);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: `Validation failed: ${errors}`, errorCode: 400 };
    }

    const { categoryId, locationId, supplierId, purchaseId, budgetId, ...validatedInput } = validationResult.data;

    // 3. Fetch Organization Settings for Approval Rules
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        expenseApprovalRequired: true,
        expenseApprovalThreshold: true,
        expenseReceiptRequired: true,
        expenseReceiptThreshold: true,
        id: true,
      },
    });

    if (!organization) {
      return { success: false, error: 'Organization not found.', errorCode: 404 };
    }

    // 4. Determine Initial Status and Approval Requirements
    let initialStatus: ExpenseStatus = ExpenseStatus.PENDING;
    let requiresApproval = false;

    if (organization.expenseApprovalRequired) {
      if (
        organization.expenseApprovalThreshold === null ||
        validateAndConvertToDecimal(validatedInput.amount, 'amount')?.greaterThan(organization.expenseApprovalThreshold)
      ) {
        requiresApproval = true;
      }
    }

    if (!requiresApproval) {
      initialStatus = ExpenseStatus.APPROVED;
    }

    // 5. Receipt Validation
    const requiresReceipt =
      organization.expenseReceiptRequired &&
      (organization.expenseReceiptThreshold === null ||
        validateAndConvertToDecimal(validatedInput.amount, 'amount')?.greaterThan(organization.expenseReceiptThreshold));

    if (requiresReceipt && !validatedInput.receiptUrl) {
      return {
        success: false,
        error: `Receipt is required for expenses over ${organization.expenseReceiptThreshold ?? 0}.`,
        errorCode: 400,
      };
    }

    // 6. Generate unique expense number
    const expenseNumber = `EXP-${Date.now().toString().toUpperCase().slice(3, 8)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // 7. Create Expense in Database
    const newExpense = await prisma.expense.create({
      data: {
        ...validatedInput,
        expenseDate: validatedInput.expenseDate,
        isReimbursable: validatedInput.isReimbursable,
        isBillable: validatedInput.isBillable,
        status: initialStatus,
        tags: validatedInput.tags,
        expenseNumber,
        organization: { connect: { id: organizationId } },
        member: { connect: { id: memberId } },
        category: { connect: { id: categoryId } },
        ...(locationId && { location: { connect: { id: locationId } } }),
        ...(supplierId && { supplier: { connect: { id: supplierId } } }),
        ...(purchaseId && { purchase: { connect: { id: purchaseId } } }),
        ...(budgetId && { budget: { connect: { id: budgetId } } }),
        ...(initialStatus === ExpenseStatus.APPROVED ? { approver: { connect: { id: memberId } }, approvalDate: new Date() } : {}),
      },
    });

    if (requiresApproval) {
      await prisma.expenseApproval.create({
        data: {
          expense: { connect: { id: newExpense.id } },
          approver: { connect: { id: memberId } },
          status: ApprovalStatus.PENDING,
          organization: { connect: { id: organizationId } },
          decisionDate: new Date()
        },
      });
    }

    return { success: true, data: newExpense };
  } catch (error: unknown) {
    console.error('Error creating expense:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return {
          success: false,
          error: 'Failed to create expense due to a conflict. Please try again.',
          errorCode: 409,
        };
      }
      return { success: false, error: `Database error: ${error.message}`, errorCode: 500 };
    }
    return { success: false, error: 'An unexpected error occurred.', errorCode: 500 };
  }
};

/**
 * Approves an existing expense.
 * Checks user authentication and role, verifies the expense exists and is in a state that can be approved,
 * updates the expense status, and optionally creates an ExpenseApproval record.
 *
 * @param input - Contains the ID of the expense to approve and optional comments.
 * @returns A ServiceResponse containing the updated Expense object or an error message.
 */
export const approveExpense = async (input: UpdateExpenseStatusInput): Promise<ServiceResponse<Expense>> => {
  try {
    // 1. Authentication and Authorization
    const { memberId, organizationId, role } = await getServerAuthContext();
    if (!memberId || !organizationId || !role) {
      return { success: false, error: 'Authentication required.', errorCode: 401 };
    }

    // Define roles allowed to approve (adjust as per MemberRole enum)
    const allowedRoles: MemberRole[] = [MemberRole.ADMIN, MemberRole.MANAGER, MemberRole.OWNER];
    if (!hasRequiredRole(role, allowedRoles)) {
      return {
        success: false,
        error: 'Permission denied. You do not have the required role to approve expenses.',
        errorCode: 403,
      };
    }

    // 2. Fetch Expense and Validate Status
    const expense = await prisma.expense.findUnique({
      where: { id: input.expenseId, organizationId: organizationId },
      include: {
        approval: true, // Include existing approval record if any
      },
    });

    if (!expense) {
      return {
        success: false,
        error: `Expense with ID ${input.expenseId} not found in your organization.`,
        errorCode: 404,
      };
    }

    // Check if expense is already approved or in a non-pending state
    if (expense.status !== ExpenseStatus.PENDING) {
      return {
        success: false,
        error: `Expense is already in ${expense.status} state and cannot be approved again.`,
        errorCode: 400,
      };
    }

    // 3. Update Expense and potentially ExpenseApproval record
    const now = new Date();
    const updatedExpense = await prisma.$transaction(async tx => {
      // Update expense
      await tx.$executeRaw`
        UPDATE "expense" 
        SET "status" = ${ExpenseStatus.APPROVED}, 
            "approverId" = ${memberId}, 
            "approvalDate" = ${now} 
        WHERE "id" = ${input.expenseId}
      `;

      // Update or create ExpenseApproval record
      if (expense.approval) {
        // Update existing approval record
        await tx.$executeRaw`
          UPDATE "expense_approval" 
          SET "status" = ${ApprovalStatus.APPROVED}, 
              "comments" = ${input.comments || null}, 
              "decisionDate" = ${now}, 
              "approverId" = ${memberId}
          WHERE "id" = ${expense.approval.id}
        `;
      } else {
        // Create a new approval record if one didn't exist
        await tx.expenseApproval.create({
          data: {
            expenseId: input.expenseId,
            approverId: memberId,
            status: ApprovalStatus.APPROVED,
            comments: input.comments,
            decisionDate: now,
            organizationId: organizationId,
          },
        });
      }
      
      // Return the updated expense
      return await tx.expense.findUnique({
        where: { id: input.expenseId },
      });
    });

    return { success: true, data: updatedExpense };
  } catch (error: unknown) {
    console.error('Error approving expense:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: `Database error: ${error.message}`, errorCode: 500 };
    } else if (error instanceof Error) {
      return { success: false, error: error.message, errorCode: 400 };
    }
    return { success: false, error: 'An unexpected error occurred while approving the expense.', errorCode: 500 };
  }
};

/**
 * Rejects an existing expense.
 * Checks user authentication and role, verifies the expense exists and is pending,
 * updates the expense status to REJECTED, and records the rejection comment.
 *
 * @param input - Contains the ID of the expense to reject and mandatory comments.
 * @returns A ServiceResponse containing the updated Expense object or an error message.
 */
export const rejectExpense = async (input: UpdateExpenseStatusInput): Promise<ServiceResponse<Expense>> => {
  try {
    // 1. Authentication and Authorization
    const { memberId, organizationId, role } = await getServerAuthContext();
    if (!memberId || !organizationId) {
      return { success: false, error: 'Authentication required.', errorCode: 401 };
    }

    // Define roles allowed to reject (usually same as approval)
    const allowedRoles: MemberRole[] = [MemberRole.ADMIN, MemberRole.MANAGER, MemberRole.OWNER];
    if (!hasRequiredRole(role!, allowedRoles)) {
      return {
        success: false,
        error: 'Permission denied. You do not have the required role to reject expenses.',
        errorCode: 403,
      };
    }

    // Rejection comment is mandatory
    if (!input.comments || input.comments.trim() === '') {
      return { success: false, error: 'Rejection comments are required.', errorCode: 400 };
    }

    // 2. Fetch Expense and Validate Status
    const expense = await prisma.expense.findUnique({
      where: { id: input.expenseId, organizationId: organizationId },
      include: {
        approval: true, // Include existing approval record if any
      },
    });

    if (!expense) {
      return {
        success: false,
        error: `Expense with ID ${input.expenseId} not found in your organization.`,
        errorCode: 404,
      };
    }

    // Check if expense is in a state that allows rejection (typically PENDING)
    if (expense.status !== ExpenseStatus.PENDING) {
      return { success: false, error: `Expense is in ${expense.status} state and cannot be rejected.`, errorCode: 400 };
    }

    // 3. Update Expense and potentially ExpenseApproval record
    const now = new Date();
    const updatedExpense = await prisma.$transaction(async tx => {
      // Set the notes
      const newNotes = expense.notes 
        ? `${expense.notes}\nREJECTED: ${input.comments}` 
        : `REJECTED: ${input.comments}`;
      
      // Update expense
      await tx.$executeRaw`
        UPDATE "expense" 
        SET "status" = ${ExpenseStatus.REJECTED},
            "notes" = ${newNotes}
        WHERE "id" = ${input.expenseId}
      `;

      // Update or create ExpenseApproval record
      if (expense.approval) {
        // Update existing approval record
        await tx.$executeRaw`
          UPDATE "expense_approval" 
          SET "status" = ${ApprovalStatus.REJECTED}, 
              "comments" = ${input.comments}, 
              "decisionDate" = ${now}, 
              "approverId" = ${memberId}
          WHERE "id" = ${expense.approval.id}
        `;
      } else {
        // Create a new approval record if one didn't exist
        await tx.expenseApproval.create({
          data: {
            expenseId: input.expenseId,
            approverId: memberId,
            status: ApprovalStatus.REJECTED,
            comments: input.comments,
            decisionDate: now,
            organizationId: organizationId,
          },
        });
      }
      
      // Return the updated expense
      return await tx.expense.findUnique({
        where: { id: input.expenseId },
      });
    });

    return { success: true, data: updatedExpense };
  } catch (error: unknown) {
    console.error('Error rejecting expense:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { success: false, error: `Database error: ${error.message}`, errorCode: 500 };
    } else if (error instanceof Error) {
      return { success: false, error: error.message, errorCode: 400 };
    }
    return { success: false, error: 'An unexpected error occurred while rejecting the expense.', errorCode: 500 };
  }
};

/**
 * Retrieves a single expense by its ID.
 * Checks authentication and ensures the expense belongs to the user's organization.
 * Allows users to view their own expenses or admins/managers to view any expense in the org.
 *
 * @param expenseId - The ID of the expense to retrieve.
 * @returns A ServiceResponse containing the Expense object or an error message.
 */
export const getExpenseById = async (expenseId: string): Promise<ServiceResponse<Expense>> => {
  try {
    // 1. Authentication and Authorization
    const { memberId, organizationId, role } = await getServerAuthContext();
    if (!memberId || !organizationId || !role) {
      return { success: false, error: 'Authentication required.', errorCode: 401 };
    }

    // 2. Fetch Expense
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId, organizationId: organizationId },
      // Include related data as needed
      include: {
        category: true,
        member: { select: { id: true, user: { select: { name: true, email: true } } } }, // Submitter info
        approver: { select: { id: true, user: { select: { name: true, email: true } } } }, // Approver info
        location: true,
        supplier: true,
        purchase: true,
        budget: true,
        attachments: true,
        approval: true, // Include approval details
      },
    });

    if (!expense) {
      return { success: false, error: `Expense with ID ${expenseId} not found in your organization.`, errorCode: 404 };
    }

    // 3. Access Control Check: Allow viewing own expense or if user is Admin/Manager/Owner
    const allowedRoles: MemberRole[] = [MemberRole.ADMIN, MemberRole.MANAGER, MemberRole.OWNER];
    if (expense.memberId !== memberId && !hasRequiredRole(role, allowedRoles)) {
      return {
        success: false,
        error:
          'Permission denied. You can only view your own expenses or expenses within your organization if you have sufficient privileges.',
        errorCode: 403,
      };
    }

    return { success: true, data: expense };
  } catch (error: unknown) {
    console.error('Error retrieving expense:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message, errorCode: 400 };
    }
    return { success: false, error: 'An unexpected error occurred while retrieving the expense.', errorCode: 500 };
  }
};

/**
 * Retrieves a list of expenses based on filters and permissions.
 * Regular members can see their own expenses. Admins/Managers can see all expenses in the organization.
 * Supports filtering and basic pagination.
 *
 * @param filter - Optional filtering criteria.
 * @returns A ServiceResponse containing an array of Expense objects or an error message.
 */
export const listExpenses = async (filter: ListExpensesFilter = {}): Promise<ServiceResponse<Expense[]>> => {
  try {
    // 1. Authentication and Authorization
    const { memberId, organizationId, role } = await getServerAuthContext();
    if (!memberId || !organizationId || !role) {
      return { success: false, error: 'Authentication required.', errorCode: 401 };
    }

    // 2. Determine Base Query based on Role
    const canViewAll = hasRequiredRole(role, [MemberRole.ADMIN, MemberRole.MANAGER, MemberRole.OWNER]);

    const whereClause: Prisma.ExpenseWhereInput = {
      organizationId: organizationId,
    };

    // If user cannot view all, restrict to their own submitted expenses unless a specific memberId filter is already set (which should only be allowed for admins)
    if (!canViewAll) {
      if (filter.memberId && filter.memberId !== memberId) {
        // Non-admin trying to filter by someone else's ID
        return {
          success: false,
          error: 'Permission denied. You can only filter by your own expenses.',
          errorCode: 403,
        };
      }
      whereClause.memberId = memberId; // Default filter for non-admins
    } else if (filter.memberId) {
      // Admin filtering by a specific member
      whereClause.memberId = filter.memberId;
    }

    // 3. Apply Filters
    if (filter.status) whereClause.status = filter.status;
    if (filter.approverId) whereClause.approverId = filter.approverId;
    if (filter.categoryId) whereClause.categoryId = filter.categoryId;
    if (filter.locationId) whereClause.locationId = filter.locationId;
    if (filter.budgetId) whereClause.budgetId = filter.budgetId;
    if (filter.isReimbursable !== undefined) whereClause.isReimbursable = filter.isReimbursable;
    if (filter.isBillable !== undefined) whereClause.isBillable = filter.isBillable;
    if (filter.tags && filter.tags.length > 0) whereClause.tags = { hasSome: filter.tags };

    if (filter.dateFrom || filter.dateTo) {
      whereClause.expenseDate = {};
      if (filter.dateFrom) whereClause.expenseDate.gte = new Date(filter.dateFrom);
      if (filter.dateTo) whereClause.expenseDate.lte = new Date(filter.dateTo);
    }

    // 4. Fetch Expenses with Pagination
    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true } },
        member: { select: { user: { select: { name: true } } } },
        approver: { select: { user: { select: { name: true } } } },
        // Add other includes as needed for list view
      },
      orderBy: {
        expenseDate: 'desc', // Default sort order
      },
      skip: filter.skip ?? 0,
      take: filter.take ?? 50, // Default page size
    });

    // Optionally return total count for pagination
    // const totalCount = await prisma.expense.count({ where: whereClause });

    return { success: true, data: expenses /*, totalCount */ };
  } catch (error: unknown) {
    console.error('Error listing expenses:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message, errorCode: 400 };
    }
    return { success: false, error: 'An unexpected error occurred while listing expenses.', errorCode: 500 };
  }
};
