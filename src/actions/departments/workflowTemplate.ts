import { CreateWorkflowTemplateInput, workflowStepInputSchema } from '@/lib/validations/workflowTemplates'; // Zod schemas
// import { ZodError } from 'zod';
import prisma from '@/lib/db';

interface StepCreationOutput extends WorkflowStep {
  originalName: string; // To map transitions correctly
  actionsMap: Map<string, StepAction>; // Map original action name to created StepAction
}

/**
 * Creates a new workflow template with all its steps, forms, actions, and transitions.
 * @param input - The structured definition of the workflow.
 */
export async function createStructuredWorkflow(input: CreateWorkflowTemplateInput) {
  // console.log(`[WorkflowService] Attempting to create structured workflow: ${input.workflowName}`);
  try {
    // --- Validate input using Zod ---
    // const validatedInput = createWorkflowTemplateInputSchema.parse(input); // Do this in the API route typically

    const {
      workflowName,
      description,
      organizationId,
      departmentId,
      triggerType,
      initialStepName, // Name of the step to be marked as initial
      steps: stepDefinitions,
    } = input;

    // --- Create the Workflow Shell ---
    const workflow = await prisma.workflow.create({
      data: {
        name: workflowName,
        description,
        organizationId,
        departmentId,
        triggerType,
        isActive: true, // Default to active
        // initialStepId will be updated later
      },
    });
    // console.log(`[WorkflowService] Workflow shell created: ${workflow.id} - ${workflow.name}`);

    const createdStepsMap = new Map<string, StepCreationOutput>(); // Map original step name to created Step model

    // --- Create Each Step, its FormFields, AssigneeLogic, and Actions ---
    for (const stepDef of stepDefinitions) {
      const createdStep = await prisma.workflowStep.create({
        data: {
          workflowId: workflow.id,
          name: stepDef.stepName,
          description: stepDef.description,
          order: stepDef.order,
          assigneeLogic: stepDef.assigneeLogic ? { create: stepDef.assigneeLogic } : undefined,
          formFields: stepDef.formFields
            ? {
                create: stepDef.formFields.map(ff => ({
                  ...ff,
                  options: ff.options || undefined,
                  validationRules: ff.validationRules || undefined,
                })),
              }
            : undefined,
          // Actions are created below and then linked
        },
      });

      const stepActionsMap = new Map<string, StepAction>();
      if (stepDef.actions) {
        for (const actionDef of stepDef.actions) {
          const createdAction = await prisma.stepAction.create({
            data: {
              stepId: createdStep.id,
              name: actionDef.name,
              label: actionDef.label,
              actionType: actionDef.actionType,
              order: actionDef.order,
            },
          });
          stepActionsMap.set(actionDef.name, createdAction);
        }
      }
      createdStepsMap.set(stepDef.stepName, {
        ...createdStep,
        originalName: stepDef.stepName,
        actionsMap: stepActionsMap,
      });
      // console.log(`[WorkflowService] Created step: ${createdStep.id} - ${createdStep.name}`);
    }

    // --- Set the Initial Step for the Workflow ---
    const initialStepModel = createdStepsMap.get(initialStepName);
    if (!initialStepModel) {
      throw new Error(`Initial step named "${initialStepName}" not found in step definitions.`);
    }
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { initialStepId: initialStepModel.id },
    });
    // console.log(`[WorkflowService] Set initial step for workflow ${workflow.id} to ${initialStepModel.id}`);

    // --- Create Transitions between Steps ---
    for (const stepDef of stepDefinitions) {
      const fromStepModel = createdStepsMap.get(stepDef.stepName);
      if (!fromStepModel || !stepDef.transitions) continue;

      for (const transDef of stepDef.transitions) {
        const toStepModel = createdStepsMap.get(transDef.toStepName);
        if (!toStepModel) {
          // console.warn(`[WorkflowService] Target step "${transDef.toStepName}" for transition from "${stepDef.stepName}" not found. Skipping transition.`);
          continue;
        }

        let actionIdForTransition: string | undefined = undefined;
        if (transDef.actionName) {
          const triggeringAction = fromStepModel.actionsMap.get(transDef.actionName);
          if (!triggeringAction) {
            // console.warn(`[WorkflowService] Triggering action "${transDef.actionName}" for transition from "${stepDef.stepName}" not found. Skipping transition.`);
            continue;
          }
          actionIdForTransition = triggeringAction.id;
        }

        await prisma.stepTransition.create({
          data: {
            workflowId: workflow.id, // Important for scoping
            fromStepId: fromStepModel.id,
            toStepId: toStepModel.id,
            actionId: actionIdForTransition,
            description: transDef.description,
            priority: transDef.priority,
            isAutomatic: transDef.isAutomatic,
            conditions: transDef.conditions
              ? {
                  create: transDef.conditions.map(cond => ({
                    ...cond,
                    sourceFieldName: cond.sourceFieldName || undefined,
                  })),
                }
              : undefined,
          },
        });
        // console.log(`[WorkflowService] Created transition from ${fromStepModel.name} to ${toStepModel.name}`);
      }
    }

    // console.log(`[WorkflowService] Successfully created structured workflow: ${workflow.id} - ${workflow.name}`);
    // Fetch the full workflow with all nested relations to return it
    const fullWorkflow = await prisma.workflow.findUnique({
      where: { id: workflow.id },
      include: {
        steps: {
          include: {
            assigneeLogic: true,
            formFields: true,
            actions: {
              include: {
                transitions: { include: { conditions: true } }, // Show transitions originating from this action
              },
            },
          },
        },
      },
    });
    return fullWorkflow;
  } catch (error) {
    // if (error instanceof ZodError) {
    //   // console.error("[WorkflowService] Validation error creating structured workflow:", error.errors);
    //   throw new Error(`Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    // }
    // console.error(`[WorkflowService] Error creating structured workflow "${input.workflowName}":`, error);
    throw new Error(`Could not create structured workflow: ${(error as Error).message}`);
  }
}
