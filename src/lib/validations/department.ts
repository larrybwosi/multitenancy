// src/lib/validations/department.ts
import * as z from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(3, { message: 'Department name must be at least 3 characters long.' }).max(100),
  description: z.string().max(500).optional(),
  organizationId: z.string().cuid({ message: 'Invalid organization ID.' }),
  // departmentHeadIds: z.array(z.string().cuid()).min(1, { message: "At least one department head must be assigned." }), // If passed directly
  activeBudgetId: z.string().cuid().optional(),
  defaultWorkflowId: z.string().cuid().optional(),
  customFields: z.record(z.any()).optional(), // For JSON fields
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  id: z.string().cuid(),
});

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export const departmentMemberSchema = z.object({
  departmentId: z.string().cuid(),
  memberId: z.string().cuid(),
  role: z.enum(['HEAD', 'MANAGER', 'MEMBER', 'VIEWER']), // Matches DepartmentMemberRole enum
  canApproveExpenses: z.boolean().optional(),
  canManageBudget: z.boolean().optional(),
});

export type DepartmentMemberInput = z.infer<typeof departmentMemberSchema>;
