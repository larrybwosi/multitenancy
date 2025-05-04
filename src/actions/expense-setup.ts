import { ExpenseCategory, MemberRole, Organization, Prisma } from '../../prisma/src/generated/prisma/client'; 
import prisma from '@/lib/db';

// --- Expense Category Management ---

/**
 * Creates a new expense category for a specific organization.
 *
 * @param {string} organizationId - The ID of the organization to which this category belongs.
 * @param {string} name - The name of the expense category (e.g., "Travel", "Office Supplies"). Must be unique within the organizat].
 * @param {string} [description] - An optional description for the categ].
 * @param {string} [code] - An optional short code for reporting purpo].
 * @returns {Promise<ExpenseCategory>} The newly created expense category object.
 * @throws {Error} If a category with the same name already exists for the organization.
 * @throws {Error} If the organization is not found.
 */
export async function createExpenseCategory(
  organizationId: string,
  name: string,
  description?: string,
  code?: string
): Promise<ExpenseCategory> {
  // Check if organization exists (optional, Prisma might handle this with relation constraints)
  const organizationExists = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true }, // Select only necessary field for existence check
  });
  if (!organizationExists) {
    throw new Error(`Organization with ID ${organizationId} not found.`);
  }

  try {
    // Attempt to create the new expense category
    const newCategory = await prisma.expenseCategory.create({
      data: {
        organizationId, // Associate with the organizati]
        name, // Category na]
        description, // Optional descripti]
        code, // Optional co]
        isActive: true, // Default to acti]
      },
    });
    console.log(`Expense category "${name}" created successfully for organization ${organizationId}.`);
    return newCategory;
  } catch (error) {
    // Handle potential errors, like unique constraint violation for name within the org
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (error.code === 'P2002') {
        // Unique constraint failed
        // Assuming the unique constraint is on (organizationId, nam]
        throw new Error(
          `An expense category with the name "${name}" already exists in organization ${organizationId}.`
        );
      }
    }
    // Re-throw other errors
    console.error('Error creating expense category:', error);
    //@ts-expect-error error type
    throw new Error(`Failed to create expense category: ${error.message}`);
  }
}

/**
 * Updates an existing expense category.
 *
 * @param {string} categoryId - The ID of the expense category to update.
 * @param {object} data - The data to update. Can include name, description, code, isActive.
 * @param {string} [data.name] - The new name for the category.
 * @param {string} [data.description] - The new description.
 * @param {string} [data.code] - The new code.
 * @param {boolean} [data.isActive] - The new active status.
 * @returns {Promise<ExpenseCategory>} The updated expense category object.
 * @throws {Error} If the category is not found.
 * @throws {Error} If update fails (e.g., unique constraint violation if name is changed to an existing one).
 */
