// // src/services/workflowService.ts
// import prisma from "@/lib/db";
// import { DepartmentMemberRole } from "@/prisma/client";
// /**
//  * Initiates an instance of a generic workflow.
//  */
// export async function startWorkflowInstance(
//   workflowId: string,
//   submittedById: string, // Member ID of the user starting the workflow
//   organizationId: string,
//   initialContext?: object, // Any data to start the workflow with (e.g., form inputs for the first step)
//   departmentId?: string
// ) {
//   // console.log(`[WorkflowService] Starting instance for workflow ${workflowId} by member ${submittedById}`);
//   try {
//     const workflowDefinition = await prisma.workflow.findUnique({ where: { id: workflowId } });
//     if (!workflowDefinition) throw new Error('Workflow definition not found.');
//     if (!workflowDefinition.isActive) throw new Error('Workflow is not active.');
//     if (
//       !workflowDefinition.definition ||
//       typeof workflowDefinition.definition !== 'object' ||
//       !('steps' in workflowDefinition.definition) ||
//       !('initialStepId' in workflowDefinition.definition)
//     ) {
//       throw new Error('Workflow definition is invalid or missing initialStepId/steps.');
//     }
//     const definition = workflowDefinition.definition as any; // Cast for easier access

//     const instance = await prisma.workflowInstance.create({
//       data: {
//         workflowId,
//         submittedById,
//         organizationId: workflowDefinition.organizationId, // Use orgId from definition for consistency
//         departmentId: workflowDefinition.departmentId, // Use deptId from definition
//         status: 'IN_PROGRESS', // Or PENDING if initial step requires explicit start
//         currentStepId: definition.initialStepId,
//         context: initialContext || {},
//         // assignedToId could be determined based on initialStep's assigneeType
//       },
//     });

//     // Optionally create an initial history entry
//     await prisma.workflowInstanceHistory.create({
//       data: {
//         workflowInstanceId: instance.id,
//         stepId: definition.initialStepId,
//         actorId: submittedById,
//         actionTaken: 'Initiated',
//         dataSnapshot: instance.context,
//       },
//     });

//     // console.log(`[WorkflowService] Workflow instance ${instance.id} created and started.`);
//     return instance;
//   } catch (error) {
//     // console.error(`[WorkflowService] Error starting workflow instance for ${workflowId}:`, error);
//     throw error;
//   }
// }


// /**
//  * Creates a predefined "Simple Document Submission & Approval" generic workflow.
//  */
// export async function createPredefinedDocSubmissionWorkflow(
//   organizationId: string,
//   name: string,
//   approverRoleInDepartment: DepartmentMemberRole = 'MANAGER', // Default to MANAGER
//   departmentId?: string
// ) {
//   // console.log(`[WorkflowService] Creating predefined doc submission workflow: ${name}`);
//   try {
//     // Define the workflow structure (steps, actions, etc.)
//     const definition = {
//       initialStepId: "submit_document",
//       steps: [
//         {
//           id: "submit_document",
//           name: "Submit Document",
//           assigneeType: "SUBMITTER",
//           formSchema: {
//             type: "object",
//             properties: {
//               documentName: { type: "string", title: "Document Name" },
//               documentUrl: { type: "string", title: "Document URL" },
//               submissionNotes: { type: "string", title: "Notes (Optional)" }
//             },
//             required: ["documentName", "documentUrl"]
//           },
//           actions: [
//             { name: "Submit for Approval", targetStepId: "approval_step" }
//           ]
//         },
//         {
//           id: "approval_step",
//           name: "Document Approval",
//           assigneeType: "SPECIFIC_ROLE",
//           assigneeValue: approverRoleInDepartment, // e.g., 'MANAGER' or 'HEAD'
//           formSchema: {
//             type: "object",
//             properties: { approvalComments: { type: "string", title: "Approval Comments" } }
//           },
//           actions: [
//             { name: "Approve", targetStepId: "approved_final", "isFinal": true },
//             { name: "Reject", targetStepId: "rejected_final", "isFinal": true }
//           ]
//         },
//         { id: "approved_final", name: "Document Approved", assigneeType: "UNASSIGNED", actions: [] },
//         { id: "rejected_final", name: "Document Rejected", assigneeType: "UNASSIGNED", actions: [] }
//       ]
//     };

//     const workflow = await prisma.workflow.create({
//       data: {
//         name,
//         description: `Predefined workflow for document submission and approval by a ${approverRoleInDepartment}.`,
//         organizationId,
//         departmentId,
//         triggerType: 'MANUAL',
//         definition: definition,
//         isActive: true,
//       },
//     });
//     // console.log(`[WorkflowService] Predefined doc submission workflow ${workflow.id} created.`);
//     return workflow;
//   } catch (error) {
//     // console.error(`[WorkflowService] Error creating predefined doc submission workflow ${name}:`, error);
//     throw error;
//   }
// }