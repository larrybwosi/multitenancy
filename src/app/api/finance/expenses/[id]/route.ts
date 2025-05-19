import { getExpenseById } from '@/actions/expenses';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
  }
  try {
    
    const result = await getExpenseById(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.errorCode || 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[EXPENSE_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
