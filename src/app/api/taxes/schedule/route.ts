import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get future scheduled tax payments
    const scheduledPayments = await prisma.taxSchedule.findMany({
      where: {
        organizationId,
        dueDate: {
          gte: new Date()
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    return NextResponse.json({ scheduledPayments });
  } catch (error) {
    console.error('Error fetching scheduled tax payments:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled tax payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type, 
      amount, 
      dueDate, 
      description, 
      isRecurring, 
      recurringFrequency, 
      notificationDate, 
      organizationId 
    } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const schedule = await prisma.taxSchedule.create({
      data: {
        type,
        amount,
        dueDate: new Date(dueDate),
        description,
        isRecurring,
        recurringFrequency,
        notificationDate: notificationDate ? new Date(notificationDate) : null,
        organization: { connect: { id: organizationId } }
      }
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error creating tax payment schedule:', error);
    return NextResponse.json({ error: 'Failed to create tax payment schedule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id,
      type, 
      amount, 
      dueDate, 
      description, 
      isRecurring, 
      recurringFrequency, 
      notificationDate,
      status
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const schedule = await prisma.taxSchedule.update({
      where: { id },
      data: {
        type,
        amount,
        dueDate: new Date(dueDate),
        description,
        isRecurring,
        recurringFrequency,
        notificationDate: notificationDate ? new Date(notificationDate) : null,
        status
      }
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error updating tax payment schedule:', error);
    return NextResponse.json({ error: 'Failed to update tax payment schedule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    await prisma.taxSchedule.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tax payment schedule:', error);
    return NextResponse.json({ error: 'Failed to delete tax payment schedule' }, { status: 500 });
  }
} 