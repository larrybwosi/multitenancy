import { NextResponse } from 'next/server';
import { AppError } from '@/utils/errors';
import { performAutoCheckout } from '@/actions/attendance';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST() {
  try {
    
    const session = await auth.api.getSession({
      headers: await headers()
    })
    console.log(session);
    if(!session){
    return new NextResponse('Unauthorized',{ status: 400 });
    }
    await performAutoCheckout();
    
    return NextResponse.json({ message: 'Auto-checkout job completed' }, { status: 200 });
  } catch (error) {
    console.log(error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
