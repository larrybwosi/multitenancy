// app/api/departments/[departmentId]/route.ts
import { getServerAuthContext } from '@/actions/auth';
import { deleteDepartment, getDepartmentWithDetails, getDepartmentWithMembers, updateDepartment } from '@/actions/departments';
import { handleApiError } from '@/lib/api-utils';
import { NextResponse } from 'next/server';

type Params = Promise<{ id: string }>;
// Get department details with members
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { memberId, organizationId } = await getServerAuthContext();
    const { id } = await params;

    // const result = await getDepartmentWithMembers(id, memberId);

    const departmentDetails = await getDepartmentWithDetails(id, organizationId, memberId);
    console.log(departmentDetails)
    // if (!result.success) {
    //   return NextResponse.json({ success: false, error: result.error }, { status: result.statusCode });
    // }

    return NextResponse.json(departmentDetails);
  } catch (error) {
    return handleApiError(error)
  }
}

// Update department
export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    const { memberId } = await getServerAuthContext();
    const { id } = await params;
    const body = await request.json();

    const result = await updateDepartment(id, body, memberId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.statusCode });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update department' }, { status: 500 });
  }
}

// Delete department
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { memberId } = await getServerAuthContext();
    const { id } = await params;

    const result = await deleteDepartment(id, memberId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.statusCode });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete department' }, { status: 500 });
  }
}
