import { sendInvitationEmail } from "@/actions/emails";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const response = await sendInvitationEmail(
      'larrybwosi@gmail.com',
      'someurltoken',
      'New Invitation',
      'Larry Bwosi',
      // 'You have been invited to join our organization. Click the link below to accept the invitation.',
    )
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.message, { status: 400 });
    }
    console.error("Error creating invitation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}