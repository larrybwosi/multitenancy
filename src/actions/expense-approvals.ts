import { getWorkflowDetails } from './approval';
import {
  Prisma,
  MemberRole,
  ApprovalWorkflow,
  ExpenseCategory,
  InventoryLocation,
  ApprovalWorkflowStep,
} from '@/prisma/client'; 
import prisma from '@/lib/db';

// Define a type for the expense data needed for checks
export interface ExpenseCheckData {
  amount: Prisma.Decimal | number | string;
  expenseCategoryId?: string | null;
  locationId?: string | null;
  memberId: string; // Submitter ID
  isReimbursable?: boolean | null;
  receiptUrl?: string | null;
}

// Define extended types for ApprovalStepCondition to include maxAmount
interface ExtendedApprovalStepCondition {
  id: string;
  stepId: string;
  type: string;
  minAmount: Prisma.Decimal | null;
  maxAmount: Prisma.Decimal | null;
  locationId: string | null;
  expenseCategoryId: string | null;
  expenseCategory: ExpenseCategory | null;
  location: InventoryLocation | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define a type for workflow actions
interface WorkflowAction {
  type: 'ROLE' | 'SPECIFIC_MEMBER' | 'SUBMITTER_MANAGER';
  approverRole?: MemberRole | null;
  specificMemberId?: string | null;
  specificMember?: {
    id: string;
    role: MemberRole;
    isActive: boolean;
    organizationId: string;
    userId: string;
    isCheckedIn: boolean;
    lastCheckInTime: Date | null;
    currentLocationId: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

// Extended workflow type with steps that might be missing in DB records
interface WorkflowWithSteps extends ApprovalWorkflow {
  steps?: Array<{
    id: string;
    name: string;
    description: string | null;
    stepNumber: number;
    allConditionsMustMatch: boolean;
    conditions: ExtendedApprovalStepCondition[];
    actions: WorkflowAction[];
    createdAt: Date;
    updatedAt: Date;
    approvalWorkflowId: string;
  }>;
}

/**
 * Fetches the active workflow for an organization, including its structure.
 * @param orgId The organization ID.
 * @returns The active workflow object or null.
 */
async function getActiveWorkflow(orgId: string): Promise<WorkflowWithSteps | null> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { 
        activeExpenseWorkflowId: true,
        expenseApprovalRequired: true,
        expenseReceiptRequired: true,
        expenseReceiptThreshold: true
      },
    });

    if (!org?.activeExpenseWorkflowId) {
      console.log(`[Workflow] No active workflow for Org ${orgId}. Using global settings:`, {
        approvalRequired: org?.expenseApprovalRequired,
        receiptRequired: org?.expenseReceiptRequired,
        receiptThreshold: org?.expenseReceiptThreshold
      });
      return null;
    }

    // Fetch the full workflow structure
    const workflow = await getWorkflowDetails(org.activeExpenseWorkflowId);
    console.log(`[Workflow] Found active workflow for Org ${orgId}:`, {
      workflowId: workflow?.id,
      name: workflow?.name,
      stepsCount: workflow?.steps?.length
    });
    return workflow as unknown as WorkflowWithSteps;
  } catch (error) {
    console.error(`[Workflow] Error fetching active workflow for Org ${orgId}:`, error);
    return null;
  }
}

/**
 * Checks if a specific condition matches the provided expense data.
 * @param condition The ApprovalStepCondition object.
 * @param expenseData The expense data to check against.
 * @returns True if the condition matches, false otherwise.
 */
function doesConditionMatchExpense(
  condition: ExtendedApprovalStepCondition,
  expenseData: ExpenseCheckData
): boolean {
  const expenseAmount = new Prisma.Decimal(expenseData.amount.toString());

  switch (condition.type) {
    case 'AMOUNT_RANGE':
      const minMatch = !condition.minAmount || expenseAmount.greaterThan(condition.minAmount);
      const maxMatch = !condition.maxAmount || expenseAmount.lessThanOrEqualTo(condition.maxAmount);
      console.log(`[Condition] Amount range check:`, {
        amount: expenseAmount.toString(),
        minAmount: condition.minAmount?.toString(),
        maxAmount: condition.maxAmount?.toString(),
        matches: minMatch && maxMatch
      });
      return minMatch && maxMatch;

    case 'EXPENSE_CATEGORY':
      const categoryMatch = !!condition.expenseCategoryId && condition.expenseCategoryId === expenseData.expenseCategoryId;
      console.log(`[Condition] Category check:`, {
        categoryId: expenseData.expenseCategoryId,
        requiredCategoryId: condition.expenseCategoryId,
        matches: categoryMatch
      });
      return categoryMatch;

    case 'LOCATION':
      const locationMatch = !!condition.locationId && condition.locationId === expenseData.locationId;
      console.log(`[Condition] Location check:`, {
        locationId: expenseData.locationId,
        requiredLocationId: condition.locationId,
        matches: locationMatch
      });
      return locationMatch;

    case 'RECEIPT_REQUIRED':
      const receiptMatch = expenseData.receiptUrl !== null && expenseData.receiptUrl !== undefined;
      console.log(`[Condition] Receipt check:`, {
        hasReceipt: receiptMatch,
        receiptUrl: expenseData.receiptUrl
      });
      return receiptMatch;

    default:
      console.warn(`[Condition] Unhandled condition type: ${condition.type}`);
      return false;
  }
}

