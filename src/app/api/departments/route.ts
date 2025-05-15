// app/api/departments/route.ts
import { getServerAuthContext } from '@/actions/auth';
import { createDepartmentWithGenericDefaults, getDepartments } from '@/actions/departments';
import { NextResponse } from 'next/server';

// Create a new department
export async function POST(request: Request) {
  try {
    const { organizationId, role } = await getServerAuthContext();
    if (!(role === 'OWNER' || role === 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, departmentHeadAssignments, image, banner } = body;

    const result = await createDepartmentWithGenericDefaults({
      organizationId,
      name,
      description,
      departmentHeadAssignments,
      image,
      banner
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create department' }, { status: 500 });
  }
}

// Get all departments (paginated)
export async function GET(request: Request) {
  try {
    const { organizationId, memberId } = await getServerAuthContext();
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;

    const result = await getDepartments(organizationId, memberId, page, limit);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.statusCode });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch departments' }, { status: 500 });
  }
}
