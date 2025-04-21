import { restockProduct } from "@/actions/stock.actions";
import { handleApiError } from "@/lib/api-utils";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const values = await request.json();
    const result = await restockProduct(values);
    console.log(result)
    revalidatePath("/products");
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}