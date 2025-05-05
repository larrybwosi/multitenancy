import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { updateApprovalWorkflow } from "@/actions/approval-workflows";
import { ApprovalWorkflowInputSchema } from "@/lib/validations/approval";
import { getServerAuthContext } from "@/actions/auth";

// GET /api/approval-workflows - Get all workflows for an organization
export async function GET() {
  try {
    const { organizationId } = await getServerAuthContext();
    console.log("Organization ID:", organizationId);
    
    const workflows = await prisma.approvalWorkflow.findMany({
      where: {
        organizationId,
      },
      include: {
        steps: {
          include: { 
            conditions: true, 
            actions: true 
          },
          orderBy: { stepNumber: 'asc' }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Error fetching approval workflows:", error);
    return NextResponse.json({ error: "Failed to fetch approval workflows" }, { status: 500 });
  }
}

// POST /api/approval-workflows - Create a new workflow
export async function POST(request: NextRequest) {
  try {

    const json = await request.json();

    // Validate input
    const validationResult = ApprovalWorkflowInputSchema.safeParse(json.data);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { organizationId } = json;
    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }
    
    const { name, description, isActive, steps } = validationResult.data;

    // Create workflow with steps, conditions, and actions
    const workflow = await prisma.approvalWorkflow.create({
      data: {
        organizationId,
        name,
        description,
        isActive: isActive || false,
        steps: {
          create: steps.map(step => ({
            stepNumber: step.stepNumber,
            name: step.name,
            description: step.description,
            allConditionsMustMatch: step.allConditionsMustMatch,
            conditions: {
              create: step.conditions.map(condition => ({
                type: condition.type,
                minAmount: condition.minAmount,
                maxAmount: condition.maxAmount,
                locationId: condition.locationId,
                expenseCategoryId: condition.expenseCategoryId,
              })),
            },
            actions: {
              create: step.actions.map(action => ({
                type: action.type,
                approverRole: action.approverRole,
                specificMemberId: action.specificMemberId,
                approvalMode: action.approvalMode,
              })),
            },
          })),
        },
      },
      include: {
        steps: {
          include: { conditions: true, actions: true },
          orderBy: { stepNumber: 'asc' }
        },
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("Error creating approval workflow:", error);
    return NextResponse.json({ error: "Failed to create approval workflow" }, { status: 500 });
  }
}

// PUT /api/approval-workflows/:id - Update an existing workflow
export async function PUT(request: NextRequest) {
  try {

    // Extract workflow ID from URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const workflowId = segments[segments.length - 1];

    if (!workflowId) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 });
    }

    // Get existing workflow to check permissions
    const existingWorkflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }
    

    // Parse and validate the input data
    const json = await request.json();
    const validationResult = ApprovalWorkflowInputSchema.safeParse(json);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Use the server action to update the workflow
    const updatedWorkflow = await updateApprovalWorkflow(workflowId, validationResult.data);

    if (!updatedWorkflow) {
      return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
    }

    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    console.error("Error updating approval workflow:", error);
    return NextResponse.json({ error: "Failed to update approval workflow" }, { status: 500 });
  }
}

// DELETE /api/approval-workflows/:id - Delete a workflow
export async function DELETE(request: NextRequest) {
  try {
    // Extract workflow ID from URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const workflowId = segments[segments.length - 1];

    if (!workflowId) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 });
    }

    // Get existing workflow to check permissions
    const existingWorkflow = await prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Delete the workflow and all related entities
    await prisma.$transaction(async (tx) => {
      // First, delete all step conditions
      await tx.approvalStepCondition.deleteMany({
        where: {
          step: {
            approvalWorkflowId: workflowId,
          },
        },
      });

      // Then, delete all step actions
      await tx.approvalStepAction.deleteMany({
        where: {
          step: {
            approvalWorkflowId: workflowId,
          },
        },
      });

      // Delete all steps
      await tx.approvalWorkflowStep.deleteMany({
        where: {
          approvalWorkflowId: workflowId,
        },
      });

      // Finally, delete the workflow itself
      await tx.approvalWorkflow.delete({
        where: {
          id: workflowId,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting approval workflow:", error);
    return NextResponse.json({ error: "Failed to delete approval workflow" }, { status: 500 });
  }
} 