import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const taxReturns = await prisma.taxReturn.findMany({
      where: {
        organizationId
      },
      orderBy: {
        filingDate: 'desc'
      },
      include: {
        attachments: true
      }
    });

    return NextResponse.json({ taxReturns });
  } catch (error) {
    console.error('Error fetching tax returns:', error);
    return NextResponse.json({ error: 'Failed to fetch tax returns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { period, type, amount, filingDate, dueDate, status, attachments, organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Create tax return record
    const taxReturn = await prisma.taxReturn.create({
      data: {
        period,
        type,
        amount,
        filingDate: new Date(filingDate),
        dueDate: new Date(dueDate),
        status,
        organization: { connect: { id: organizationId } }
      }
    });

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      const attachmentData = attachments.map((attachment: any) => ({
        name: attachment.name,
        url: attachment.url,
        taxReturnId: taxReturn.id
      }));

      await prisma.taxReturnAttachment.createMany({
        data: attachmentData
      });
    }

    // Get the complete record with attachments
    const completeReturn = await prisma.taxReturn.findUnique({
      where: { id: taxReturn.id },
      include: { attachments: true }
    });

    return NextResponse.json({ taxReturn: completeReturn });
  } catch (error) {
    console.error('Error creating tax return:', error);
    return NextResponse.json({ error: 'Failed to create tax return' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, period, type, amount, filingDate, dueDate, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tax return ID is required' }, { status: 400 });
    }

    const taxReturn = await prisma.taxReturn.update({
      where: { id },
      data: {
        period,
        type,
        amount,
        filingDate: new Date(filingDate),
        dueDate: new Date(dueDate),
        status
      },
      include: {
        attachments: true
      }
    });

    return NextResponse.json({ taxReturn });
  } catch (error) {
    console.error('Error updating tax return:', error);
    return NextResponse.json({ error: 'Failed to update tax return' }, { status: 500 });
  }
} 