import { getServerAuthContext } from '@/actions/auth';
import { createExpenseCategory, getExpenseCategories } from '@/actions/expense-setup';
import { handleApiError } from '@/lib/api-utils';
import { NextResponse } from 'next/server';

// GET all expense categories for an organization
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { organizationId } = await getServerAuthContext();
    const onlyActive = searchParams.get('onlyActive') !== 'false'; // defaults to true

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const categories = await getExpenseCategories(organizationId, onlyActive);
    return NextResponse.json(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST create a new expense category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, code } = body;

    const { organizationId } = await getServerAuthContext();
    if (!name) {
      return NextResponse.json({ error: 'organizationId and name are required' }, { status: 400 });
    }

    const newCategory = await createExpenseCategory(organizationId, name, description, code);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