export async function updateExpenseCategory(
  categoryId: string,
  data: {
    name?: string;
    description?: string | null; // Allow setting description to null
    code?: string | null; // Allow setting code to null
    isActive?: boolean;
  }
): Promise<ExpenseCategory> {
  try {
    // Attempt to update the category
    const updatedCategory = await prisma.expenseCategory.update({
      where: { id: categoryId },
      data: {
        // Only include fields that are provided in the data object
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    console.log(`Expense category ${categoryId} updated successfully.`);
    return updatedCategory;
  } catch (error) {
    // Handle potential errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // Record to update not found
        throw new Error(`Expense category with ID ${categoryId} not found.`);
      }
      if (error.code === 'P2002') {
        // Unique constraint failed (e.g., name conflict)
        throw new Error(`Update failed: An expense category with the provided name might already exist.`);
      }
    }
    console.error('Error updating expense category:', error);
    //@ts-expect-error error type
    throw new Error(`Failed to update expense category: ${error.message}`);
  }
}

/**
 * Fetches all expense categories for a specific organization.
 * Optionally filters by active status.
 *
 * @param {string} organizationId - The ID of the organization.
 * @param {boolean} [onlyActive=true] - If true (default), fetches only active categories. If false, fetches all.
 * @returns {Promise<ExpenseCategory[]>} An array of expense category objects.
 */
export async function getExpenseCategories(organizationId: string, onlyActive: boolean = true): Promise<ExpenseCategory[]> {
  const categories = await prisma.expenseCategory.findMany({
    where: {
      organizationId, // Filter by organizati]
      ...(onlyActive && { isActive: true }), // Conditionally add filter for active stat]
    },
    orderBy: {
      name: 'asc', // Order alphabetically by name
    },
  });
  return categories;
}

// --- Organization Expense Configuration ---

/**
 * Updates the expense-related configuration settings for an organization.
 * Allows updating thresholds, requirements, approval chain logic, tags, etc.
 *
 * @param {string} organizationId - The ID of the organization to configure.
 * @param {object} configData - An object containing the configuration settings to update.
 * @param {boolean} [configData.expenseApprovalRequired] - Whether expenses generally require appro.
 * @param {number | null} [configData.expenseApprovalThreshold] - Amount above which approval is mandatory. Use null to remove thresh.
 * @param {boolean} [configData.expenseReceiptRequired] - Whether receipts are generally mandat.
 * @param {number | null} [configData.expenseReceiptThreshold] - Amount above which a receipt is mandatory. Use null to remove thresh.
 * @param {string} [configData.defaultExpenseCurrency] - Default currency (e.g., "USD", "EU.
 * @param {Prisma.InputJsonValue | null} [configData.expenseApprovalChain] - JSON configuration for the approval workf. Use null to clear.
 * @param {string[]} [configData.expenseTagOptions] - Array of predefined tags for expen. Replaces existing tags.
 * @returns {Promise<Organization>} The updated organization object with new expense settings.
 * @throws {Error} If the organization is not found.
 * @throws {Error} If the update fails.
 */
export async function configureOrganizationExpenses(
  organizationId: string,
  configData: {
    expenseApprovalRequired?: boolean;
    expenseApprovalThreshold?: number | null;
    expenseReceiptRequired?: boolean;
    expenseReceiptThreshold?: number | null;
    defaultExpenseCurrency?: string;
    expenseApprovalChain?: Prisma.InputJsonValue | null;
    expenseTagOptions?: string[];
  }
): Promise<Organization> {
  // Convert numeric thresholds to Prisma's Decimal type if necessary, or handle null
  const mapThreshold = (value: number | null | undefined): Prisma.Decimal | null | undefined => {
    if (value === null) return null; // Explicitly set to null
    if (value === undefined) return undefined; // Don't include in update if not provided
    return new Prisma.Decimal(value); // Convert number to Decimal
  };

  try {
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        // Use spread syntax conditionally only if the value is defined in configData
        ...(configData.expenseApprovalRequired !== undefined && {
          expenseApprovalRequired: configData.expenseApprovalRequired,
        }), 
        ...(configData.expenseApprovalThreshold !== undefined && {
          expenseApprovalThreshold: mapThreshold(configData.expenseApprovalThreshold),
        }), 
        ...(configData.expenseReceiptRequired !== undefined && {
          expenseReceiptRequired: configData.expenseReceiptRequired,
        }), 
        ...(configData.expenseReceiptThreshold !== undefined && {
          expenseReceiptThreshold: mapThreshold(configData.expenseReceiptThreshold),
        }), 
        ...(configData.defaultExpenseCurrency !== undefined && {
          defaultExpenseCurrency: configData.defaultExpenseCurrency,
        }),
        ...(configData.expenseApprovalChain !== undefined && { 
          expenseApprovalChain: configData.expenseApprovalChain === null ? Prisma.JsonNull : configData.expenseApprovalChain 
        }),
        ...(configData.expenseTagOptions !== undefined && { expenseTagOptions: configData.expenseTagOptions }),
      },
    });
    console.log(`Expense configuration updated successfully for organization ${organizationId}.`);
    return updatedOrganization;
  } catch (error) {
    // Handle potential errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // Record to update not found
        throw new Error(`Organization with ID ${organizationId} not found.`);
      }
    }
    console.error('Error updating organization expense configuration:', error);
    //@ts-expect-error error type
    throw new Error(`Failed to update organization expense configuration: ${error.message}`);
  }
}

