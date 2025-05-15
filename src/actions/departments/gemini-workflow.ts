import { CreateWorkflowTemplateInput } from '@/lib/validations/workflowTemplates'; // Zod schema for input type
import {
  AssigneeType,
  FormFieldType,
  ActionType,
  ConditionSourceType,
  ConditionOperator,
} from '@/prisma/client';
import { createStructuredWorkflow } from './workflowTemplate';
import { getGeminiClient } from '@/lib/gemini';

/**
 * Generates a workflow template definition using Gemini and then creates it.
 * @param userPrompt - The user's description of the desired workflow (e.g., "document submission for Engineering").
 * @param organizationId - The organization ID.
 * @param departmentId - Optional department ID.
 */
export async function generateAndCreateWorkflowViaGemini(
  userPrompt: string,
  organizationId: string,
  departmentId?: string
) {
  // console.log(`[GeminiWorkflowService] Generating workflow for prompt: "${userPrompt}"`);

  // --- Construct a very detailed prompt for Gemini ---
  // This prompt needs to guide Gemini to output JSON matching CreateWorkflowTemplateInput
  const systemPrompt = `
    You are an expert AI assistant tasked with designing structured business workflow templates.
    Your goal is to convert a user's natural language description of a workflow into a precise JSON object
    that conforms to the 'CreateWorkflowTemplateInput' TypeScript interface structure.

    The JSON output MUST strictly follow this structure:
    {
      "workflowName": "string (e.g., 'User Prompt Based Workflow')",
      "description": "string (optional, a brief summary)",
      "organizationId": "${organizationId}",
      "departmentId": ${departmentId ? `"${departmentId}"` : null},
      "triggerType": "MANUAL" | "EVENT_BASED" | "SCHEDULED" | "API_CALL" (default to MANUAL),
      "initialStepName": "string (must match one of the stepName in the steps array)",
      "steps": [
        {
          "stepName": "string (unique within this workflow, e.g., 'draft_request')",
          "description": "string (optional)",
          "order": "integer (sequential, e.g., 1, 2, 3)",
          "assigneeLogic": { (optional)
            "assigneeType": "${Object.values(AssigneeType).join(' | ')}",
            "specificRoleId": "string (optional, e.g., 'MANAGER', 'LEGAL_TEAM_MEMBER')",
            "specificMemberId": "string (optional, placeholder like '{{MEMBER_ID}}')"
          },
          "formFields": [ (optional)
            {
              "fieldName": "string (camelCase, e.g., 'documentTitle')",
              "label": "string (e.g., 'Document Title')",
              "fieldType": "${Object.values(FormFieldType).join(' | ')}",
              "isRequired": "boolean",
              "placeholder": "string (optional)",
              "defaultValue": "string (optional)",
              "options": [ { "value": "string", "label": "string" } ] (optional, for DROPDOWN, RADIO_GROUP, CHECKBOX_GROUP),
              "validationRules": { (optional, e.g., { "minLength": 5 }) },
              "order": "integer (sequential for fields)"
            }
          ],
          "actions": [ (optional)
            {
              "name": "string (camelCase, e.g., 'submitForApproval')",
              "label": "string (e.g., 'Submit for Approval')",
              "actionType": "${Object.values(ActionType).join(' | ')}" (default to PRIMARY),
              "order": "integer (sequential for actions)"
            }
          ],
          "transitions": [ (optional)
            {
              "toStepName": "string (must match another stepName in this workflow)",
              "actionName": "string (optional, must match an action.name in the current step)",
              "description": "string (optional)",
              "priority": "integer (default 0)",
              "isAutomatic": "boolean (default false)",
              "conditions": [ (optional)
                {
                  "sourceType": "${Object.values(ConditionSourceType).join(' | ')}",
                  "sourceFieldName": "string (optional, e.g., 'amount' from form or 'userRole' from context)",
                  "operator": "${Object.values(ConditionOperator).join(' | ')}",
                  "comparisonValue": "string",
                  "valueType": "${Object.values(FormFieldType).join(' | ')}" (type of comparisonValue, e.g., NUMBER, BOOLEAN)
                }
              ]
            }
          ]
        }
      ]
    }

    Constraints and Guidelines:
    1.  'workflowName': Create a descriptive name based on the user prompt.
    2.  'organizationId' and 'departmentId' are provided.
    3.  'initialStepName': MUST be one of the 'stepName' values defined in the 'steps' array.
    4.  'steps': Define at least 2-3 logical steps. Ensure 'stepName' is unique for each step.
    5.  'assigneeLogic.specificRoleId': If used, try to infer a role like 'MANAGER', 'DEPARTMENT_HEAD', 'MEMBER' or a generic descriptive role if applicable from the prompt.
    6.  'formFields.fieldName': Use camelCase.
    7.  'actions.name': Use camelCase.
    8.  'transitions.toStepName': Must correctly reference another 'stepName'.
    9.  'transitions.actionName': If specified, must reference an 'actions.name' from the *same* step definition.
    10. Ensure the workflow has a logical flow, from an initial step to one or more terminal steps (steps with no outgoing transitions or actions leading to transitions that complete the workflow).
    11. For boolean 'comparisonValue' in conditions, use "true" or "false" as strings.
    12. If the user mentions specific roles (e.g., "manager", "team lead", "HR"), use these for 'specificRoleId' in 'assigneeLogic' if 'assigneeType' is 'SPECIFIC_ROLE'. If no specific role is available, you can use generic roles like 'MEMBER', 'MANAGER', 'DEPARTMENT_HEAD'.
    13. If the user prompt is vague, create a simple, general-purpose workflow with 2-3 steps (e.g., Submit -> Review -> Complete).

    User's request: "${userPrompt}"

    Generate ONLY the JSON object. Do not include any other text or explanations outside the JSON structure.
    The JSON must be valid and parseable.
    Ensure all enum values used are exactly as listed in the prompt (e.g., AssigneeType, FormFieldType).
  `;

  // This is a conceptual call to Gemini.
  // In a real scenario, you'd use the Vertex AI SDK or similar.
  const gemini = getGeminiClient()
  const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash',systemInstruction:systemPrompt });
  const response = await model.generateContent({})
  console.log(response)
  // const geminiResponseJsonString = await callGeminiApi(systemPrompt); // Placeholder
  // console.log("[GeminiWorkflowService] Raw Gemini Response:", geminiResponseJsonString);

  // --- MOCKED Gemini Response for demonstration ---
  // This mocked response should be what Gemini *would* generate based on the prompt and user request.
  // Example for userPrompt: "Create a simple document approval workflow for the legal team.
  // It should start with uploading a document, then review by a legal counsel, then final approval by senior counsel."
  const mockedGeminiResponseJsonString = `{
    "workflowName": "Legal Document Approval",
    "description": "Workflow for submitting documents for legal review and approval.",
    "organizationId": "${organizationId}",
    "departmentId": ${departmentId ? `"${departmentId}"` : null},
    "triggerType": "MANUAL",
    "initialStepName": "upload_document",
    "steps": [
      {
        "stepName": "upload_document",
        "description": "Submitter uploads the document and provides initial details.",
        "order": 1,
        "assigneeLogic": { "assigneeType": "SUBMITTER" },
        "formFields": [
          { "fieldName": "documentName", "label": "Document Name", "fieldType": "TEXT", "isRequired": true, "order": 1 },
          { "fieldName": "documentFile", "label": "Upload Document", "fieldType": "FILE_UPLOAD", "isRequired": true, "order": 2 },
          { "fieldName": "submissionNotes", "label": "Submission Notes", "fieldType": "TEXTAREA", "isRequired": false, "order": 3 }
        ],
        "actions": [
          { "name": "submitToLegalCounsel", "label": "Submit to Legal Counsel", "actionType": "PRIMARY", "order": 1 }
        ],
        "transitions": [
          { "toStepName": "legal_counsel_review", "actionName": "submitToLegalCounsel" }
        ]
      },
      {
        "stepName": "legal_counsel_review",
        "description": "Legal Counsel reviews the document.",
        "order": 2,
        "assigneeLogic": { "assigneeType": "SPECIFIC_ROLE", "specificRoleId": "LEGAL_COUNSEL" },
        "formFields": [
          { "fieldName": "counselComments", "label": "Counsel Comments", "fieldType": "TEXTAREA", "isRequired": false, "order": 1 },
          { "fieldName": "isApprovedByCounsel", "label": "Approved by Counsel?", "fieldType": "BOOLEAN", "isRequired": true, "order": 2 }
        ],
        "actions": [
          { "name": "escalateToSeniorCounsel", "label": "Escalate to Senior Counsel", "actionType": "PRIMARY", "order": 1 },
          { "name": "requestRevisions", "label": "Request Revisions", "actionType": "SECONDARY", "order": 2 }
        ],
        "transitions": [
          {
            "toStepName": "senior_counsel_approval",
            "actionName": "escalateToSeniorCounsel",
            "conditions": [{ "sourceType": "FORM_FIELD_VALUE", "sourceFieldName": "isApprovedByCounsel", "operator": "IS_TRUE", "comparisonValue": "true", "valueType": "BOOLEAN" }]
          },
          { "toStepName": "upload_document", "actionName": "requestRevisions" }
        ]
      },
      {
        "stepName": "senior_counsel_approval",
        "description": "Senior Counsel provides final approval.",
        "order": 3,
        "assigneeLogic": { "assigneeType": "SPECIFIC_ROLE", "specificRoleId": "SENIOR_COUNSEL" },
        "formFields": [
          { "fieldName": "seniorCounselDecision", "label": "Senior Counsel Decision", "fieldType": "RADIO_GROUP", "options": [{ "value": "approved", "label": "Approved" },{ "value": "rejected", "label": "Rejected" }], "isRequired": true, "order": 1 },
          { "fieldName": "finalRemarks", "label": "Final Remarks", "fieldType": "TEXTAREA", "isRequired": false, "order": 2 }
        ],
        "actions": [
          { "name": "finalizeWorkflow", "label": "Finalize", "actionType": "PRIMARY", "order": 1 }
        ],
        "transitions": [
          // No explicit transition, this is a terminal step action for this example path
        ]
      }
    ]
  }`;
  // --- END MOCKED Gemini Response ---

  let workflowDefinitionInput: CreateWorkflowTemplateInput;
  try {
    workflowDefinitionInput = JSON.parse(mockedGeminiResponseJsonString); // Or actual geminiResponseJsonString
    // Add a Zod parse here for safety in a real app:
    // workflowDefinitionInput = createWorkflowTemplateInputSchema.parse(JSON.parse(geminiResponseJsonString));
  } catch (e) {
    console.error("[GeminiWorkflowService] Failed to parse Gemini JSON response:", e);
    console.error("[GeminiWorkflowService] Received JSON string for parsing:", mockedGeminiResponseJsonString);
    throw new Error('Gemini response was not valid JSON or did not match expected structure.');
  }

  return createStructuredWorkflow(workflowDefinitionInput);
}
