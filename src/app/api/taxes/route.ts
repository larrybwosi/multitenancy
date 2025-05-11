import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface TaxRecord {
  id: string;
  date: Date;
  type: string;
  amount: number;
  status: string;
  description: string;
  organizationId: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const month = searchParams.get('month');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    let whereClause: any = { organizationId };

    if (month) {
      const startDate = new Date(month);
      const endDate = new Date(new Date(month).setMonth(startDate.getMonth() + 1));
      
      whereClause.date = {
        gte: startDate,
        lt: endDate
      };
    }

    const taxes = await prisma.taxRecord.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ taxes });
  } catch (error) {
    console.error('Error fetching taxes:', error);
    return NextResponse.json({ error: 'Failed to fetch taxes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount, status, description, date, organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const tax = await prisma.taxRecord.create({
      data: {
        type,
        amount,
        status,
        description,
        date: new Date(date),
        organization: { connect: { id: organizationId } }
      }
    });

    return NextResponse.json({ tax });
  } catch (error) {
    console.error('Error creating tax record:', error);
    return NextResponse.json({ error: 'Failed to create tax record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, amount, status, description, date } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tax record ID is required' }, { status: 400 });
    }

    const tax = await prisma.taxRecord.update({
      where: { id },
      data: {
        type,
        amount,
        status,
        description,
        date: new Date(date)
      }
    });

    return NextResponse.json({ tax });
  } catch (error) {
    console.error('Error updating tax record:', error);
    return NextResponse.json({ error: 'Failed to update tax record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tax record ID is required' }, { status: 400 });
    }

    await prisma.taxRecord.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tax record:', error);
    return NextResponse.json({ error: 'Failed to delete tax record' }, { status: 500 });
  }
} 