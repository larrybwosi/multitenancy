import { processSale } from "@/actions/sale";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try{
    const result = await processSale({ ...body, enableStockTracking:false });
    return NextResponse.json(result);

  } catch (error) {
    console.error("Error processing request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
  
}
