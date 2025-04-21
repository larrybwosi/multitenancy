import { addProduct } from "@/actions/products";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  const values = await req.json();
  try {
    const response = await addProduct(values);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.message, { status: 400 });
    }
    console.error("Error creating invitation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}