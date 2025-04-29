import { NextRequest, NextResponse } from "next/server";
import { addProduct, editProduct } from "@/actions/product-add-edit";
import { getProducts } from "@/actions/products";

type ApiErrorResponse = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const options = {
      includeVariants: searchParams.get('includeVariants') === 'true',
      includeCategory: searchParams.get('includeCategory') === 'true',
      includeSuppliers: searchParams.get('includeSuppliers') === 'true',
      includeDefaultLocation: searchParams.get('includeDefaultLocation') === 'true',
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 10,
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      sortBy: (searchParams.get('sortBy') as 'name' | 'createdAt' | 'basePrice') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    };

    const result = await getProducts(options);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in products API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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