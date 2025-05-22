import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { InvoiceDocument } from '@/utils/invoices/template2';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const {saleId} = await params;

  if (!saleId) {
    return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
  }

  try {
    // Fetch sale data with relations needed for the PDF
    const sale = await db.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: true, // Include customer details [cite: 55]
        organization: { // Include organization details [cite: 18]
          include: {
            settings: true // Include settings for currency etc. [cite: 20]
          }
        },
        items: { // Include sale items [cite: 61]
          include: {
            variant: true, // Include product variant details for item name [cite: 62]
          },
        },
        // Include other relations if needed (e.g., member)
        // member: true, [cite: 56]
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

     // Ensure all required data is present before rendering
     if (!sale.organization) {
        return NextResponse.json({ error: 'Organization data missing for the sale' }, { status: 500 });
     }
     if (!sale.items) {
        return NextResponse.json({ error: 'Sale items data missing' }, { status: 500 });
    }

    // Render the PDF document to a stream
    const stream = await renderToStream( <InvoiceDocument sale={sale} />);
    
    // Return the PDF stream in the response
    return new NextResponse(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${sale.saleNumber}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    let errorMessage = 'Failed to generate PDF';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: 'Failed to generate PDF', details: errorMessage }, { status: 500 });
  }
}

// Optional: GET handler if you prefer triggering PDF generation via GET
// export async function GET(...) { ... same logic as POST ... }