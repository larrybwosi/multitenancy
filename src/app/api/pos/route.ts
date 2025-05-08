import { processSale } from "@/actions/sale";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try{
    const result = await processSale({ ...body, enableStockTracking:false });
    const transformItems = result.success && result.data?.items.map((item) => {
      return {
        ...item,
        name:item.variant.product.name
      };
    })
    
    if(!result.success){
      return NextResponse.json({ error: result.error }, { status: result.errorCode || 400 });
    }
    const resultData = {...result.data,items:transformItems};
    const response = {...result, data: resultData};
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Error processing request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
  
}
