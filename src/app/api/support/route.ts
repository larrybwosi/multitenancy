import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Here you would typically:
    // 1. Validate the input
    // 2. Store in database
    // 3. Send email notification
    // 4. Create ticket in your support system

    // For now, we'll just return success
    return NextResponse.json(
      { message: "Support ticket created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return NextResponse.json(
      { error: "Failed to create support ticket" },
      { status: 500 }
    );
  }
}