/**
 * Retrieves the current expense configuration for an organization.
 *
 * @param {string} organizationId - The ID of the organization.
 * @returns {Promise<object>} An object containing the expense-related fields from the organization.
 * @throws {Error} If the organization is not found.
 */
export async function getOrganizationExpenseConfiguration(organizationId: string): Promise<{
  expenseApprovalRequired: boolean;
  expenseApprovalThreshold: Prisma.Decimal | null;
  expenseReceiptRequired: boolean;
  expenseReceiptThreshold: Prisma.Decimal | null;
  defaultExpenseCurrency: string;
  expenseTagOptions: string[];
}> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      expenseApprovalRequired: true, 
      expenseApprovalThreshold: true, 
      expenseReceiptRequired: true, 
      expenseReceiptThreshold: true, 
      defaultExpenseCurrency: true,
      expenseTagOptions: true,
    },
  });

  if (!organization) {
    throw new Error(`Organization with ID ${organizationId} not found.`);
  }

  // Prisma returns Decimal type for Decimal fields, and JsonValue for Json fields
  // Adjust types if necessary for your application logic, e.g., convert Decimal back to number
  return organization;
}

/**
 * Deletes an expense category.
 * 
 * @param {string} categoryId - The ID of the expense category to delete.
 * @returns {Promise<ExpenseCategory>} The deleted expense category object.
 * @throws {Error} If the category is not found.
 * @throws {Error} If the category cannot be deleted (e.g., if it's referenced by expenses).
 */
export async function deleteExpenseCategory(categoryId: string): Promise<ExpenseCategory> {
  try {
    const deletedCategory = await prisma.expenseCategory.delete({
      where: { id: categoryId },
    });
    console.log(`Expense category ${categoryId} deleted successfully.`);
    return deletedCategory;
  } catch (error) {
    // Handle potential errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // Record to delete not found
        throw new Error(`Expense category with ID ${categoryId} not found.`);
      }
      if (error.code === 'P2003') {
        // Foreign key constraint violation (category is referenced by expenses)
        throw new Error(
          `Cannot delete category ${categoryId} because it's being used by existing expenses. ` +
          `Consider deactivating it instead by setting isActive to false.`
        );
      }
    }
    console.error('Error deleting expense category:', error);
    //@ts-expect-error error type
    throw new Error(`Failed to delete expense category: ${error.message}`);
  }
}

// --- Approval Workflow Management ---

/**
 * Creates a new approval workflow for an organization.
 * 
 * @param organizationId - The ID of the organization that will own this workflow
 * @param name - The name of the workflow (must be unique within the org)
 * @param description - Optional description of the workflow
 * @param isActive - Whether the workflow should be active by default
 * @returns The newly created ApprovalWorkflow
 */
export async function createApprovalWorkflow(
  organizationId: string,
  name: string,
  description?: string,
  isActive: boolean = true
) {
  try {
    // Check if organization exists
    const organizationExists = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    
    if (!organizationExists) {
      throw new Error(`Organization with ID ${organizationId} not found.`);
    }

    // Create the workflow
    const workflow = await prisma.approvalWorkflow.create({
      data: {
        name,
        description,
        isActive,
        organization: {
          connect: { id: organizationId }
        }
      }
    });

    console.log(`Approval workflow "${name}" created for organization ${organizationId}`);
    return workflow;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error(`A workflow with the name "${name}" already exists in this organization.`);
      }
    }
    console.error('Error creating approval workflow:', error);
    //@ts-expect-error error type
    throw new Error(`Failed to create approval workflow: ${error.message}`);
  }
}

/**
 * Updates an existing approval workflow.
 * 
 * @param workflowId - The ID of the workflow to update
 * @param data - The data to update (name, description, isActive)
 * @returns The updated ApprovalWorkflow
 */
