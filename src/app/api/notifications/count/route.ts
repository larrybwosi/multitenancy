import { getNotificationCounts } from "@/actions/notifications";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const counts = await getNotificationCounts({
      userId: searchParams.get("userId") || undefined,
      recipientEmail: searchParams.get("recipientEmail") || undefined,
    });

    return NextResponse.json(counts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
