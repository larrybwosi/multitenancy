import { z } from 'zod';
import {
  MemberRole,
  ConditionType,
  ApprovalActionType,
  ApprovalMode,
  ApprovalWorkflow,
  Prisma,
} from '@/prisma/client'; 
import prisma from '@/lib/db';
import { ValidatedWorkflowUpdateInput, WorkflowUpdateInputSchema } from '@/lib/validations/approval';

/**
 * Seeds the "Low Value Expense Approval" workflow.
 * All expenses <= $100 require Manager approval.
 */
export async function lowValueApproval(organizationId: string): Promise<ApprovalWorkflow> {
  console.log(`Seeding: Low Value Expense Approval for Org ID: ${organizationId}`);
  return prisma.approvalWorkflow.create({
    data: {
      organizationId,
      name: 'Low Value Expense Approval',
      description: 'Requires Manager approval for expenses up to $100.',
      isActive: true,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Manager Review',
            description: 'Approval required by a Manager.',
            allConditionsMustMatch: true,
            conditions: {
              create: [
                {
                  type: ConditionType.AMOUNT_RANGE,
                  maxAmount: 100.0, // Applies to amounts <= 100.00
                },
              ],
            },
            actions: {
              create: [
                {
                  type: ApprovalActionType.ROLE,
                  approverRole: MemberRole.MANAGER,
                  approvalMode: ApprovalMode.ANY_ONE,
                },
              ],
            },
          },
        ],
      },
    },
  });
}

/**
 * Seeds the "Tiered Expense Approval" workflow.
 * $100-$1000: Manager approval
 * > $1000: Admin approval
 */
export async function tieredApproval(organizationId: string): Promise<ApprovalWorkflow> {
  console.log(`Creating: Tiered Expense Approval for Org ID: ${organizationId}`);
  return prisma.approvalWorkflow.create({
    data: {
      organizationId,
      name: 'Tiered Expense Approval',
      description: 'Manager approval for $100-$1000, Admin approval for >$1000.',
      isActive: true,
      steps: {
        create: [
          // Step 1: Manager Approval
          {
            stepNumber: 1,
            name: 'Manager Approval',
            description: 'Approval for mid-range expenses.',
            allConditionsMustMatch: true,
            conditions: {
              create: [
                {
                  type: ConditionType.AMOUNT_RANGE,
                  minAmount: 100.0, // Greater than 100
                  maxAmount: 1000.0, // Up to 1000
                },
              ],
            },
            actions: {
              create: [
                {
                  type: ApprovalActionType.ROLE,
                  approverRole: MemberRole.MANAGER,
                  approvalMode: ApprovalMode.ANY_ONE,
                },
              ],
            },
          },
          // Step 2: Admin/Director Approval
          {
            stepNumber: 2,
            name: 'Admin/Director Approval',
            description: 'Approval for high-value expenses.',
            allConditionsMustMatch: true,
            conditions: {
              create: [
                {
                  type: ConditionType.AMOUNT_RANGE,
                  minAmount: 1000.0, // Greater than 1000
                },
              ],
            },
            actions: {
              create: [
                {
                  type: ApprovalActionType.ROLE,
                  approverRole: MemberRole.ADMIN, // Or potentially a custom 'DIRECTOR' role if defined
                  approvalMode: ApprovalMode.ANY_ONE,
                },
              ],
            },
          },
        ],
      },
    },
  });
}



/**
 * Creates the "Branch Office Expense Approval" workflow.
 * Requires approval from the Manager associated with a specific location.
 * NOTE: This assumes you know the InventoryLocation ID for the branch office.
 * The logic to link the MANAGER role specifically to *that* location manager
 * needs to be handled during the approval checking phase, not directly in the workflow definition itself.
 * The workflow step targets the *role* MANAGER; your application logic resolves *which* manager.
 */
export async function branchOfficeApproval(organizationId: string, branchLocationId: string): Promise<ApprovalWorkflow> {
  console.log(`Creating: Branch Office Expense Approval for Org ID: ${organizationId}`);
  return prisma.approvalWorkflow.create({
    data: {
      organizationId,
      name: `Branch Office Approval (${branchLocationId})`,
      description: `Requires Manager approval for expenses at location ID: ${branchLocationId}.`,
      isActive: true,
      steps: {
        create: [
          {
            stepNumber: 1,
            name: 'Branch Manager Review',
            allConditionsMustMatch: true,
            conditions: {
              create: [
                {
                  type: ConditionType.LOCATION,
                  locationId: branchLocationId,
                },
              ],
            },
            actions: {
              create: [
                {
                  type: ApprovalActionType.ROLE,
                  approverRole: MemberRole.MANAGER, // Application logic needs to find the *correct* manager for this location
                  approvalMode: ApprovalMode.ANY_ONE,
                },
              ],
            },
          },
        ],
      },
    },
  });
}

/**
 * Validates the raw input data for updating an approval workflow using Zod.
 *
 * @param rawInput The raw input data (e.g., from an API request body).
 * @returns An object containing either the validated data or validation errors.
 */
function validateWorkflowUpdateInput(rawInput: unknown): { success: true; data: ValidatedWorkflowUpdateInput } | { success: false; errors: z.ZodIssue[] } {
    const result = WorkflowUpdateInputSchema.safeParse(rawInput);

    if (!result.success) {
        console.error("Workflow Update Input Validation Failed:", result.error.errors);
        return { success: false, errors: result.error.errors };
    }

    return { success: true, data: result.data };
}


// --- Modified `updateApprovalWorkflow` to accept validated data ---
// (Assuming the previous `updateApprovalWorkflow` exists)
// We only need to adjust the type hint for the input data parameter.
// The core logic remains the same as it expects the structured data.

export async function updateApprovalWorkflow(
  workflowId: string,
  // Use the inferred type from the Zod schema
  validatedWorkflowData: unknown
): Promise<ApprovalWorkflow | null> {
  console.log(`Updating Workflow ID: ${workflowId} with validated data.`);

  const validationResult = validateWorkflowUpdateInput(validatedWorkflowData);
  if (!validationResult.success) {
    console.error('Workflow data validation failed:', validationResult.errors);
    return null;
  }
  const { steps: newStepsData, ...workflowUpdateData } = validationResult.data;

  try {
    const updatedWorkflow = await prisma.$transaction(async (tx) => {
      // 1. Delete existing steps
      await tx.approvalWorkflowStep.deleteMany({
        where: { approvalWorkflowId: workflowId },
      });

      // 2. Update workflow and create new steps from validated data
      const result = await tx.approvalWorkflow.update({
        where: { id: workflowId },
        data: {
          ...workflowUpdateData, // name, description, isActive
          steps: {
            create: newStepsData.map(step => ({
                ...step, // Spread validated step data
                conditions: {
                    create: step.conditions.map(condition => ({
                        ...condition, // Spread validated condition data
                    })),
                },
                actions: {
                    create: step.actions.map(action => ({
                        ...action, // Spread validated action data
                    })),
                },
            })),
          },
        },
        include: {
          steps: {
            include: { conditions: true, actions: true },
            orderBy: { stepNumber: 'asc' }
          },
        },
      });
      return result;
    });

    console.log(`Successfully updated Workflow ID: ${workflowId}`);
    return updatedWorkflow;

  } catch (error) {
    console.error(`Error updating workflow ID ${workflowId}:`, error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            console.error(`Workflow with ID ${workflowId} not found.`);
            return null;
        }
    throw error; // Re-throw other errors
  }
}
