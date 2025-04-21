import { markNotificationRead } from "@/actions/notifications";
import { NextRequest, NextResponse } from "next/server";


export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await markNotificationRead(params.id);
    return NextResponse.json(notification);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
