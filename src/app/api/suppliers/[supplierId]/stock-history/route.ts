// app/api/suppliers/[supplierId]/stock-history/route.ts
import { getSupplierPurchaseHistory } from '@/actions/supplier';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page')) || 1;
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Validate page and pageSize
    if (page < 1 || pageSize < 1) {
      return NextResponse.json(
        { error: 'Page and pageSize must be positive integers' },
        { status: 400 }
      );
    }
    const { supplierId } = await params;
    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }

    // Call the service function
    const data = await getSupplierPurchaseHistory(supplierId, page, pageSize);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/suppliers/[supplierId]/stock-history:', error);

    if (error.message.includes('Supplier not found')) {
      return NextResponse.json(
        { error: 'Supplier not found or access denied' },
        { status: 404 }
      );
    }

    if (error.message.includes('Invalid Supplier ID format') || 
        error.message.includes('Invalid pagination parameters')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch supplier purchase history' },
      { status: 500 }
    );
  }
}