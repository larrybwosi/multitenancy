import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/utils/errors';
import { performAutoCheckout } from '@/actions/attendance';

export async function POST(request: NextRequest) {
  try {
    await performAutoCheckout();
    return NextResponse.json({ message: 'Auto-checkout job completed' }, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