/**
 * Finds the first applicable workflow step for a given expense based on conditions.
 * Assumes steps are pre-sorted by stepNumber.
 *
 * @param expenseData Data for the expense being checked.
 * @param workflow The full workflow object (including steps and conditions).
 * @returns The first matching ApprovalWorkflowStep or null if no step applies.
 */
function findApplicableWorkflowStep(
  expenseData: ExpenseCheckData,
  workflow: WorkflowWithSteps
): ApprovalWorkflowStep | null {
  if (!workflow?.steps || !Array.isArray(workflow.steps)) {
    console.log('[Workflow] No steps found in workflow');
    return null;
  }

  for (const step of workflow.steps) {
    console.log(`[Workflow] Checking step:`, {
      stepId: step.id,
      stepNumber: step.stepNumber,
      conditionsCount: step.conditions?.length
    });

    if (!step.conditions || step.conditions.length === 0) {
      console.warn(`[Workflow] Step ${step.id} has no conditions`);
      continue;
    }

    let matches: boolean;
    if (step.allConditionsMustMatch) {
      // ALL conditions must match
      matches = step.conditions.every((condition: ExtendedApprovalStepCondition) => 
        doesConditionMatchExpense(condition, expenseData)
      );
      console.log(`[Workflow] All conditions must match:`, { matches });
    } else {
      // ANY condition must match
      matches = step.conditions.some((condition: ExtendedApprovalStepCondition) => 
        doesConditionMatchExpense(condition, expenseData)
      );
      console.log(`[Workflow] Any condition must match:`, { matches });
    }

    if (matches) {
      console.log(`[Workflow] Found matching step:`, {
        stepId: step.id,
        stepNumber: step.stepNumber,
        actions: step.actions
      });
      return step;
    }
  }

  console.log('[Workflow] No matching step found');
  return null;
}

/**
 * Determines if an expense requires approval based on the active workflow.
 *
 * @param expenseData Data for the expense being checked.
 * @param orgId The organization ID.
 * @returns Promise resolving to true if approval is needed, false otherwise.
 */
export async function checkExpenseApprovalNeeded(expenseData: ExpenseCheckData, orgId: string): Promise<boolean> {
  console.log('[Approval] Checking if expense needs approval:', {
    amount: expenseData.amount,
    categoryId: expenseData.expenseCategoryId,
    locationId: expenseData.locationId,
    memberId: expenseData.memberId
  });

  const workflow = await getActiveWorkflow(orgId);

  if (!workflow) {
    // If no active workflow, rely on the global organization setting
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { 
        expenseApprovalRequired: true, 
        expenseApprovalThreshold: true,
        expenseReceiptRequired: true,
        expenseReceiptThreshold: true
      },
    });

    if (!org?.expenseApprovalRequired) {
      console.log('[Approval] No approval needed - global setting disabled');
      return false;
    }

    // Check receipt requirement first
    if (org.expenseReceiptRequired) {
      const expenseAmount = new Prisma.Decimal(expenseData.amount.toString());
      const requiresReceipt = !org.expenseReceiptThreshold || expenseAmount.greaterThan(org.expenseReceiptThreshold);
      
      if (requiresReceipt && !expenseData.receiptUrl) {
        console.log('[Approval] Receipt required but not provided');
        return true; // Needs approval due to missing receipt
      }
    }

    // Global setting requires approval, check threshold if applicable
    const threshold = org.expenseApprovalThreshold;
    if (threshold === null) {
      console.log('[Approval] Approval needed - no threshold set');
      return true;
    }

    const expenseAmount = new Prisma.Decimal(expenseData.amount.toString());
    const needsApproval = expenseAmount.greaterThan(threshold);
    console.log('[Approval] Threshold check:', {
      amount: expenseAmount.toString(),
      threshold: threshold.toString(),
      needsApproval
    });
    return needsApproval;
  }

  // If we have a workflow, first ensure it has needed properties
  if (!workflow.steps || !Array.isArray(workflow.steps)) {
    console.log('[Approval] Workflow exists but has no steps, defaulting to org policy');
    return true;
  }

  // Active workflow exists, check if any step applies
  const applicableStep = findApplicableWorkflowStep(expenseData, workflow);
  const needsApproval = applicableStep !== null;
  
  console.log('[Approval] Workflow check result:', {
    workflowId: workflow.id,
    hasApplicableStep: needsApproval,
    stepId: applicableStep?.id
  });

  return needsApproval;
}

