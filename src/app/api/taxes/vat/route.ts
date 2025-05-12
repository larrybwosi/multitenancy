import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getOrganizationById } from '@/actions/organization';
// import { getServerAuthContext } from '@/actions/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const month = searchParams.get('month');
    // const { organizationId} = await getServerAuthContext()
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const org = await getOrganizationById(organizationId);
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
    const invoices = await prisma.sale.findMany({
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
        const itemTotal = item.quantity * parseInt(item.unitPrice.toString());
        totalSales += itemTotal;
        
        totalVAT = parseInt(item.taxAmount.toString())
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
      vatRate: org?.settings?.defaultTaxRate
    });
  } catch (error) {
    console.error('Error calculating VAT:', error);
    return NextResponse.json({ error: 'Failed to calculate VAT' }, { status: 500 });
  }
} 