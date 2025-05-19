// import { CreateWorkflowTemplateInput } from '@/lib/validations/workflowTemplates';
// import {
//   AssigneeType,
//   FormFieldType,
//   WorkflowTriggerType,
//   DepartmentMemberRole,
//   StepActionType,
// } from '@/prisma/client';
// import { createStructuredWorkflow } from './workflowTemplate';

// /**
//  * Creates a standard 2-step document submission and approval workflow.
//  * Step 1: Submitter uploads document.
//  * Step 2: Assigned role approves or rejects.
//  */
// export async function createStandardDocumentApprovalWorkflow(
//   organizationId: string,
//   workflowName: string = 'Standard Document Approval',
//   approverRole: DepartmentMemberRole | string = DepartmentMemberRole.MANAGER, // Can be a general role string if not using DepartmentMemberRole directly
//   departmentId?: string
// ) {
//   // Return type should be the full workflow from createStructuredWorkflow
//   // console.log(`[PredefinedWorkflows] Creating standard document approval: ${workflowName}`);

//   const definition: CreateWorkflowTemplateInput = {
//     workflowName,
//     description: `A standard 2-step workflow for document submission and approval by a ${approverRole}.`,
//     organizationId,
//     departmentId,
//     triggerType: WorkflowTriggerType.MANUAL,
//     initialStepName: 'submit_document',
//     steps: [
//       {
//         stepName: 'submit_document',
//         description: 'User submits a document for approval.',
//         order: 1,
//         assigneeLogic: { assigneeType: AssigneeType.SUBMITTER },
//         formFields: [
//           {
//             fieldName: 'documentTitle',
//             label: 'Document Title',
//             fieldType: FormFieldType.TEXT,
//             isRequired: true,
//             order: 1,
//           },
//           {
//             fieldName: 'documentFile',
//             label: 'Upload Document',
//             fieldType: FormFieldType.FILE_UPLOAD,
//             isRequired: true,
//             order: 2,
//           },
//           {
//             fieldName: 'comments',
//             label: 'Comments (Optional)',
//             fieldType: FormFieldType.TEXTAREA,
//             isRequired: false,
//             order: 3,
//           },
//         ],
//         actions: [{ name: 'submit', label: 'Submit for Approval', actionType: StepActionType.PRIMARY, order: 1 }],
//         // transitions: [{ toStepName: 'approval_step', actionName: 'submit' }],

//       },
//       {
//         stepName: 'approval_step',
//         description: `Document is reviewed by ${approverRole}.`,
//         order: 2,
//         assigneeLogic: {
//           assigneeType: AssigneeType.SPECIFIC_ROLE,
//           specificRoleId: approverRole, // This assumes 'approverRole' is a string that your system understands as a role
//         },
//         formFields: [
//           {
//             fieldName: 'approvalComments',
//             label: 'Approval Comments',
//             fieldType: FormFieldType.TEXTAREA,
//             isRequired: false,
//             order: 1,
//           },
//           {
//             fieldName: 'decision',
//             label: 'Decision',
//             fieldType: FormFieldType.RADIO_GROUP,
//             isRequired: true,
//             order: 2,
//             options: [
//               { value: 'approved', label: 'Approve' },
//               { value: 'rejected', label: 'Reject' },
//             ],
//           },
//         ],
//         actions: [{ name: 'finalizeApproval', label: 'Finalize Decision', actionType: StepActionType.PRIMARY, order: 1 }],
//         transitions: [
//           // This step is terminal for this simple predefined workflow.
//           // A more complex one could transition to a "Rejected" or "Approved" status step.
//           // Or the action "finalizeApproval" could implicitly end the workflow if no 'toStepName' is defined for its transition.
//           // For clarity, we could add terminal steps:
//           // { toStepName: "workflow_approved", actionName: "finalizeApproval", conditions: [{sourceType: ConditionSourceType.FORM_FIELD_VALUE, sourceFieldName: "decision", operator: ConditionOperator.EQUALS, comparisonValue: "approved", valueType: FormFieldType.TEXT}] },
//           // { toStepName: "workflow_rejected", actionName: "finalizeApproval", conditions: [{sourceType: ConditionSourceType.FORM_FIELD_VALUE, sourceFieldName: "decision", operator: ConditionOperator.EQUALS, comparisonValue: "rejected", valueType: FormFieldType.TEXT}] }
//         ],
//       },
//       // Optional terminal steps:
//       // { stepName: "workflow_approved", description: "Workflow has been approved.", order: 3, assigneeLogic: {assigneeType: AssigneeType.UNASSIGNED}, actions: [], transitions: [] },
//       // { stepName: "workflow_rejected", description: "Workflow has been rejected.", order: 3, assigneeLogic: {assigneeType: AssigneeType.UNASSIGNED}, actions: [], transitions: [] }
//     ],
//   };
//   return createStructuredWorkflow(definition);
// }

