import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/approval-workflows/:id - Get a specific workflow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const workflowId = params.id;
    if (!workflowId) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 });
    }

    // Get the workflow with steps, conditions, and actions
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: {
        id: workflowId,
      },
      include: {
        steps: {
          include: {
            conditions: true,
            actions: true,
          },
          orderBy: {
            stepNumber: 'asc',
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }


    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error fetching approval workflow:", error);
    return NextResponse.json({ error: "Failed to fetch approval workflow" }, { status: 500 });
  }
} 