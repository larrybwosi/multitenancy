import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  renderToStream,
  Font, // For custom fonts
} from '@react-pdf/renderer';
import prisma from '@/lib/db';
import { getServerAuthContext } from '@/actions/auth';

// It's good practice to register fonts if you use custom ones
// Font.register({ family: 'Roboto', src: '/path/to/Roboto-Regular.ttf' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30, // More padding for a standard A4 invoice
    fontSize: 11,
    fontFamily: 'Helvetica', // Default, consider 'Roboto' or other if registered
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  companyDetails: {
    flex: 1,
  },
  invoiceTitleView: {
    flex: 1,
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  invoiceSubTitle: {
    fontSize: 10,
    color: 'grey',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  orgName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  billingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billTo: {
    flex: 1,
  },
  invoiceInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  table: {
    // @ts-ignore
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 30,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#bfbfbf',
    borderBottomWidth: 1,
    alignItems: 'center',
    minHeight: 24,
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  },
  tableColHeader: {
    padding: 5,
    borderRightColor: '#bfbfbf',
    borderRightWidth: 1,
  },
  tableCol: {
    padding: 5,
    borderRightColor: '#bfbfbf',
    borderRightWidth: 1,
  },
  colDescription: { width: '50%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  noBorderRight: {
    borderRightWidth: 0,
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    paddingVertical: 2,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 5,
    paddingTop: 5,
    fontWeight: 'bold',
  },
  notesSection: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f9f9f9',
    border: '1px solid #eee',
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: 'grey',
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
    paddingTop: 10,
  },
});

interface InvoicePdfProps {
  sale: any; // Replace 'any' with your actual Prisma Sale type, including relations
  organization: any; // Replace 'any' with your actual Prisma Organization type
}

const InvoicePdfDocument: React.FC<InvoicePdfProps> = ({ sale, organization }) => {
  const currency = organization?.settings?.defaultCurrency || 'USD'; //

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.companyDetails}>
            {organization?.logo && <Image style={styles.logo} src={organization.logo} alt={'Logo'} />}
            <Text style={styles.orgName}>{organization?.name || 'Your Company Name'}</Text>
            <Text style={styles.address}>
              {organization?.address || '123 Business Rd, Suite 400\nCity, State, PostalCode\nCountry'}
            </Text>
            <Text style={styles.address}>Phone: {organization?.phone || '(123) 456-7890'}</Text>
            <Text style={styles.address}>Email: {organization?.email || 'contact@yourcompany.com'}</Text>
          </View>
          <View style={styles.invoiceTitleView}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceSubTitle}>Invoice #: {sale?.saleNumber}</Text> {/* */}
            <Text style={styles.invoiceSubTitle}>Date: {new Date(sale?.saleDate).toLocaleDateString()}</Text>
            {/* Add Due Date if applicable */}
          </View>
        </View>

        {/* Billing Information */}
        <View style={styles.billingSection}>
          <View style={styles.billTo}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text>{sale?.customer?.name || 'Valued Customer'}</Text> {/* */}
            <Text style={styles.address}>{sale?.customer?.address || 'N/A'}</Text>
            <Text style={styles.address}>{sale?.customer?.email || ''}</Text>
            <Text style={styles.address}>Phone: {sale?.customer?.phone || ''}</Text> {/* */}
          </View>
          {/* Optionally add a "Ship To" section if different */}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableColHeader, styles.colDescription]}>Description</Text>
            <Text style={[styles.tableColHeader, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableColHeader, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableColHeader, styles.colTotal, styles.noBorderRight]}>Total</Text>
          </View>
          {/* Table Body */}
          {sale?.items?.map(
            (
              item: any,
              index: number //
            ) => (
              <View style={styles.tableRow} key={index}>
                <Text style={[styles.tableCol, styles.colDescription]}>{item.variant?.name || 'Item Name'}</Text>{' '}
                {/* */}
                <Text style={[styles.tableCol, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCol, styles.colPrice]}>{Number(item.unitPrice).toFixed(2)}</Text>
                <Text style={[styles.tableCol, styles.colTotal, styles.noBorderRight]}>
                  {Number(item.totalAmount).toFixed(2)}
                </Text>
              </View>
            )
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text>Subtotal:</Text>
              <Text>
                {currency} {Number(sale?.totalAmount).toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text>
                {currency} {Number(sale?.discountAmount || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text>
                Tax (
                {organization?.settings?.defaultTaxRate
                  ? (organization.settings.defaultTaxRate * 100).toFixed(0) + '%'
                  : 'N/A'}
                ):
              </Text>{' '}
              {/* */}
              <Text>
                {currency} {Number(sale?.taxAmount || 0).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text>Grand Total:</Text>
              <Text>
                {currency} {Number(sale?.finalAmount).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes / Payment Terms */}
        {(sale?.notes || organization?.paymentTerms) /* */ && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes / Payment Terms:</Text>
            {sale?.notes && <Text>{sale.notes}</Text>}
            {organization?.paymentTerms && <Text>Payment Terms: {organization.paymentTerms}</Text>}
            {/* Add standard bank details here if needed */}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>Thank you for your business! If you have any questions, please contact us.</Text>
      </Page>
    </Document>
  );
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ saleId: string; organizationId: string }> }) {
  const { saleId } = await params;
  const {organizationId} = await getServerAuthContext()
  // Size parameter might be less relevant for standard invoices, but you can keep it if needed
  // const searchParams = request.nextUrl.searchParams;
  // const size = searchParams.get('size') || 'A4';

  if (!saleId) {
    return NextResponse.json({ error: 'Missing saleId or organizationId' }, { status: 400 });
  }

  try {
    const sale = await prisma.sale.findUnique({
      //
      where: { id: saleId, organizationId },
      include: {
        items: {
          //
          include: {
            variant: {
              //
              include: {
                product: true, //
              },
            },
          },
        },
        customer: true, //
        organization: {
          //
          include: {
            settings: true, //
            // You might need to extend your Organization model or use customFields for address, phone, email, paymentTerms
          },
        },
        // Include any other relations needed for the invoice
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Invoice data (Sale) not found' }, { status: 404 });
    }

    // For invoices, you'd likely merge organization details from sale.organization
    // and potentially have specific fields for invoice like due date, etc.
    // For simplicity, we pass sale.organization directly here.
    const stream = await renderToStream(<InvoicePdfDocument sale={sale} organization={sale.organization} />);

    return new NextResponse(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${sale.saleNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF invoice:', error);
    return NextResponse.json({ error: 'Failed to generate PDF invoice' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
