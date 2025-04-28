import { NextRequest, NextResponse } from "next/server";
import { addProduct, editProduct } from "@/actions/product-add-edit";

type ApiErrorResponse = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await addProduct(formData);
    
    if ('error' in result) {
      const errorResponse: ApiErrorResponse = { 
        error: result.error || "An unknown error occurred",
      };
      if ('fieldErrors' in result && result.fieldErrors) {
        errorResponse.fieldErrors = result.fieldErrors;
      }
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    const response: ApiSuccessResponse<typeof result> = {
      success: true,
      data: result
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/products:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await editProduct(formData);
    
    if ('error' in result) {
      const errorResponse: ApiErrorResponse = { 
        error: result.error || "An unknown error occurred",
      };
      if ('fieldErrors' in result && result.fieldErrors) {
        errorResponse.fieldErrors = result.fieldErrors;
      }
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    const response: ApiSuccessResponse<typeof result> = {
      success: true,
      data: result
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/products:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}