import { CreateExpenseSchema, ListExpensesFilter } from '@/lib/validations/expenses';
import { Expense, MemberRole, ExpenseStatus, ApprovalStatus, Prisma } from '@/prisma/client';
import { getServerAuthContext } from './auth';
import prisma from '@/lib/db';
import { canMemberApproveExpense, checkExpenseApprovalNeeded, ExpenseCheckData } from './expense-approvals';

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

    const expenseData: ExpenseCheckData = {
      amount: validatedInput.amount,
      expenseCategoryId: categoryId,
      locationId: locationId,
      memberId,
      isReimbursable: validatedInput.isReimbursable,
    };

    const requiresApproval = await checkExpenseApprovalNeeded(expenseData, organizationId);

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

    const { expenseId, comments } = input;
    // 2. Fetch Expense and Validate Status
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId, organizationId: organizationId },
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

    // Verify approver can approve this expense
    const expenseData: ExpenseCheckData = {
      amount: expense.amount,
      expenseCategoryId: expense.categoryId,
      locationId: expense.locationId,
      memberId: expense.memberId,
      isReimbursable: expense.isReimbursable,
    };
    const canApprove = await canMemberApproveExpense(memberId, role as MemberRole, expenseData, organizationId);

    if (!canApprove) {
      return {
        success: false,
        error: 'You do not have permission to approve this expense',
      };
    }

    // 3. Update Expense and potentially ExpenseApproval record
    const now = new Date();
    const updatedExpense = await prisma.$transaction(async tx => {
      // Update the expense
      const result = await tx.expense.update({
        where: { id: expenseId },
        data: {
          status: ExpenseStatus.APPROVED,
          approverId: memberId,
          approvalDate: now,
        },
      });

      // Create or update approval record
      if (expense.approval) {
        await tx.expenseApproval.update({
          where: { id: expense.approval.id },
          data: {
            status: ApprovalStatus.APPROVED,
            comments: comments,
            decisionDate: now,
            approverId: memberId,
          },
        });
      } else {
        await tx.expenseApproval.create({
          data: {
            expenseId: expenseId,
            approverId: memberId,
            status: ApprovalStatus.APPROVED,
            comments: comments,
            decisionDate: now,
            organizationId,
          },
        });
      }

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          organizationId,
          memberId: memberId,
          action: 'UPDATE',
          entityType: 'EXPENSE',
          entityId: expenseId,
          description: `Expense ${expenseId} approved by ${memberId}`,
          details: {
            comments,
            previousStatus: expense.status,
            newStatus: ExpenseStatus.APPROVED,
          },
        },
      });

      return result;
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

    // Rejection comment is mandatory
    if (!input.comments || input.comments.trim() === '') {
      return { success: false, error: 'Rejection comments are required.', errorCode: 400 };
    }
    const { expenseId, comments } = input;
    const expense = await prisma.expense.findUnique({
      where: { id: input.expenseId, organizationId },
      include: { approval: true },
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

    // Verify rejector can reject this expense (same rules as approval)
    const expenseData: ExpenseCheckData = {
      amount: expense.amount,
      expenseCategoryId: expense.categoryId,
      locationId: expense.locationId,
      memberId: expense.memberId,
      isReimbursable: expense.isReimbursable,
    };

    const canReject = await canMemberApproveExpense(memberId, role as MemberRole, expenseData, organizationId);

    if (!canReject) {
      return {
        success: false,
        error: 'You do not have permission to reject this expense',
        errorCode: 403,
      };
    }

    // Determine the new notes value by combining existing notes with the rejection comment
    const newNotes = expense.notes 
      ? `${expense.notes}\nRejection: ${comments}`
      : `Rejection: ${comments}`;

    // 3. Update Expense and potentially ExpenseApproval record
    const now = new Date();
    const updatedExpense = await prisma.$transaction(async tx => {
      // Update the expense
      const result = await tx.expense.update({
        where: { id: expenseId },
        data: {
          status: ExpenseStatus.REJECTED,
          notes: newNotes,
        },
      });

      // Create or update approval record
      if (expense.approval) {
        await tx.expenseApproval.update({
          where: { id: expense.approval.id },
          data: {
            status: ApprovalStatus.REJECTED,
            comments: comments,
            decisionDate: now,
            approverId: memberId,
          },
        });
      } else {
        await tx.expenseApproval.create({
          data: {
            expenseId: expenseId,
            approverId: memberId,
            status: ApprovalStatus.REJECTED,
            comments: comments,
            decisionDate: now,
            organizationId,
          },
        });
      }

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          organizationId,
          memberId,
          action: 'UPDATE',
          entityType: 'EXPENSE',
          entityId: input.expenseId,
          description: `Expense ${input.expenseId} rejected by ${memberId}`,
          details: {
            comments,
            previousStatus: expense.status,
            newStatus: ExpenseStatus.REJECTED,
          },
        },
      });

      return result;
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
 * Determines if a given expense needs approval and who can approve it.
 * 
 * @param expenseId The expense ID to check
 * @param organizationId The organization ID
 * @returns Object with approval requirements and eligible approvers
 */
export async function checkExpenseApprovalRequirements(expenseId: string, organizationId: string) {
  try {
    // Fetch the expense
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId, organizationId },
      include: {
        category: true,
        member: true,
        location: true
      }
    });

    if (!expense) {
      return {
        success: false,
        error: 'Expense not found',
        requiresApproval: false,
        eligibleApprovers: []
      };
    }

    // If expense is already approved or rejected, it doesn't need further approval
    if (expense.status !== ExpenseStatus.PENDING) {
      return {
        success: true,
        requiresApproval: false,
        message: `Expense is already ${expense.status.toLowerCase()}`,
        eligibleApprovers: []
      };
    }

    // Create the expense data for approval checks
    const expenseData: ExpenseCheckData = {
      amount: expense.amount,
      expenseCategoryId: expense.categoryId,
      locationId: expense.locationId,
      memberId: expense.memberId,
      isReimbursable: expense.isReimbursable
    };

    // Check if approval is needed
    const requiresApproval = await checkExpenseApprovalNeeded(expenseData, organizationId);

    if (!requiresApproval) {
      return {
        success: true,
        requiresApproval: false,
        message: 'This expense does not require approval',
        eligibleApprovers: []
      };
    }

    // Find eligible approvers
    const members = await prisma.member.findMany({
      where: { 
        organizationId,
        isActive: true 
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Determine which members can approve
    const eligibleApprovers = [];
    for (const member of members) {
      // Skip the expense submitter (can't approve own expense)
      if (member.id === expense.memberId) continue;

      const canApprove = await canMemberApproveExpense(
        member.id,
        member.role as MemberRole,
        expenseData,
        organizationId
      );

      if (canApprove) {
        eligibleApprovers.push({
          id: member.id,
          role: member.role,
          name: member.user?.name,
          email: member.user?.email
        });
      }
    }

    return {
      success: true,
      requiresApproval,
      message: 'Approval required',
      eligibleApprovers
    };
  } catch (error) {
    console.error('Error checking approval requirements:', error);
    return {
      success: false,
      error: 'Failed to determine approval requirements',
      requiresApproval: false,
      eligibleApprovers: []
    };
  }
}
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
export const listExpenses = async (
  filter: ListExpensesFilter = {}
): Promise<ServiceResponse<{ expenses: Expense[]; pagination: PaginationMeta }>> => {
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

    // Get pagination parameters with defaults
    const skip = filter.skip ?? 0;
    const take = filter.take ?? 50;

    // Calculate current page based on skip/take
    const page = Math.floor(skip / take) + 1;
    const limit = take;

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
      skip: skip,
      take: take,
    });

    // Get total count for pagination
    const total = await prisma.expense.count({ where: whereClause });

    // Calculate total pages
    const totalPages = Math.ceil(total / take);

    // Create pagination metadata
    const pagination: PaginationMeta = {
      total,
      page,
      limit,
      totalPages,
    };

    return {
      success: true,
      data: {
        expenses,
        pagination,
      },
    };
  } catch (error: unknown) {
    console.error('Error listing expenses:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message, errorCode: 400 };
    }
    return { success: false, error: 'An unexpected error occurred while listing expenses.', errorCode: 500 };
  }
};

// Types needed for the function
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


// Types needed for the function
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
