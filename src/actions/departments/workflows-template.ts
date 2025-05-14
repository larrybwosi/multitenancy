// src/services/predefinedWorkflows.ts
import { createStructuredWorkflow } from './workflowTemplateService';
import { CreateWorkflowTemplateInput } from '@/lib/validations/workflowTemplates';
import {
  AssigneeType,
  FormFieldType,
  ActionType,
  ConditionSourceType,
  ConditionOperator,
  WorkflowTriggerType,
  DepartmentMemberRole,
} from '@/prisma/client'; // Import necessary enums

/**
 * Creates a standard 2-step document submission and approval workflow.
 * Step 1: Submitter uploads document.
 * Step 2: Assigned role approves or rejects.
 */
export async function createStandardDocumentApprovalWorkflow(
  organizationId: string,
  workflowName: string = 'Standard Document Approval',
  approverRole: DepartmentMemberRole | string = DepartmentMemberRole.MANAGER, // Can be a general role string if not using DepartmentMemberRole directly
  departmentId?: string
): Promise<any> {
  // Return type should be the full workflow from createStructuredWorkflow
  // console.log(`[PredefinedWorkflows] Creating standard document approval: ${workflowName}`);

  const definition: CreateWorkflowTemplateInput = {
    workflowName,
    description: `A standard 2-step workflow for document submission and approval by a ${approverRole}.`,
    organizationId,
    departmentId,
    triggerType: WorkflowTriggerType.MANUAL,
    initialStepName: 'submit_document',
    steps: [
      {
        stepName: 'submit_document',
        description: 'User submits a document for approval.',
        order: 1,
        assigneeLogic: { assigneeType: AssigneeType.SUBMITTER },
        formFields: [
          {
            fieldName: 'documentTitle',
            label: 'Document Title',
            fieldType: FormFieldType.TEXT,
            isRequired: true,
            order: 1,
          },
          {
            fieldName: 'documentFile',
            label: 'Upload Document',
            fieldType: FormFieldType.FILE_UPLOAD,
            isRequired: true,
            order: 2,
          },
          {
            fieldName: 'comments',
            label: 'Comments (Optional)',
            fieldType: FormFieldType.TEXTAREA,
            isRequired: false,
            order: 3,
          },
        ],
        actions: [{ name: 'submit', label: 'Submit for Approval', actionType: ActionType.PRIMARY, order: 1 }],
        transitions: [{ toStepName: 'approval_step', actionName: 'submit' }],
      },
      {
        stepName: 'approval_step',
        description: `Document is reviewed by ${approverRole}.`,
        order: 2,
        assigneeLogic: {
          assigneeType: AssigneeType.SPECIFIC_ROLE,
          specificRoleId: approverRole, // This assumes 'approverRole' is a string that your system understands as a role
        },
        formFields: [
          {
            fieldName: 'approvalComments',
            label: 'Approval Comments',
            fieldType: FormFieldType.TEXTAREA,
            isRequired: false,
            order: 1,
          },
          {
            fieldName: 'decision',
            label: 'Decision',
            fieldType: FormFieldType.RADIO_GROUP,
            isRequired: true,
            order: 2,
            options: [
              { value: 'approved', label: 'Approve' },
              { value: 'rejected', label: 'Reject' },
            ],
          },
        ],
        actions: [{ name: 'finalizeApproval', label: 'Finalize Decision', actionType: ActionType.PRIMARY, order: 1 }],
        transitions: [
          // This step is terminal for this simple predefined workflow.
          // A more complex one could transition to a "Rejected" or "Approved" status step.
          // Or the action "finalizeApproval" could implicitly end the workflow if no 'toStepName' is defined for its transition.
          // For clarity, we could add terminal steps:
          // { toStepName: "workflow_approved", actionName: "finalizeApproval", conditions: [{sourceType: ConditionSourceType.FORM_FIELD_VALUE, sourceFieldName: "decision", operator: ConditionOperator.EQUALS, comparisonValue: "approved", valueType: FormFieldType.TEXT}] },
          // { toStepName: "workflow_rejected", actionName: "finalizeApproval", conditions: [{sourceType: ConditionSourceType.FORM_FIELD_VALUE, sourceFieldName: "decision", operator: ConditionOperator.EQUALS, comparisonValue: "rejected", valueType: FormFieldType.TEXT}] }
        ],
      },
      // Optional terminal steps:
      // { stepName: "workflow_approved", description: "Workflow has been approved.", order: 3, assigneeLogic: {assigneeType: AssigneeType.UNASSIGNED}, actions: [], transitions: [] },
      // { stepName: "workflow_rejected", description: "Workflow has been rejected.", order: 3, assigneeLogic: {assigneeType: AssigneeType.UNASSIGNED}, actions: [], transitions: [] }
    ],
  };
  return createStructuredWorkflow(definition);
}

// You can add more predefined workflow functions here:
// - createBasicTaskManagementWorkflow(...)
// - createSimpleLeaveRequestWorkflow(...)
