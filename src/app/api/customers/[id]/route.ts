import { deleteCustomer, getCustomerById, saveCustomer } from '@/actions/customers.actions';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string, slug:string }> }) {
  const { id } = await params;
  try {
    const result = await getCustomerById(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error in GET /api/customers/${id}:`, error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.json();

  try {
    const result = await saveCustomer(formData);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error in DELETE /api/customers/${id}:`, error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await deleteCustomer(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error in DELETE /api/customers/${id}:`, error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
