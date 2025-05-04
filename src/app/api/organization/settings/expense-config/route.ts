import { getServerAuthContext } from '@/actions/auth';
import { configureOrganizationExpenses, getOrganizationExpenseConfiguration } from '@/actions/expense-setup';
import { handleApiError } from '@/lib/api-utils';
import { NextResponse } from 'next/server';

// GET organization expense configuration
export async function GET() {
  try {
    const { organizationId } = await getServerAuthContext();


    const config = await getOrganizationExpenseConfiguration(organizationId);
    return NextResponse.json(config);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH update organization expense configuration
export async function PATCH(request: Request,) {
  try {
    const { organizationId } = await getServerAuthContext();
    const configData = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const updatedOrg = await configureOrganizationExpenses(organizationId, configData);
    return NextResponse.json(updatedOrg);
  } catch (error) {
    return handleApiError(error);
  }
}
