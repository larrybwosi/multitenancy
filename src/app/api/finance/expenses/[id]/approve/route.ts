import { approveExpense } from '@/actions/expenses';
import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const result = await approveExpense({
      expenseId: id,
      comments: body.comments,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.errorCode || 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[EXPENSE_APPROVE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