export async function updateApprovalWorkflow(
  workflowId: string,
  data: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
  }
) {
  try {
    const updatedWorkflow = await prisma.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      }
    });

    console.log(`Approval workflow ${workflowId} updated successfully.`);
    return updatedWorkflow;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error(`Approval workflow with ID ${workflowId} not found.`);
      }
      if (error.code === 'P2002') {
        throw new Error(`Update failed: A workflow with the provided name already exists in this organization.`);
      }
    }
    console.error('Error updating approval workflow:', error);
    //@ts-expect-error error type
    throw new Error(`Failed to update approval workflow: ${error.message}`);
  }
}

/**
 * Gets all approval workflows for an organization.
 * Optionally filters by active status.
 * 
 * @param organizationId - The ID of the organization
 * @param onlyActive - If true (default), returns only active workflows
 * @returns Array of ApprovalWorkflow objects
 */
export async function getApprovalWorkflows(
  organizationId: string,
  onlyActive: boolean = false
) {
  try {
    const workflows = await prisma.approvalWorkflow.findMany({
      where: {
        organizationId,
        ...(onlyActive && { isActive: true })
      },
      orderBy: { name: 'asc' },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            conditions: true,
            actions: true
          }
        }
      }
    });

    return workflows;
  } catch (error) {
    console.error('Error fetching approval workflows:', error);
    //@ts-expect-error error type
    throw new Error(`Failed to fetch approval workflows: ${error.message}`);
  }
}

/**
 * Gets a single approval workflow by ID with all its steps, conditions, and actions.
 * 
 * @param workflowId - The ID of the workflow to retrieve
 * @returns The ApprovalWorkflow with its steps, conditions, and actions
 */
export async function getApprovalWorkflow(workflowId: string) {
  try {
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
          include: {
            conditions: {
              include: {
                expenseCategory: true,
                location: true,
              }
            },
            actions: {
              include: {
                specificMember: true,
              }
            }
          }
        }
      }
    });

    if (!workflow) {
      throw new Error(`Approval workflow with ID ${workflowId} not found.`);
    }

    return workflow;
  } catch (error) {
    console.error(`Error fetching approval workflow ${workflowId}:`, error);
    //@ts-expect-error error type
    throw new Error(`Failed to fetch approval workflow: ${error.message}`);
  }
}

/**
 * Sets a workflow as the active one for an organization.
 * 
 * @param organizationId - The ID of the organization
 * @param workflowId - The ID of the workflow to set as active
 * @returns The updated Organization
 */
export async function setActiveWorkflow(
  organizationId: string,
  workflowId: string
) {
  try {
    // Verify the workflow exists and belongs to this organization
    const workflow = await prisma.approvalWorkflow.findFirst({
      where: {
        id: workflowId,
        organizationId
      }
    });

    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} not found or does not belong to organization ${organizationId}.`);
    }

    // Update the organization's active workflow
    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        activeExpenseWorkflow: {
          connect: { id: workflowId }
        },
        // Enable approval requirement when setting an active workflow
        expenseApprovalRequired: true
      }
    });

    console.log(`Workflow ${workflowId} set as active for organization ${organizationId}.`);
    return organization;
  } catch (error) {
    console.error('Error setting active workflow:', error);
    //@ts-expect-error error type
    throw new Error(`Failed to set active workflow: ${error.message}`);
  }
}

/**
 * Deletes an approval workflow.
 * 
 * @param workflowId - The ID of the workflow to delete
 * @returns The deleted ApprovalWorkflow
 */
export async function deleteApprovalWorkflow(workflowId: string) {
  try {
    // First, check if this workflow is set as active for any organization
    const organization = await prisma.organization.findFirst({
      where: { activeExpenseWorkflowId: workflowId },
      select: { id: true, name: true }
    });

    if (organization) {
      throw new Error(
        `Cannot delete workflow ${workflowId} because it is currently set as the active workflow for organization ${organization.name}. Please set a different active workflow first.`
      );
    }

    // Delete the workflow (Prisma should cascade delete the steps, conditions, and actions)
    const deletedWorkflow = await prisma.approvalWorkflow.delete({
      where: { id: workflowId },
      include: { steps: true } // Include steps for reference in the return value
    });

    console.log(`Approval workflow ${workflowId} deleted successfully.`);
    return deletedWorkflow;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error(`Approval workflow with ID ${workflowId} not found.`);
      }
      if (error.code === 'P2003') {
        throw new Error(
          `Cannot delete workflow ${workflowId} because it's referenced by other data.`
        );
      }
    }
    console.error('Error deleting approval workflow:', error);
    //@ts-expect-error error type
    throw new Error(`Failed to delete approval workflow: ${error.message}`);
  }
}

