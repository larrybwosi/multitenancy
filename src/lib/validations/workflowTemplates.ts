import * as z from 'zod';
import { AssigneeType, FormFieldType, ConditionSourceType, ConditionOperator, StepActionType, WorkflowTriggerType } from '@/prisma/client';

export const stepAssigneeLogicSchema = z.object({
  assigneeType: z.nativeEnum(AssigneeType),
  specificRoleId: z.string().cuid().optional(),
  specificMemberId: z.string().cuid().optional(),
});

export const stepFormFieldSchema = z.object({
  fieldName: z.string().regex(/^[a-zA-Z0-9_]+$/, 'Field name can only contain letters, numbers, and underscores.'),
  label: z.string().min(1),
  fieldType: z.nativeEnum(FormFieldType),
  isRequired: z.boolean().default(false),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // For dropdowns etc.
  validationRules: z.record(z.any()).optional(),
  order: z.number().int().positive(),
});

export const transitionConditionSchema = z.object({
  sourceType: z.nativeEnum(ConditionSourceType),
  sourceFieldName: z.string().optional(),
  operator: z.nativeEnum(ConditionOperator),
  comparisonValue: z.string(), // Needs careful handling for type conversion
  valueType: z.nativeEnum(FormFieldType).default(FormFieldType.TEXT),
});

export const stepTransitionSchema = z.object({
  toStepName: z.string(), // Reference to another step's name within the same workflow creation payload
  actionName: z.string().optional(), // Reference to an action's name on the current step
  description: z.string().optional(),
  priority: z.number().int().default(0),
  isAutomatic: z.boolean().default(false),
  conditions: z.array(transitionConditionSchema).optional(),
});

export const stepActionSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_]+$/, 'Action name can only contain letters, numbers, and underscores.'),
  label: z.string().min(1),
  actionType: z.nativeEnum(StepActionType).default(StepActionType.PRIMARY),
  order: z.number().int().positive(),
  // Transitions are defined in stepTransitionSchema linking back to this action by name
});

// This is the input for defining a single step when creating/updating a workflow
export const workflowStepInputSchema = z.object({
  stepName: z.string().min(1), // Unique name for this step within the workflow definition
  description: z.string().optional(),
  order: z.number().int().positive(),
  assigneeLogic: stepAssigneeLogicSchema.optional(),
  formFields: z.array(stepFormFieldSchema).optional(),
  actions: z.array(stepActionSchema).optional(),
  transitions: z.array(stepTransitionSchema).optional(), // Define transitions from this step
});

// Input for creating an entire workflow template
export const createWorkflowTemplateInputSchema = z.object({
  workflowName: z.string().min(3),
  description: z.string().optional(),
  organizationId: z.string().cuid(),
  departmentId: z.string().cuid().optional(),
  triggerType: z.nativeEnum(WorkflowTriggerType).default(WorkflowTriggerType.MANUAL),
  initialStepName: z.string().min(1), // Name of the first step (must match one of the stepNames in the steps array)
  steps: z.array(workflowStepInputSchema).min(1, 'A workflow must have at least one step.'),
});
export type CreateWorkflowTemplateInput = z.infer<typeof createWorkflowTemplateInputSchema>;
export type WorkflowStepInput = z.infer<typeof workflowStepInputSchema>;
