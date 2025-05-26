import { db } from "@/lib/db";
import { Prisma, PrismaClient } from "@/prisma/client";
import { ApprovalWorkflowInput, ApprovalWorkflowInputSchema } from "@/lib/validations/approval";

interface WorkflowResult {
  success: boolean;
  message: string;
  workflowId?: string;
  error?: unknown; // Store raw error for debugging if needed
}

/**
 * Creates a new expense approval workflow for an organization using Prisma transactions.
 * Validates input using Zod schema.
 *
 * @param orgId The ID of the organization.
 * @param workflowData Raw input data for the workflow.
 * @returns Promise resolving to a WorkflowResult object.
 */

/**
 * Creates an approval workflow for an organization.
 * Can be used standalone or within an existing Prisma transaction.
 * @param orgId - The organization ID.
 * @param workflowData - The workflow input data.
 * @param prismaClient - The Prisma client (optional, defaults to global prisma).
 * @param tx - Optional Prisma transaction client.
 * @returns A WorkflowResult object.
 */
export async function createApprovalWorkflow(
  orgId: string,
  workflowData: unknown,
  prismaClient: PrismaClient = new PrismaClient(),
  tx?: Prisma.TransactionClient
): Promise<WorkflowResult> {
  // 1. Validate Input Data
  const validationResult = ApprovalWorkflowInputSchema.safeParse(workflowData);
  if (!validationResult.success) {
    console.error('Workflow data validation failed:', validationResult.error.errors);
    return {
      success: false,
      message: 'Invalid workflow data provided.',
      error: validationResult.error.flatten(),
    };
  }
  const validatedData: ApprovalWorkflowInput = validationResult.data;

  try {
    // 2. Define the workflow creation logic
    const createWorkflow = async (client: PrismaClient | Prisma.TransactionClient) => {
      // Create the main workflow record
      const newWorkflow = await client.approvalWorkflow.create({
        data: {
          organizationId: orgId,
          name: validatedData.name,
          description: validatedData.description,
          isActive: validatedData.isActive,
        },
      });

      // Create steps, conditions, and actions
      for (const stepData of validatedData.steps) {
        const newStep = await client.approvalWorkflowStep.create({
          data: {
            approvalWorkflowId: newWorkflow.id,
            stepNumber: stepData.stepNumber,
            name: stepData.name,
            description: stepData.description,
            allConditionsMustMatch: stepData.allConditionsMustMatch,
          },
        });

        // Create conditions for the step
        await client.approvalStepCondition.createMany({
          data: stepData.conditions.map(condition => ({
            stepId: newStep.id,
            type: condition.type,
            minAmount: condition.minAmount,
            maxAmount: condition.maxAmount,
            expenseCategoryId: condition.expenseCategoryId,
            locationId: condition.locationId,
          })),
        });

        // Create actions for the step
        await client.approvalStepAction.createMany({
          data: stepData.actions.map(action => ({
            stepId: newStep.id,
            type: action.type,
            approverRole: action.approverRole,
            specificMemberId: action.specificMemberId,
            approvalMode: action.approvalMode,
          })),
        });
      }

      return newWorkflow;
    };

    // 3. Execute with transaction client if provided, otherwise use a new transaction
    const result = tx
      ? await createWorkflow(tx)
      : await prismaClient.$transaction(createWorkflow);

    return {
      success: true,
      message: `Workflow '${result.name}' created successfully.`,
      workflowId: result.id,
    };
  } catch (error: unknown) {
    console.error('Error creating approval workflow:', error);
    let message = 'Failed to create approval workflow.';
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        message = `A workflow with the name '${validatedData.name}' already exists for this organization.`;
      }
    }
    return { success: false, message, error };
  } finally {
    // Only disconnect if no transaction client was provided
    if (!tx) {
      await prismaClient.$disconnect();
    }
  }
}

/**
 * Updates an existing expense approval workflow.
 * Note: This is complex due to nested relations. It often involves deleting
 * existing steps/conditions/actions and recreating them based on the input.
 * A simpler approach might be to only allow updating top-level workflow fields
 * or specific step details, rather than the entire structure at once.
 * This example updates basic workflow info; updating steps needs more logic.
 *
 * @param workflowId The ID of the workflow to update.
 * @param workflowUpdateData Data containing fields to update (use a partial Zod schema).
 * @returns Promise resolving to a WorkflowResult object.
 */
export async function updateApprovalWorkflowInfo(
  workflowId: string,
  workflowUpdateData: Partial<Pick<ApprovalWorkflowInput, 'name' | 'description' | 'isActive'>>
): Promise<WorkflowResult> {
  // Basic validation for the partial update
  if (!workflowUpdateData.name && !workflowUpdateData.description && workflowUpdateData.isActive === undefined) {
    return { success: false, message: 'No update data provided.' };
  }

  try {
    const updatedWorkflow = await db.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        name: workflowUpdateData.name,
        description: workflowUpdateData.description,
        isActive: workflowUpdateData.isActive,
      },
    });
    return { success: true, message: `Workflow '${updatedWorkflow.name}' info updated.`, workflowId };
  } catch (error: unknown) {
    console.error(`Error updating workflow info for ${workflowId}:`, error);
    let message = 'Failed to update workflow info.';
    // Add specific error handling (e.g., P2025 not found)
    return { success: false, message, error };
  }
  // For updating steps/conditions/actions:
  // 1. Fetch the existing workflow with all nested relations.
  // 2. Compare with the input data to identify changes.
  // 3. Use $transaction to:
  //    - Delete removed/modified steps/conditions/actions.
  //    - Update existing ones.
  //    - Create new ones.
  // This is significantly more complex logic.
}

/**
 * Sets the currently active expense approval workflow for an organization.
 *
 * @param orgId The ID of the organization.
 * @param workflowId The ID of the workflow to set as active (or null to deactivate).
 * @returns Promise resolving to a simple success/error object.
 */
export async function setActiveWorkflow(
  orgId: string,
  workflowId: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    // Optional: Verify the workflowId belongs to the org and is active before setting
    if (workflowId) {
      const workflow = await db.approvalWorkflow.findUnique({
        where: { id: workflowId },
        select: { organizationId: true, isActive: true },
      });
      if (!workflow || workflow.organizationId !== orgId) {
        return { success: false, message: 'Workflow not found or does not belong to the organization.' };
      }
      if (!workflow.isActive) {
        return { success: false, message: 'Cannot set an inactive workflow as active.' };
      }
    }

    await db.organization.update({
      where: { id: orgId },
      data: {
        activeExpenseWorkflowId: workflowId,
      },
    });
    const message = workflowId ? 'Workflow activated successfully.' : 'Expense approval workflow deactivated.';
    return { success: true, message };
  } catch (error) {
    console.error(`Error setting active workflow for Org ${orgId}:`, error);
    return { success: false, message: 'Failed to update active workflow.' };
  }
}

/**
 * Fetches the complete structure of an approval workflow.
 * @param workflowId The ID of the workflow.
 * @returns The workflow object with nested steps, conditions, and actions, or null if not found.
 */
export async function getWorkflowDetails(workflowId: string) {
  try {
    return await db.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }, // Ensure steps are ordered
          include: {
            conditions: {
              // Optional: include related category/location names
              include: { expenseCategory: true, location: true },
            },
            actions: {
              // Optional: include related member details
              include: { specificMember: true },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error(`Error fetching workflow details for ${workflowId}:`, error);
    return null;
  }
}
