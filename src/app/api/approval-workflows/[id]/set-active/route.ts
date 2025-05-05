import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// PUT /api/approval-workflows/:id/set-active - Set a workflow as active for an organization
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    if (!workflowId) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 });
    }

    // Get request body for organizationId
    const json = await request.json();
    const { organizationId } = json;

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }


    // Check if the workflow exists and belongs to the organization
    const workflow = await prisma.approvalWorkflow.findFirst({
      where: {
        id: workflowId,
        organizationId,
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // Update the organization to set this workflow as active
    const updatedOrg = await prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        activeExpenseWorkflowId: workflowId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Workflow set as active",
      organizationId: updatedOrg.id,
      activeWorkflowId: workflowId
    });
  } catch (error) {
    console.error("Error setting active workflow:", error);
    return NextResponse.json({ error: "Failed to set active workflow" }, { status: 500 });
  }
} 