import { NextRequest, NextResponse } from "next/server";
import { GetProductsOptions } from "@/lib/hooks/use-products";
import { getProducts } from "@/actions/product";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    
    const options: GetProductsOptions = {
      // Booleans: Check if the string value is 'true'
      includeVariants: searchParams.get('includeVariants') === 'true', // Default false if param missing
      includeCategory: searchParams.get('includeCategory') === 'true', // Default false
      includeSuppliers: searchParams.get('includeSuppliers') === 'true', // Default false
      includeDefaultLocation: searchParams.get('includeDefaultLocation') === 'true', // Default false

      // Numbers: Parse and provide defaults
      page: Number(searchParams.get('page')) || 1, 
      limit: Number(searchParams.get('limit')) || 10,
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,

      isActive: searchParams.has('isActive') ? searchParams.get('isActive') === 'true' : undefined, // Only apply filter if 'isActive' param is present

      // Enums with type assertion and defaults
      sortBy: (searchParams.get('sortBy') as GetProductsOptions['sortBy']) || 'createdAt', // Default sort
      sortOrder: (searchParams.get('sortOrder') as GetProductsOptions['sortOrder']) || 'desc', // Default order
    };

    // Validate potential enum values if needed (more robust)
    const validSortByFields = ['name', 'createdAt', 'updatedAt', 'sku'];
    const validSortOrderValues = ['asc', 'desc'];

    if (!validSortByFields.includes(options.sortBy!)) {
      options.sortBy = 'createdAt'; // Fallback to default if invalid value provided
    }
    if (!validSortOrderValues.includes(options.sortOrder!)) {
      options.sortOrder = 'desc'; // Fallback to default
    }

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
