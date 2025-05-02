import { addProductMinimal } from "@/actions/product-add-edit";
import { z } from "zod";

export async function POST(request: Request) {
  const body = await request.json();
  console.log('Received body in POST /api/products/create:', body);
  try {
    
    const result = await addProductMinimal(body);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.log('Error in POST /api/products/create:', error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.errors }), { status: 400 });
    } else {
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
  }
}