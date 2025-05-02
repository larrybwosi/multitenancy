import { processSale } from "@/actions/pos.actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try{
    const result = await processSale(body);
    if (result.error) {
      return new NextResponse(result.error.toString(), { status: 400 });
    }
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error processing request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
  
}
