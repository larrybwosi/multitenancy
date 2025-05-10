import { getCustomers, saveCustomer } from '@/actions/customers.actions';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const result = await getCustomers({
      query: searchParams.get('query') || undefined,
      status: (searchParams.get('status') as any) || 'all',
      sortBy: (searchParams.get('sortBy') as any) || 'name',
      sortOrder: (searchParams.get('sortOrder') as any) || 'asc',
      page: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('pageSize')) || 15,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/customers:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  const formData = await request.json();

  try {
    const result = await saveCustomer(formData);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/customers/save:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}