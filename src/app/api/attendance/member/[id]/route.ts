import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/utils/errors';
import { getMemberAttendance } from '@/actions/attendance';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: memberId } = await params;
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');

    if (!memberId || !organizationId || !periodStart || !periodEnd) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const records = await getMemberAttendance(organizationId, memberId, startDate, endDate);
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