// // You can add more predefined workflow functions here:
// // - createBasicTaskManagementWorkflow(...)
// // - createSimpleLeaveRequestWorkflow(...)

// export const purchaseRequestWorkflow: CreateWorkflowTemplateInput = {
//   workflowName: 'Purchase Request Approval',
//   description: 'Workflow for submitting and approving purchase requests.',
//   organizationId: 'org_123', // Replace with actual organization ID
//   departmentId: 'dept_789', // Replace with actual department ID
//   triggerType: 'MANUAL',
//   initialStepName: 'Submit_Request',
//   steps: [
//     {
//       stepName: 'Submit_Request',
//       description: 'Employee submits a purchase request.',
//       order: 1,
//       assigneeLogic: {
//         assigneeType: 'SUBMITTER', // Changed from "ANY_MEMBER" to "SUBMITTER"
//       },
//       formFields: [
//         {
//           fieldName: 'item_description',
//           label: 'Item Description',
//           fieldType: 'TEXT',
//           isRequired: true,
//           order: 1,
//         },
//         {
//           fieldName: 'estimated_cost',
//           label: 'Estimated Cost',
//           fieldType: 'NUMBER',
//           isRequired: true,
//           order: 2,
//         },
//       ],
//       actions: [
//         {
//           name: 'submit_request',
//           label: 'Submit Request',
//           actionType: 'PRIMARY',
//           order: 1,
//         },
//       ],
//       transitions: [
//         {
//           toStepName: 'Manager_Review',
//           actionName: 'submit_request',
//           description: 'Send to manager for review.',
//           priority: 1,
//           isAutomatic: true,
//         },
//       ],
//     },
//     {
//       stepName: 'Manager_Review',
//       description: 'Manager reviews the purchase request.',
//       order: 2,
//       assigneeLogic: {
//         assigneeType: 'SPECIFIC_ROLE',
//         specificRoleId: 'role_department_manager', // Department Manager role ID
//       },
//       formFields: [
//         {
//           fieldName: 'manager_comments',
//           label: 'Manager Comments',
//           fieldType: 'TEXTAREA',
//           order: 1,
//           isRequired: false,
//         },
//       ],
//       actions: [
//         {
//           name: 'approve',
//           label: 'Approve',
//           actionType: 'PRIMARY',
//           order: 1,
//         },
//         {
//           name: 'reject',
//           label: 'Reject',
//           actionType: 'SECONDARY',
//           order: 2,
//         },
//       ],
//       transitions: [
//         {
//           toStepName: 'Finance_Approval',
//           actionName: 'approve',
//           description: 'Approved requests go to finance.',
//           priority: 1,
//           isAutomatic: false,
//           conditions: [
//             {
//               sourceType: 'FORM_FIELD_VALUE',
//               sourceFieldName: 'estimated_cost',
//               operator: 'LESS_THAN',
//               comparisonValue: '1000',
//               valueType: 'NUMBER',
//             },
//           ],
//         },
//         {
//           toStepName: 'Request_Rejected',
//           actionName: 'reject',
//           description: 'Rejected requests end here.',
//           priority: 2,
//           isAutomatic: false,
//         },
//       ],
//     },
//     {
//       stepName: 'Finance_Approval',
//       description: 'Finance team reviews high-cost requests.',
//       order: 3,
//       assigneeLogic: {
//         assigneeType: 'SPECIFIC_ROLE',
//         specificRoleId: 'role_finance_team', // Finance Team role ID
//       },
//       actions: [
//         {
//           name: 'final_approve',
//           label: 'Final Approve',
//           actionType: 'PRIMARY',
//           order: 1,
//         },
//         {
//           name: 'final_reject',
//           label: 'Final Reject',
//           actionType: 'SECONDARY',
//           order: 2,
//         },
//       ],
//       transitions: [
//         {
//           toStepName: 'Request_Approved',
//           actionName: 'final_approve',
//           description: 'Approved by finance.',
//           priority: 1,
//           isAutomatic: false,
//         },
//         {
//           toStepName: 'Request_Rejected',
//           actionName: 'final_reject',
//           description: 'Rejected by finance.',
//           priority: 2,
//           isAutomatic: false,
//         },
//       ],
//     },
//     {
//       stepName: 'Request_Approved',
//       description: 'Purchase request approved.',
//       order: 4,
//       assigneeLogic: {
//         assigneeType: 'UNASSIGNED',
//       },
//       transitions: [], // Final step
//     },
//     {
//       stepName: 'Request_Rejected',
//       description: 'Purchase request rejected.',
//       order: 5,
//       assigneeLogic: {
//         assigneeType: 'UNASSIGNED',
//       },
//       transitions: [], // Final step
//     },
//   ],
// };