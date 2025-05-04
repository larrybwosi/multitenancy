import { getWorkflowDetails } from './approval';
import {
  PrismaClient,
  Prisma,
  MemberRole,
  ApprovalWorkflow,
  ExpenseCategory,
  InventoryLocation,
  ApprovalWorkflowStep,
} from '../../prisma/src/generated/prisma/client'; 

const prisma = new PrismaClient();

// Define a type for the expense data needed for checks
export interface ExpenseCheckData {
  amount: Prisma.Decimal | number | string;
  expenseCategoryId?: string | null;
  locationId?: string | null;
  memberId: string; // Submitter ID
  // Add other relevant fields from Expense model used in conditions
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

// Extended workflow type with steps that might be missing in DB records
interface WorkflowWithSteps extends ApprovalWorkflow {
  steps?: Array<{
    id: string;
    conditions: ExtendedApprovalStepCondition[];
    allConditionsMustMatch: boolean;
    actions?: [];
    [key: string]: any;
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
        expenseApprovalRequired: true
      },
    });

    if (!org?.activeExpenseWorkflowId) {
      // If global setting requires approval but no workflow is active, maybe default to needing approval? Needs defined business logic.
      console.log(`No active workflow for Org ${orgId}. Approval need depends on global org settings.`);
      return null; // Or handle based on global org.expenseApprovalRequired
    }

    // Fetch the full workflow structure
    const workflow = await getWorkflowDetails(org.activeExpenseWorkflowId);
    return workflow as unknown as WorkflowWithSteps;
  } catch (error) {
    console.error(`Error fetching active workflow for Org ${orgId}:`, error);
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
      return minMatch && maxMatch;

    case 'EXPENSE_CATEGORY':
      return !!condition.expenseCategoryId && condition.expenseCategoryId === expenseData.expenseCategoryId;

    case 'LOCATION':
      return !!condition.locationId && condition.locationId === expenseData.locationId;

    // Add cases for other ConditionTypes (IS_REIMBURSABLE, PROJECT, HAS_RECEIPT, etc.)
    // Example:
    // case 'IS_REIMBURSABLE':
    //     return expenseData.isReimbursable === true; // Assuming condition implies 'must be reimbursable'

    default:
      console.warn(`Unhandled condition type: ${condition.type}`);
      return false; // Or throw an error for unhandled types
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
  if (!workflow?.steps || !Array.isArray(workflow.steps)) return null;

  for (const step of workflow.steps) {
    // Assumes steps are sorted by stepNumber ASC
    if (!step.conditions || step.conditions.length === 0) {
      console.warn(`Workflow step ${step.id} has no conditions.`);
      continue; // Skip steps without conditions (or treat as always matching if intended)
    }

    let matches: boolean;
    if (step.allConditionsMustMatch) {
      // ALL conditions must match
      matches = step.conditions.every((condition: ExtendedApprovalStepCondition) => 
        doesConditionMatchExpense(condition, expenseData)
      );
    } else {
      // ANY condition must match
      matches = step.conditions.some((condition: ExtendedApprovalStepCondition) => 
        doesConditionMatchExpense(condition, expenseData)
      );
    }

    if (matches) {
      return step; // Return the first step that matches
    }
  }

  return null; // No applicable step found in the workflow
}

/**
 * Determines if an expense requires approval based on the active workflow.
 *
 * @param expenseData Data for the expense being checked.
 * @param orgId The organization ID.
 * @returns Promise resolving to true if approval is needed, false otherwise.
 */
export async function checkExpenseApprovalNeeded(expenseData: ExpenseCheckData, orgId: string): Promise<boolean> {
  const workflow = await getActiveWorkflow(orgId);

  if (!workflow) {
    // If no active workflow, rely on the global organization setting
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { expenseApprovalRequired: true, expenseApprovalThreshold: true },
    });

    if (!org?.expenseApprovalRequired) {
      return false; // Global setting says no approval needed
    }
    // Global setting requires approval, check threshold if applicable
    const threshold = org.expenseApprovalThreshold;
    if (threshold === null) {
      return true; // Requires approval, no threshold means always approve
    }
    const expenseAmount = new Prisma.Decimal(expenseData.amount.toString());
    return expenseAmount.greaterThan(threshold); // Approve if amount > threshold
  }

  // If we have a workflow, first ensure it has needed properties
  if (!workflow.steps || !Array.isArray(workflow.steps)) {
    console.log("Workflow exists but has no steps, defaulting to org policy");
    return true; // If we have an active workflow but it's misconfigured, require approval
  }

  // Active workflow exists, check if any step applies
  const applicableStep = findApplicableWorkflowStep(expenseData, workflow);

  // If an applicable step is found, approval is needed.
  return applicableStep !== null;
}

