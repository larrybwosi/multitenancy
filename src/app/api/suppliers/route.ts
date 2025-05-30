import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupplier, getSuppliers } from "@/actions/supplier";
import { handleApiError } from "@/lib/api-utils";


export async function POST(request: NextRequest) {
  // Add Auth checks here

  try {
    const body = await request.json();
    
    const newSupplier = await createSupplier(body)
    console.log("newSupplier", newSupplier)
    if (!newSupplier || newSupplier.success === false) {
      return new NextResponse(newSupplier.error, { status: 500 });
    }
    
    return NextResponse.json(newSupplier, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
}

// Apply similar validation logic using safeParse in PUT routes (using Update schemas)
// and other POST routes (using their respective Create schemas).

export async function GET(request: NextRequest) {
  const {searchParams} = request.nextUrl;
  
  try {
    const suppliers = await getSuppliers({
      searchQuery: searchParams?.get("searchQuery") || '',
      filter: searchParams.get("filter") ? JSON.parse(searchParams.get("filter")!) : undefined,
      page: searchParams?.get("page") ? parseInt(searchParams.get("page")!) : 1,
      pageSize: searchParams?.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 10,
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    return handleApiError(error)
  }
}