/**
 * Gets the required approvers (roles or specific IDs) for an expense based on the first applicable step.
 *
 * @param expenseData Data for the expense being checked.
 * @param orgId The organization ID.
 * @returns Promise resolving to an array of required approver actions.
 */
export async function getRequiredApproversForExpense(
  expenseData: ExpenseCheckData,
  orgId: string
): Promise<WorkflowAction[]> {
  console.log('[Approvers] Getting required approvers for expense:', {
    amount: expenseData.amount,
    categoryId: expenseData.expenseCategoryId,
    locationId: expenseData.locationId
  });

  const workflow = await getActiveWorkflow(orgId);

  if (!workflow) {
    console.log('[Approvers] No active workflow, using default approvers');
    // Default to admin/owner roles if no workflow
    return [
      { type: 'ROLE', approverRole: MemberRole.ADMIN },
      { type: 'ROLE', approverRole: MemberRole.OWNER }
    ];
  }

  // Fetch the workflow again, this time including actions
  const detailedWorkflow = await getWorkflowDetails(workflow.id);
  if (!detailedWorkflow) {
    console.log('[Approvers] Failed to get detailed workflow');
    return [];
  }

  const applicableStep = findApplicableWorkflowStep(expenseData, detailedWorkflow);
  if (!applicableStep) {
    console.log('[Approvers] No applicable step found');
    return [];
  }

  // Find the actions associated with the applicable step
  const stepWithActions = detailedWorkflow.steps?.find(s => s.id === applicableStep.id);
  const actions = stepWithActions?.actions || [];
  
  console.log('[Approvers] Found required approvers:', {
    stepId: applicableStep.id,
    actionsCount: actions.length,
    actions
  });

  return actions;
}

/**
 * Checks if a specific member can approve an expense based on required approvers.
 *
 * @param memberId The ID of the member attempting to approve.
 * @param memberRole The role of the member attempting to approve.
 * @param expenseData Data for the expense being checked.
 * @param orgId The organization ID.
 * @returns Promise resolving to true if the member can approve, false otherwise.
 */
export async function canMemberApproveExpense(
  memberId: string,
  memberRole: MemberRole,
  expenseData: ExpenseCheckData,
  orgId: string
): Promise<boolean> {
  console.log('[Approval] Checking if member can approve:', {
    memberId,
    memberRole,
    expenseAmount: expenseData.amount
  });

  // Prevent self-approval
  if (memberId === expenseData.memberId) {
    console.log('[Approval] Member cannot approve their own expense');
    return false;
  }

  const requiredActions = await getRequiredApproversForExpense(expenseData, orgId);
  console.log('[Approval] Required approvers:', requiredActions);

  if (requiredActions.length === 0) {
    // If no specific workflow actions found, check if approval is needed at all
    const needsApproval = await checkExpenseApprovalNeeded(expenseData, orgId);
    console.log('[Approval] No specific approvers, checking global rules:', { needsApproval });
    
    // Default rule: If approval is needed but no workflow specifies who can approve,
    // then only ADMIN or OWNER roles can approve
    if (needsApproval) {
      const canApprove = memberRole === MemberRole.ADMIN || memberRole === MemberRole.OWNER;
      console.log('[Approval] Using default approver roles:', { canApprove });
      return canApprove;
    }
    
    return false;
  }

  // Check if the member matches any of the required actions
  for (const action of requiredActions) {
    if (action.type === 'ROLE' && action.approverRole === memberRole) {
      console.log('[Approval] Member role matches required role:', memberRole);
      return true;
    }
    if (action.type === 'SPECIFIC_MEMBER' && action.specificMemberId === memberId) {
      console.log('[Approval] Member ID matches required specific member');
      return true;
    }
    if (action.type === 'SUBMITTER_MANAGER') {
      // TODO: Implement manager check logic
      console.log('[Approval] Manager check not implemented yet');
    }
  }

  console.log('[Approval] Member does not match any required approver criteria');
  return false;
}

/**
 * Helper to format currency consistently.
 * @param amount - The amount (Decimal, number, or string).
 * @param currencyCode - e.g., "USD", "KES", "EUR". Defaults to "USD".
 * @param locale - e.g., "en-US", "en-KE". Defaults to "en-US".
 * @returns Formatted currency string.
 */
export function formatCurrency(
  amount: Prisma.Decimal | number | string,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    const numberAmount =
      typeof amount === 'object' && amount !== null && 'toNumber' in amount
        ? amount.toNumber() // Handle Decimal.js
        : Number(amount);

    if (isNaN(numberAmount)) {
      console.warn('[Currency] Invalid amount for formatting:', amount);
      return 'Invalid Amount';
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(numberAmount);
  } catch (error) {
    console.error('[Currency] Error formatting currency:', error);
    return `${amount} ${currencyCode}`;
  }
}