/**
 * Adds a new step to an approval workflow.
 * 
 * @param workflowId - The ID of the workflow to add the step to
 * @param stepData - The data for the new step
 * @returns The created ApprovalWorkflowStep
 */
export async function addWorkflowStep(
  workflowId: string,
  stepData: {
    name: string;
    description?: string;
    stepNumber: number;
    allConditionsMustMatch?: boolean;
  }
) {
  try {
    // Verify the workflow exists
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
      include: { steps: { orderBy: { stepNumber: 'asc' } } }
    });

    if (!workflow) {
      throw new Error(`Approval workflow with ID ${workflowId} not found.`);
    }

    // Create the step
    const step = await prisma.approvalWorkflowStep.create({
      data: {
        workflow: { connect: { id: workflowId } },
        name: stepData.name,
        description: stepData.description,
        stepNumber: stepData.stepNumber,
        allConditionsMustMatch: stepData.allConditionsMustMatch ?? true
      }
    });

    console.log(`Step "${stepData.name}" added to workflow ${workflowId} at position ${stepData.stepNumber}.`);
    return step;
  } catch (error) {
    console.error('Error adding workflow step:', error);
    //@ts-expect-error error type
    throw new Error(`Failed to add workflow step: ${error.message}`);
  }
}

/**
 * Adds a condition to a workflow step.
 * 
 * @param stepId - The ID of the step to add the condition to
 * @param conditionData - The data for the new condition
 * @returns The created ApprovalStepCondition
 */
export async function addStepCondition(
  stepId: string,
  conditionData: {
    type: 'AMOUNT_RANGE' | 'EXPENSE_CATEGORY' | 'LOCATION';
    minAmount?: number;
    maxAmount?: number;
    expenseCategoryId?: string;
    locationId?: string;
  }
) {
  try {
    // Verify the step exists
    const step = await prisma.approvalWorkflowStep.findUnique({
      where: { id: stepId }
    });

    if (!step) {
      throw new Error(`Approval workflow step with ID ${stepId} not found.`);
    }

    // Process condition data based on type
    const conditionCreateData: Prisma.ApprovalStepConditionCreateInput = {
      step: { connect: { id: stepId } },
      type: conditionData.type,
    };

    switch (conditionData.type) {
      case 'AMOUNT_RANGE':
        if (conditionData.minAmount !== undefined) {
          conditionCreateData.minAmount = new Prisma.Decimal(conditionData.minAmount);
        }
        if (conditionData.maxAmount !== undefined) {
          conditionCreateData.maxAmount = new Prisma.Decimal(conditionData.maxAmount);
        }
        break;
      case 'EXPENSE_CATEGORY':
        if (!conditionData.expenseCategoryId) {
          throw new Error('expenseCategoryId is required for EXPENSE_CATEGORY condition type.');
        }
        conditionCreateData.expenseCategory = { 
          connect: { id: conditionData.expenseCategoryId } 
        };
        break;
      case 'LOCATION':
        if (!conditionData.locationId) {
          throw new Error('locationId is required for LOCATION condition type.');
        }
        conditionCreateData.location = { 
          connect: { id: conditionData.locationId } 
        };
        break;
      default:
        throw new Error(`Unsupported condition type: ${conditionData.type}`);
    }

    // Create the condition
    const condition = await prisma.approvalStepCondition.create({
      data: conditionCreateData
    });

    console.log(`Condition of type ${conditionData.type} added to step ${stepId}.`);
    return condition;
  } catch (error) {
    console.error('Error adding step condition:', error);
    //@ts-expect-error error type
    throw new Error(`Failed to add step condition: ${error.message}`);
  }
}

