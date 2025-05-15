import { NextResponse } from 'next/server';
import { DepartmentMemberRole } from '@/prisma/client';
import { DepartmentMemberInput } from '@/lib/validations/department';
import { getServerAuthContext } from '@/actions/auth';
import { addMemberToDepartment, removeMemberFromDepartment, updateDepartmentMember } from '@/actions/departments/members';

type Params = Promise<{ id: string }>;

// Add member to department
export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const { memberId: requestingMemberId } = await getServerAuthContext();
    const { id } = await params;
    const body = await request.json();

    const { memberId, role, canApproveExpenses, canManageBudget } = body;

    const result = await addMemberToDepartment(
      id,
      memberId,
      role as DepartmentMemberRole,
      canApproveExpenses,
      canManageBudget
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add member to department' },
      { status: 500 }
    );
  }
}

// Update department member
export async function PATCH(request: Request, { params }: { params: Params }) {
  try {
    // const { memberId: requestingMemberId } = await getServerAuthContext();
    const { id } = await params;
    const body = await request.json();
    const { memberId, ...updates } = body;

    const result = await updateDepartmentMember(id, memberId, updates as Partial<DepartmentMemberInput>);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update department member' },
      { status: 500 }
    );
  }
}

// Remove member from department
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    // const { memberId: requestingMemberId } = await getServerAuthContext();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'memberId is required' }, { status: 400 });
    }

    const result = await removeMemberFromDepartment(id, memberId);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove member from department' },
      { status: 500 }
    );
  }
}
