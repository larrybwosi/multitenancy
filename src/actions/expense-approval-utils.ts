import {
  MemberRole,
  ExpenseStatus,
  ApprovalStatus,
} from '../../prisma/src/generated/prisma/client';
import { checkExpenseApprovalNeeded, canMemberApproveExpense, ExpenseCheckData } from './expense-approvals';
import prisma from '@/lib/db';

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
 * Approves an expense and records the approval in the approval log.
 * 
 * @param expenseId The expense to approve
 * @param approverId The member approving the expense
 * @param comments Optional comments from the approver
 * @returns Result of the approval operation
 */
export async function approveExpense(
  expenseId: string,
  approverId: string,
  comments?: string
) {
  try {
    // First check if the expense exists and can be approved
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { approval: true }
    });

    if (!expense) {
      return { success: false, error: 'Expense not found' };
    }

    if (expense.status !== ExpenseStatus.PENDING) {
      return {
        success: false,
        error: `Cannot approve expense in ${expense.status.toLowerCase()} status`
      };
    }

    // Get approver's member record
    const approver = await prisma.member.findUnique({
      where: { id: approverId },
      select: { organizationId: true, role: true }
    });

    if (!approver) {
      return { success: false, error: 'Approver not found' };
    }

    // Verify approver can approve this expense
    const expenseData: ExpenseCheckData = {
      amount: expense.amount,
      expenseCategoryId: expense.categoryId,
      locationId: expense.locationId,
      memberId: expense.memberId,
      isReimbursable: expense.isReimbursable
    };

    const canApprove = await canMemberApproveExpense(
      approverId,
      approver.role as MemberRole,
      expenseData,
      approver.organizationId
    );

    if (!canApprove) {
      return {
        success: false,
        error: 'You do not have permission to approve this expense'
      };
    }

    // Perform the approval transaction
    const now = new Date();
    const updatedExpense = await prisma.$transaction(async tx => {
      // Update the expense
      const result = await tx.expense.update({
        where: { id: expenseId },
        data: {
          status: ExpenseStatus.APPROVED,
          approverId: approverId,
          approvalDate: now
        }
      });

      // Create or update approval record
      if (expense.approval) {
        await tx.expenseApproval.update({
          where: { id: expense.approval.id },
          data: {
            status: ApprovalStatus.APPROVED,
            comments: comments,
            decisionDate: now,
            approverId: approverId
          }
        });
      } else {
        await tx.expenseApproval.create({
          data: {
            expenseId: expenseId,
            approverId: approverId,
            status: ApprovalStatus.APPROVED,
            comments: comments,
            decisionDate: now,
            organizationId: approver.organizationId
          }
        });
      }

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          organizationId: approver.organizationId,
          memberId: approverId,
          action: 'UPDATE',
          entityType: 'EXPENSE',
          entityId: expenseId,
          description: `Expense ${expenseId} approved by ${approverId}`,
          details: { 
            comments,
            previousStatus: expense.status,
            newStatus: ExpenseStatus.APPROVED
          }
        }
      });

      return result;
    });

    return {
      success: true,
      message: 'Expense approved successfully',
      expense: updatedExpense
    };
  } catch (error) {
    console.error('Error approving expense:', error);
    return {
      success: false,
      error: 'Failed to approve expense'
    };
  }
}

/**
 * Rejects an expense and records the rejection in the approval log.
 * 
 * @param expenseId The expense to reject
 * @param rejectorId The member rejecting the expense
 * @param comments Required comments explaining the rejection
 * @returns Result of the rejection operation
 */
export async function rejectExpense(
  expenseId: string,
  rejectorId: string,
  comments: string
) {
  try {
    // Rejection requires comments
    if (!comments || comments.trim() === '') {
      return { success: false, error: 'Comments are required for rejection' };
    }

    // First check if the expense exists and can be rejected
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { approval: true }
    });

    if (!expense) {
      return { success: false, error: 'Expense not found' };
    }

    if (expense.status !== ExpenseStatus.PENDING) {
      return {
        success: false,
        error: `Cannot reject expense in ${expense.status.toLowerCase()} status`
      };
    }

    // Get rejector's member record
    const rejector = await prisma.member.findUnique({
      where: { id: rejectorId },
      select: { organizationId: true, role: true }
    });

    if (!rejector) {
      return { success: false, error: 'Rejector not found' };
    }

    // Verify rejector can reject this expense (same rules as approval)
    const expenseData: ExpenseCheckData = {
      amount: expense.amount,
      expenseCategoryId: expense.categoryId,
      locationId: expense.locationId,
      memberId: expense.memberId,
      isReimbursable: expense.isReimbursable
    };

    const canReject = await canMemberApproveExpense(
      rejectorId,
      rejector.role as MemberRole,
      expenseData,
      rejector.organizationId
    );

    if (!canReject) {
      return {
        success: false,
        error: 'You do not have permission to reject this expense'
      };
    }

    // Create the updated notes
    const newNotes = expense.notes 
      ? `${expense.notes}\nREJECTED: ${comments}`
      : `REJECTED: ${comments}`;

    // Perform the rejection transaction
    const now = new Date();
    const updatedExpense = await prisma.$transaction(async tx => {
      // Update the expense
      const result = await tx.expense.update({
        where: { id: expenseId },
        data: {
          status: ExpenseStatus.REJECTED,
          notes: newNotes
        }
      });

      // Create or update approval record
      if (expense.approval) {
        await tx.expenseApproval.update({
          where: { id: expense.approval.id },
          data: {
            status: ApprovalStatus.REJECTED,
            comments: comments,
            decisionDate: now,
            approverId: rejectorId
          }
        });
      } else {
        await tx.expenseApproval.create({
          data: {
            expenseId: expenseId,
            approverId: rejectorId,
            status: ApprovalStatus.REJECTED,
            comments: comments,
            decisionDate: now,
            organizationId: rejector.organizationId
          }
        });
      }

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          organizationId: rejector.organizationId,
          memberId: rejectorId,
          action: 'UPDATE',
          entityType: 'EXPENSE',
          entityId: expenseId,
          description: `Expense ${expenseId} rejected by ${rejectorId}`,
          details: { 
            comments,
            previousStatus: expense.status,
            newStatus: ExpenseStatus.REJECTED
          }
        }
      });

      return result;
    });

    return {
      success: true,
      message: 'Expense rejected successfully',
      expense: updatedExpense
    };
  } catch (error) {
    console.error('Error rejecting expense:', error);
    return {
      success: false,
      error: 'Failed to reject expense'
    };
  }
} 