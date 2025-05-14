// src/services/departmentService.ts

// import { gemini } from './geminiApiService'; // Your Gemini API client
import { createDepartmentSchema, DepartmentMemberInput } from '@/lib/validations/department';
import prisma from '@/lib/db';

/**
 * Creates a new department, assigns heads, and generates a default workflow.
 * @param organizationId The ID of the organization this department belongs to.
 * @param name Name of the department.
 * @param description Optional description.
 * @param departmentHeadAssignments Array of member IDs to be assigned as department heads.
 * @param defaultBudgetAllocation Optional initial budget amount.
 */

/**
 * Creates a new department and generates a default GENERIC workflow using Gemini API.
 */
export async function createDepartmentWithGenericDefaults(
  organizationId: string,
  name: string,
  description?: string,
  departmentHeadAssignments?: Array<{ memberId: string }>,
  // You might pass more context for Gemini here, like department functions
  departmentPrimaryFunctions?: string[]
) {
  // console.log(`[DepartmentService] Attempting to create department (generic workflow): ${name} in org: ${organizationId}`);
  try {
    // Basic validation
    // createDepartmentSchema.parse({ name, organizationId, description });

    const department = await prisma.department.create({
      data: { name, description, organizationId },
    });
    // console.log(`[DepartmentService] Department created with ID: ${department.id}`);

    // Assign Department Heads (same as before)
    if (departmentHeadAssignments && departmentHeadAssignments.length > 0) {
      for (const head of departmentHeadAssignments) {
        await prisma.departmentMember.create({
          data: { departmentId: department.id, memberId: head.memberId, role: 'HEAD', canApproveExpenses: true, canManageBudget: true },
        });
      }
    }

    // --- Generate Default GENERIC Workflow using Gemini API ---
    const promptForGeminiGenericWorkflow = `
      You are an expert in designing flexible business process workflows.
      A new department has been created:
      - Department Name: "${department.name}"
      - Department Description: "${department.description || 'Not provided'}"
      - Primary Functions: ${departmentPrimaryFunctions ? departmentPrimaryFunctions.join(', ') : 'General Operations'}

      Please design a simple, generic default workflow for common tasks like "document submission and review" or "task assignment and completion" within this department.
      The workflow definition should be a JSON object. The top-level JSON object should contain:
      - "initialStepId": string (the ID of the first step to execute)
      - "steps": array of step objects.

      Each step object in the "steps" array should have:
      - "id": string (unique identifier for the step, e.g., "draft_submission", "manager_review", "final_approval")
      - "name": string (human-readable name, e.g., "Submit Document", "Review Request", "Finalize Task")
      - "description": string (optional)
      - "assigneeType": string (enum: "SUBMITTER", "SPECIFIC_ROLE", "SPECIFIC_MEMBER", "PREVIOUS_STEP_ASSIGNEE", "UNASSIGNED")
      - "assigneeValue": string (optional; e.g., for SPECIFIC_ROLE, "MANAGER" or "HEAD" which are DepartmentMemberRole values; for SPECIFIC_MEMBER, a placeholder like "{{submitters_manager_id}}" or a general instruction)
      - "formSchema": object (optional; a simple JSON schema for any data to be collected at this step. E.g., { "type": "object", "properties": { "documentUrl": { "type": "string", "title": "Document URL" }, "comments": { "type": "string", "title": "Comments" } } })
      - "actions": array of action objects, defining possible transitions from this step. Each action object should have:
          - "name": string (label for the action button, e.g., "Submit for Review", "Approve", "Reject", "Request Changes", "Complete")
          - "targetStepId": string (ID of the next step to transition to if this action is taken)
          - "conditions": array of condition objects (optional; e.g., { "field": "formData.priority", "operator": "equals", "value": "high" }). For simplicity, you can omit complex conditions for the default workflow unless a clear use case is suggested by department functions.
          - "isFinal": boolean (optional, true if this action completes the workflow)

      Example of a step:
      {
        "id": "manager_review",
        "name": "Manager Review",
        "description": "Manager reviews the submission.",
        "assigneeType": "SPECIFIC_ROLE",
        "assigneeValue": "MANAGER", // This should be a role from DepartmentMemberRole
        "formSchema": { "type": "object", "properties": { "managerComments": { "type": "string", "title": "Manager Comments" } } },
        "actions": [
          { "name": "Approve", "targetStepId": "final_processing", "isFinal": false },
          { "name": "Reject", "targetStepId": "rejected_state", "isFinal": true }
        ]
      }

      Please generate a workflow with 2-3 logical steps for the "${department.name}" department, keeping it generic for tasks like document submissions or internal requests.
      Make sure the 'assigneeValue' for 'SPECIFIC_ROLE' uses roles like 'MEMBER', 'MANAGER', or 'HEAD'.
      Ensure there's an 'initialStepId' at the root of the JSON.
      Ensure at least one action in the workflow leads to a final state (either by having "isFinal": true or by being the implicit end).
    `;

    // console.log(`[DepartmentService] Prompt for Gemini API (Generic Workflow): ${promptForGeminiGenericWorkflow}`);
    // const workflowDefinitionJsonString = await gemini.generateText(promptForGeminiGenericWorkflow); // Placeholder

    // Mocked response for a generic workflow:
    const mockedGeminiResponseGeneric = JSON.stringify({
      "initialStepId": "submit_task",
      "steps": [
        {
          "id": "submit_task",
          "name": "Submit New Task/Document",
          "description": `Initial submission step for the ${department.name} department.`,
          "assigneeType": "SUBMITTER",
          "formSchema": {
            "type": "object",
            "properties": {
              "title": { "type": "string", "title": "Title/Subject" },
              "details": { "type": "string", "title": "Details/Description" },
              "attachmentUrl": { "type": "string", "title": "Attachment URL (Optional)" }
            },
            "required": ["title", "details"]
          },
          "actions": [
            { "name": "Submit for Review", "targetStepId": "manager_review_task" }
          ]
        },
        {
          "id": "manager_review_task",
          "name": "Manager Review",
          "description": "Task/document review by a Manager.",
          "assigneeType": "SPECIFIC_ROLE",
          "assigneeValue": "MANAGER", // From DepartmentMemberRole
          "formSchema": {
            "type": "object",
            "properties": { "reviewComments": { "type": "string", "title": "Reviewer Comments" } }
          },
          "actions": [
            { "name": "Approve & Complete", "targetStepId": "completed_task", "isFinal": true },
            { "name": "Request Revisions", "targetStepId": "submit_task" } // Loop back to submitter
          ]
        },
        {
          "id": "completed_task",
          "name": "Task Completed",
          "description": "The task/document process is complete.",
          "assigneeType": "UNASSIGNED", // No further action
          "actions": [] // Terminal step
        }
      ]
    });
    const workflowDefinition = JSON.parse(mockedGeminiResponseGeneric);

    const defaultWorkflow = await prisma.workflow.create({
      data: {
        name: `${department.name} - Default General Task Workflow`,
        description: `Default general task workflow for the ${department.name} department.`,
        organizationId: department.organizationId,
        departmentId: department.id,
        definition: workflowDefinition, // Store the JSON from Gemini
        triggerType: 'MANUAL',
        isActive: true,
      },
    });
    // console.log(`[DepartmentService] Default GENERIC workflow created with ID: ${defaultWorkflow.id}`);

    await prisma.department.update({
      where: { id: department.id },
      data: { defaultWorkflowId: defaultWorkflow.id },
    });

    // console.log(`[DepartmentService] Department ${department.id} updated with default generic workflow ${defaultWorkflow.id}`);
    return { department, defaultWorkflow };

  } catch (error) {
    // console.error(`[DepartmentService] Error creating department with generic workflow ${name}:`, error);
    // Handle ZodError specifically if input validation is done here
    throw new Error(`Could not create department: ${(error as Error).message}`);
  }
}