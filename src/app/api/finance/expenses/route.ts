import { NextResponse } from 'next/server';
import { ExpenseStatus } from '../../../../../prisma/src/generated/prisma/client';
import { createExpense, listExpenses } from '@/actions/expenses';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filters from query params
    const filter = {
      status: searchParams.get('status') as ExpenseStatus | undefined,
      memberId: searchParams.get('memberId') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      locationId: searchParams.get('locationId') || undefined,
      budgetId: searchParams.get('budgetId') || undefined,
      isReimbursable:
        searchParams.get('isReimbursable') === 'true'
          ? true
          : searchParams.get('isReimbursable') === 'false'
            ? false
            : undefined,
      isBillable:
        searchParams.get('isBillable') === 'true'
          ? true
          : searchParams.get('isBillable') === 'false'
            ? false
            : undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      skip: Number(searchParams.get('skip')) || undefined,
      take: Number(searchParams.get('take')) || undefined,
    };

    const result = await listExpenses(filter);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.errorCode || 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[EXPENSES_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {

    const body = await request.json();
    const result = await createExpense(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.errorCode || 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('[EXPENSES_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
