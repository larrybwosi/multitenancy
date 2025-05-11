import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const month = searchParams.get('month');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    let dateFilter = {};
    
    if (month) {
      const startDate = new Date(month);
      const endDate = new Date(new Date(month).setMonth(startDate.getMonth() + 1));
      
      dateFilter = {
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      };
    }

    // Calculate VAT from sales/invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        ...dateFilter
      },
      include: {
        items: true
      }
    });

    let totalSales = 0;
    let totalVAT = 0;

    // Calculate VAT based on invoice items
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const itemTotal = item.quantity * item.unitPrice;
        totalSales += itemTotal;
        
        // Calculate VAT (assuming standard rate is 20%, but this should be configured per country)
        const vatRate = 0.20;
        totalVAT += itemTotal * vatRate;
      });
    });

    // Get VAT payments made for the period
    const vatPayments = await prisma.taxRecord.findMany({
      where: {
        organizationId,
        type: 'VAT',
        status: 'Paid',
        ...dateFilter
      }
    });

    const totalVatPaid = vatPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const vatDue = totalVAT - totalVatPaid;

    return NextResponse.json({ 
      totalSales,
      totalVAT,
      totalVatPaid,
      vatDue,
      vatRate: '20%' // This should be configurable
    });
  } catch (error) {
    console.error('Error calculating VAT:', error);
    return NextResponse.json({ error: 'Failed to calculate VAT' }, { status: 500 });
  }
} 