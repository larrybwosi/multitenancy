import * as z from 'zod';

// A basic schema for a step in the workflow definition. This needs to be as complex as your workflow engine requires.
// This is a highly simplified example. Your actual step schema will depend on your workflow engine's capabilities.
export const workflowStepDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  assigneeType: z.enum(['SUBMITTER', 'SPECIFIC_ROLE', 'SPECIFIC_MEMBER', 'PREVIOUS_STEP_ASSIGNEE']),
  assigneeValue: z.string().optional(), // e.g., Role name, Member ID
  formSchema: z.record(z.any()).optional(), // JSON schema for forms in this step
  actions: z
    .array(
      z.object({
        // Possible actions from this step
        name: z.string(), // e.g., "Approve", "Reject", "Submit for Review"
        targetStepId: z.string(), // Which step to go to
        conditions: z.array(z.record(z.any())).optional(), // Conditions for this transition
      })
    )
    .optional(),
  // ... other properties like deadlines, notifications, etc.
});

export const workflowDefinitionSchema = z.object({
  initialStepId: z.string().optional(), // ID of the first step
  steps: z.array(workflowStepDefinitionSchema),
  // ... other global workflow properties like variables
});

export const createWorkflowSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  organizationId: z.string().cuid(),
  departmentId: z.string().cuid().optional(),
  triggerType: z.enum(['MANUAL', 'EVENT_BASED', 'SCHEDULED', 'API_CALL']).default('MANUAL'),
  definition: workflowDefinitionSchema, // The JSON definition
  isActive: z.boolean().default(true),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;

export const createWorkflowInstanceSchema = z.object({
  workflowId: z.string().cuid(),
  submittedById: z.string().cuid(),
  organizationId: z.string().cuid(), // Should match workflow.organizationId
  departmentId: z.string().cuid().optional(), // Should match workflow.departmentId
  context: z.record(z.any()).optional(), // Initial data for the workflow
  status: z
    .enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'ON_HOLD', 'AWAITING_INPUT'])
    .optional(),
});

export type CreateWorkflowInstanceInput = z.infer<typeof createWorkflowInstanceSchema>;
