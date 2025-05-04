import { z } from 'zod';
import { MemberRole, Prisma } from '../../../prisma/src/generated/prisma/client';

// --- Enums for Zod ---
// Re-define enums for Zod validation if not directly importing from Prisma types
const ConditionTypeEnum = z.enum([
  'AMOUNT_RANGE',
  'EXPENSE_CATEGORY',
  'LOCATION',
  // Add others from schema
]);

const ActionTypeEnum = z.enum([
  'ROLE',
  'SPECIFIC_MEMBER',
  // Add others from schema
]);

const ApprovalModeEnum = z.enum(['ANY_ONE', 'ALL']);

// --- Schemas ---

// For ApprovalStepCondition
const ApprovalStepConditionSchema = z
  .object({
    type: ConditionTypeEnum,
    minAmount: z
      .union([z.number(), z.instanceof(Prisma.Decimal), z.string()])
      .optional()
      .nullable()
      .transform(val => (val ? new Prisma.Decimal(val.toString()) : null)),
    maxAmount: z
      .union([z.number(), z.instanceof(Prisma.Decimal), z.string()])
      .optional()
      .nullable()
      .transform(val => (val ? new Prisma.Decimal(val.toString()) : null)),
    expenseCategoryId: z.string().cuid().optional().nullable(),
    locationId: z.string().cuid().optional().nullable(),
    // Add other condition fields here
  })
  .refine(
    data => {
      // Add cross-field validation if needed, e.g., minAmount < maxAmount
      if (data.type === 'AMOUNT_RANGE' && data.minAmount === null && data.maxAmount === null) {
        return false; // Amount range type needs at least one amount
      }
      if (data.type === 'EXPENSE_CATEGORY' && !data.expenseCategoryId) {
        return false; // Category type needs category ID
      }
      // Add more specific validation logic per type
      return true;
    },
    {
      message: 'Invalid condition configuration for the selected type.',
    }
  );

// For ApprovalStepAction
const ApprovalStepActionSchema = z
  .object({
    type: ActionTypeEnum,
    approverRole: z.nativeEnum(MemberRole).optional().nullable(), 
    specificMemberId: z.string().cuid().optional().nullable(),
    approvalMode: ApprovalModeEnum.default('ANY_ONE'),
  })
  .refine(
    data => {
      if (data.type === 'ROLE' && !data.approverRole) {
        return false; // Role type needs a role
      }
      if (data.type === 'SPECIFIC_MEMBER' && !data.specificMemberId) {
        return false; // Specific member type needs an ID
      }
      // Add more specific validation
      return true;
    },
    {
      message: 'Invalid action configuration for the selected type.',
    }
  );

// For ApprovalWorkflowStep
const ApprovalWorkflowStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  name: z.string().min(1, 'Step name cannot be empty.'),
  description: z.string().optional().nullable(),
  allConditionsMustMatch: z.boolean().default(true),
  conditions: z.array(ApprovalStepConditionSchema).min(1, 'Each step must have at least one condition.'),
  actions: z.array(ApprovalStepActionSchema).min(1, 'Each step must have at least one action.'),
});

// For creating/updating an entire ApprovalWorkflow
export const ApprovalWorkflowInputSchema = z.object({
  name: z.string().min(1, 'Workflow name cannot be empty.'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(), // Usually managed by setActiveWorkflow
  steps: z
    .array(ApprovalWorkflowStepSchema)
    .min(1, 'Workflow must have at least one step.')
    .refine(
      steps => {
        // Check for unique step numbers
        const stepNumbers = steps.map(s => s.stepNumber);
        return new Set(stepNumbers).size === stepNumbers.length;
      },
      { message: 'Step numbers must be unique within the workflow.' }
    ),
});

// Type alias for easier use
export type ApprovalWorkflowInput = z.infer<typeof ApprovalWorkflowInputSchema>;
export type ApprovalWorkflowStepInput = z.infer<typeof ApprovalWorkflowStepSchema>;
export type ApprovalStepConditionInput = z.infer<typeof ApprovalStepConditionSchema>;
export type ApprovalStepActionInput = z.infer<typeof ApprovalStepActionSchema>;
