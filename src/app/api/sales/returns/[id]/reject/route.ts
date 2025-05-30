import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // First verify the return exists and is pending
    const returnRequest = await prisma.return.findUnique({
      where: { id },
    });

    if (!returnRequest) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    if (returnRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending returns can be rejected" },
        { status: 400 }
      );
    }

    // Reject the return
    const rejectedReturn = await prisma.return.update({
      where: { id },
      data: {
        status: "REJECTED",
        processedAt: new Date(),
        rejectionReason: body?.rejectionReason || "Not specified",
      },
    });

    // Here you would typically:
    // 1. Notify the customer
    // 2. Create any necessary audit logs

    return NextResponse.json(
      { message: "Return rejected successfully", return: rejectedReturn },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error rejecting return:", error);
    return NextResponse.json(
      { error: "Failed to reject return" },
      { status: 500 }
    );
  }
}