/**
 * Adds an action (required approver) to a workflow step.
 * 
 * @param stepId - The ID of the step to add the action to
 * @param actionData - The data for the new action
 * @returns The created ApprovalStepAction
 */
export async function addStepAction(
  stepId: string,
  actionData: {
    type: 'ROLE' | 'SPECIFIC_MEMBER';
    approverRole?: MemberRole;
    specificMemberId?: string;
    approvalMode?: 'ANY_ONE' | 'ALL';
  }
) {
  try {
    // Verify the step exists
    const step = await prisma.approvalWorkflowStep.findUnique({
      where: { id: stepId }
    });

    if (!step) {
      throw new Error(`Approval workflow step with ID ${stepId} not found.`);
    }

    // Process action data based on type
    const actionCreateData: Prisma.ApprovalStepActionCreateInput = {
      step: { connect: { id: stepId } },
      type: actionData.type,
      approvalMode: actionData.approvalMode || 'ANY_ONE'
    };

    switch (actionData.type) {
      case 'ROLE':
        if (!actionData.approverRole) {
          throw new Error('approverRole is required for ROLE action type.');
        }
        actionCreateData.approverRole = actionData.approverRole;
        break;
      case 'SPECIFIC_MEMBER':
        if (!actionData.specificMemberId) {
          throw new Error('specificMemberId is required for SPECIFIC_MEMBER action type.');
        }
        actionCreateData.specificMember = { 
          connect: { id: actionData.specificMemberId } 
        };
        break;
      default:
        throw new Error(`Unsupported action type: ${actionData.type}`);
    }

    // Create the action
    const action = await prisma.approvalStepAction.create({
      data: actionCreateData
    });

    console.log(`Action of type ${actionData.type} added to step ${stepId}.`);
    return action;
  } catch (error) {
    console.error('Error adding step action:', error);
    //@ts-expect-error error type
    throw new Error(`Failed to add step action: ${error.message}`);
  }
}

// Example Usage (ensure you handle promises correctly in your application)
/*
async function main() {
  const orgId = 'your_organization_id'; // Replace with a valid organization ID

  // Example: Create a category
  try {
    const travelCategory = await createExpenseCategory(orgId, 'Travel', 'Expenses related to business travel', 'TRV');
    const officeCategory = await createExpenseCategory(orgId, 'Office Supplies', 'General office consumables');
    console.log('Categories created:', travelCategory, officeCategory);
  } catch (error) {
    console.error(error.message);
  }

  // Example: Configure organization expenses
  try {
    const updatedOrg = await configureOrganizationExpenses(orgId, {
      expenseApprovalRequired: true,
      expenseApprovalThreshold: 500.00, // Approval needed above $500
      expenseReceiptRequired: true,
      expenseReceiptThreshold: 25.00,  // Receipt needed above $25
      defaultExpenseCurrency: 'CAD',
      expenseTagOptions: ['Client Meeting', 'Conference', 'Internal', 'Project X'],
      expenseApprovalChain: { type: 'manager' } // Simple manager approval
    });
    console.log('Organization configured:', updatedOrg.id);
  } catch (error) {
    console.error(error.message);
  }

  // Example: Get categories
  try {
    const categories = await getExpenseCategories(orgId);
    console.log('Active categories:', categories);
  } catch (error) {
    console.error(error.message);
  }

   // Example: Get configuration
  try {
    const config = await getOrganizationExpenseConfiguration(orgId);
    console.log('Current expense config:', config);
    // Example: Accessing a Decimal value (convert to number if needed)
    const approvalThreshold = config.expenseApprovalThreshold ? config.expenseApprovalThreshold.toNumber() : null;
    console.log('Approval threshold as number:', approvalThreshold);
  } catch (error) {
    console.error(error.message);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
*/
