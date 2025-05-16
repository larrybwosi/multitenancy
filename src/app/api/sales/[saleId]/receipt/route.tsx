// app/api/receipt/[organizationId]/[saleId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Document, Page, Text, View, StyleSheet, Image, renderToStream } from '@react-pdf/renderer';
import prisma from '@/lib/db';
import { getServerAuthContext } from '@/actions/auth';

// Define styles for your PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 10,
    fontSize: 10,
    fontFamily: 'Helvetica', // Consider embedding a font for consistency
  },
  pageThermal80: {
    // Example for 80mm thermal printer
    width: 226, // 80mm in points (approx)
    padding: 5,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 10,
  },
  orgName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 8,
    marginBottom: 5,
  },
  receiptTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    paddingBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  itemDescription: {
    flex: 3,
    textAlign: 'left',
  },
  itemQty: {
    flex: 1,
    textAlign: 'center',
  },
  itemPrice: {
    flex: 1,
    textAlign: 'right',
  },
  itemTotal: {
    flex: 1.5,
    textAlign: 'right',
  },
  totalsContainer: {
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#000',
    paddingTop: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  boldText: {
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    fontSize: 8,
    marginTop: 15,
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 5,
  },
  logo: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: 5,
  },
});

// Define your PDF Document Component
interface ReceiptPdfProps {
  sale: any; // Replace 'any' with your actual Prisma Sale type, including relations
  organization: any; // Replace 'any' with your actual Prisma Organization type
  size: string; // '80mm' or other sizes
}

const ReceiptPdfDocument: React.FC<ReceiptPdfProps> = ({ sale, organization, size }) => {
  const pageStyle = size === '80mm' ? styles.pageThermal80 : styles.page;
  const currency = organization?.settings?.defaultCurrency || 'USD'; //

  return (
    <Document>
      <Page size={size === '80mm' ? [226, 'auto'] : 'A4'} style={pageStyle}>
        <View style={styles.header}>
          {organization?.logo && <image style={styles.logo} src={organization.logo} />}
          <Text style={styles.orgName}>{organization?.name || 'Your Company'}</Text>
          <Text style={styles.address}>{organization?.address || '123 Main St, Anytown'}</Text>{' '}
          {/* Assuming address is available */}
          <Text style={styles.address}>Phone: {organization?.phone || 'N/A'}</Text> {/* Assuming phone is available */}
        </View>

        <Text style={styles.receiptTitle}>Sales Receipt</Text>

        <View style={styles.section}>
          <Text>Receipt No: {sale?.saleNumber}</Text>
          <Text>Date: {new Date(sale?.saleDate).toLocaleDateString()}</Text>
          <Text>Cashier: {sale?.member?.name || 'N/A'}</Text> {/* */}
          {sale?.customer && (
            <View style={{ marginTop: 5 }}>
              <Text style={styles.sectionTitle}>Customer</Text>
              <Text>{sale.customer.name}</Text>
              <Text>{sale.customer.email}</Text> {/* */}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.itemRow}>
            <Text style={[styles.itemDescription, styles.boldText]}>Item</Text>
            <Text style={[styles.itemQty, styles.boldText]}>Qty</Text>
            <Text style={[styles.itemPrice, styles.boldText]}>Price</Text>
            <Text style={[styles.itemTotal, styles.boldText]}>Total</Text>
          </View>
          {sale?.items?.map(
            (
              item: any,
              index: number //
            ) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemDescription}>{item.variant?.name || 'Unknown Item'}</Text> {/* */}
                <Text style={styles.itemQty}>{item.quantity}</Text>
                <Text style={styles.itemPrice}>{Number(item.unitPrice).toFixed(2)}</Text>
                <Text style={styles.itemTotal}>{Number(item.totalAmount).toFixed(2)}</Text>
              </View>
            )
          )}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text style={styles.boldText}>
              {currency} {Number(sale?.totalAmount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Discount:</Text>
            <Text style={styles.boldText}>
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
            <Text style={styles.boldText}>
              {currency} {Number(sale?.taxAmount || 0).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.boldText, { marginTop: 5, fontSize: size === '80mm' ? 11 : 12 }]}>
            <Text>Total Amount:</Text>
            <Text>
              {currency} {Number(sale?.finalAmount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Payment Method:</Text>
            <Text>{sale?.paymentMethod}</Text>
          </View>
        </View>

        {sale?.notes && (
          <View style={[styles.section, { marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{sale.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          {/* Add more details like website, return policy short note, etc. */}
        </View>
      </Page>
    </Document>
  );
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ saleId: string;}> }) {
  const { saleId } = await params;
  const {organizationId } = await getServerAuthContext()
  const searchParams = request.nextUrl.searchParams;
  const size = searchParams.get('size') || '80mm'; // Default to 80mm

  if (!saleId || !organizationId) {
    return NextResponse.json({ error: 'Missing saleId or organizationId' }, { status: 400 });
  }

  try {
    const sale = await prisma.sale.findUnique({
      //
      where: { id: saleId, organizationId: organizationId },
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
        member: true, //
        location: true, //
        organization: {
          //
          include: {
            settings: true, //
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Use renderToStream for server-side PDF generation
    // See: https://spacejelly.dev/posts/generate-a-pdf-from-html-in-javascript/
    const stream = await renderToStream(
      <ReceiptPdfDocument sale={sale} organization={sale.organization} size={size} />
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      status: 200,
    });
  } catch (error) {
    console.error('Failed to generate PDF receipt:', error);
    return NextResponse.json({ error: 'Failed to generate PDF receipt' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