/**
 * Gets the required approvers (roles or specific IDs) for an expense based on the first applicable step.
 *
 * @param expenseData Data for the expense being checked.
 * @param orgId The organization ID.
 * @returns Promise resolving to an array of required approver actions, or an empty array if no approval needed/no applicable step.
 */
export async function getRequiredApproversForExpense(
  expenseData: ExpenseCheckData,
  orgId: string
): Promise<any[]> {
  const workflow = await getActiveWorkflow(orgId);

  if (!workflow) {
    // Handle case where no workflow is active (maybe default approvers based on org settings?)
    console.log(`No active workflow for Org ${orgId} to determine approvers.`);
    // Depending on logic, might return default Admin/Owner roles if global approval is required.
    return [];
  }

  // Fetch the workflow again, this time including actions
  const detailedWorkflow = await getWorkflowDetails(workflow.id) as WorkflowWithSteps;
  if (!detailedWorkflow) return []; // Should not happen if getActiveWorkflow succeeded, but check anyway.

  const applicableStep = findApplicableWorkflowStep(expenseData, detailedWorkflow);

  if (!applicableStep) {
    return []; // No step applies, so no specific approvers required by the workflow
  }

  // Find the actions associated with the applicable step
  const stepWithActions = detailedWorkflow.steps?.find(s => s.id === applicableStep.id);
  return stepWithActions?.actions || [];
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
  const requiredActions = await getRequiredApproversForExpense(expenseData, orgId);

  if (requiredActions.length === 0) {
    // If no specific workflow actions found, check if approval is needed at all
    const needsApproval = await checkExpenseApprovalNeeded(expenseData, orgId);
    
    // Default rule: If approval is needed but no workflow specifies who can approve,
    // then only ADMIN or OWNER roles can approve
    if (needsApproval) {
      return memberRole === MemberRole.ADMIN || memberRole === MemberRole.OWNER;
    }
    
    return false; // No approval needed
  }

  // Check if the member matches any of the required actions
  for (const action of requiredActions) {
    if (action.type === 'ROLE' && action.approverRole === memberRole) {
      return true; // Member's role matches required role
    }
    if (action.type === 'SPECIFIC_MEMBER' && action.specificMemberId === memberId) {
      return true; // Member's ID matches required specific member
    }
    // Add checks for other ActionTypes (e.g., SUBMITTER_MANAGER - would need manager lookup logic)
  }

  return false; // Member does not match any required action criteria
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
      return 'Invalid Amount';
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(numberAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    // Fallback for invalid currency codes etc.
    return `${amount} ${currencyCode}`;
  }
}

// --- Example Usage of Helpers ---
/*
async function testExpenseChecks() {
    const orgId = "org_123"; // Replace with actual Org ID
    const expense: ExpenseCheckData = {
        amount: new Decimal("150.75"),
        expenseCategoryId: "cat_travel_456", // Replace with actual Category ID
        locationId: "loc_office_789", // Replace with actual Location ID
        memberId: "mem_submitter_abc", // Replace with actual Member ID
        isReimbursable: true,
    };

    const needsApproval = await checkExpenseApprovalNeeded(expense, orgId);
    console.log(`Expense ${formatCurrency(expense.amount)} needs approval: ${needsApproval}`);

    if (needsApproval) {
        const approvers = await getRequiredApproversForExpense(expense, orgId);
        console.log("Required Approvers:", approvers.map(a => a.type === 'ROLE' ? a.approverRole : a.specificMemberId));

        const memberTryingToApproveId = "mem_manager_xyz"; // Replace with actual Member ID
        const memberTryingToApproveRole = MemberRole.MANAGER; // Replace with actual Role

        const canApprove = await canMemberApproveExpense(
            memberTryingToApproveId,
            memberTryingToApproveRole,
            expense,
            orgId
        );
        console.log(`Member ${memberTryingToApproveId} (${memberTryingToApproveRole}) can approve: ${canApprove}`);
    }
}

// testExpenseChecks();
*/
