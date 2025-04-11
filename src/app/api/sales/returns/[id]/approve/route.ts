import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // First verify the return exists and is pending
    const returnRequest = await prisma.return.findUnique({
      where: { id },
    });

    if (!returnRequest) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    if (returnRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending returns can be approved" },
        { status: 400 }
      );
    }

    // Approve the return
    const approvedReturn = await prisma.return.update({
      where: { id },
      data: {
        status: "APPROVED",
        processedAt: new Date(),
      },
    });

    // Here you would typically:
    // 1. Process the refund
    // 2. Restock the items
    // 3. Notify the customer
    // 4. Create any necessary audit logs

    return NextResponse.json(
      { message: "Return approved successfully", return: approvedReturn },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving return:", error);
    return NextResponse.json(
      { error: "Failed to approve return" },
      { status: 500 }
    );
  }
}
