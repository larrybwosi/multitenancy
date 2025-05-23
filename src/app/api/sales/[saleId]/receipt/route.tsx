import { NextRequest, NextResponse } from 'next/server';
import { Document, Page, Text, View, StyleSheet, renderToStream, Image, renderToBuffer } from '@react-pdf/renderer';
import prisma from '@/lib/db';
import { getServerAuthContext } from '@/actions/auth';
import QRCode from 'qrcode';

// Define styles for your PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  pageThermal80: {
    width: 226, // 80mm in points (approx)
    padding: 10, // Increased padding slightly
    fontSize: 9,
    fontFamily: 'Helvetica',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: 15, // Increased spacing
    alignItems: 'center',
  },
  logo: {
    width: 50, // Adjusted size
    height: 50,
    marginBottom: 5,
  },
  orgName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  address: {
    fontSize: 8,
    marginBottom: 1, // Reduced spacing between address lines
  },
  receiptTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10, // Increased spacing
    textTransform: 'uppercase', // Added emphasis
  },
  section: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  infoLabel: {
    fontWeight: 'bold',
  },
  infoValue: {
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5, // Increased spacing
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    paddingBottom: 3, // Increased padding
    marginTop: 5, // Added top margin
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3, // Increased spacing
    paddingHorizontal: 2,
    borderBottomWidth: 0.2, // Lighter border for items
    borderBottomColor: '#ccc',
    paddingBottom: 3,
  },
  itemHeader: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#000',
    paddingBottom: 3,
    marginBottom: 4,
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
    flex: 1.5, // Increased width
    textAlign: 'right',
  },
  itemTotal: {
    flex: 1.5, // Increased width
    textAlign: 'right',
  },
  totalsContainer: {
    marginTop: 15, // Increased spacing
    borderTopWidth: 1, // Thicker border
    borderTopColor: '#000',
    paddingTop: 8, // Increased padding
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3, // Increased spacing
  },
  boldText: {
    fontWeight: 'bold',
  },
  grandTotal: {
    marginTop: 5,
    fontSize: 12, // Larger font
    fontWeight: 'bold',
  },
  qrCode: {
    width: 80, // Set QR code size
    height: 80,
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  footer: {
    textAlign: 'center',
    fontSize: 8,
    marginTop: 20, // Increased spacing
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 8, // Increased padding
    color: '#555', // Grey text
  },
});

// Define your PDF Document Component
interface ReceiptPdfProps {
  sale: any; // Ideally, replace with a specific Sale type
  organization: any; // Ideally, replace with a specific Organization type
  size: string;
  qrCodeUrl: string; // Add QR code URL prop
}

const ReceiptPdfDocument: React.FC<ReceiptPdfProps> = ({ sale, organization, size, qrCodeUrl }) => {
  const pageStyle = size === '80mm' ? styles.pageThermal80 : styles.page;
  const currency = organization?.settings?.defaultCurrency || 'USD';
  const location = sale.location; // Get the location (branch)
  const memberUser = sale.member?.user; // Get the user (cashier) from member

  return (
    <Document>
      {/* For 80mm, potentially make height dynamic based on content */}
      <Page size={size === '80mm' ? [230, 700] : 'A4'} style={pageStyle}>
        <View style={styles.header}>
          {organization?.logo && <Image style={styles.logo} src={organization.logo} />}
          <Text style={styles.orgName}>{organization?.name || 'Your Company'}</Text>
          {/* Use location address if available, otherwise a placeholder */}
          <Text style={styles.address}>{location?.address || '123 Main St, Anytown'}</Text>
          {/* Add more org/branch details if needed */}
          <Text style={styles.address}>Branch: {location?.name || 'Main Branch'}</Text>
          <Text style={styles.address}>Phone: {organization?.phone || 'N/A'}</Text>
        </View>

        <Text style={styles.receiptTitle}>Sales Receipt</Text>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Receipt No:</Text>
            <Text style={styles.infoValue}>{sale?.saleNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            {/* Format Date and Time */}
            <Text style={styles.infoValue}>
              {new Date(sale?.saleDate).toLocaleDateString()} {new Date(sale?.saleDate).toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Served By:</Text>
            {/* Display Cashier's name */}
            <Text style={styles.infoValue}>{memberUser?.name || sale?.member?.id || 'N/A'}</Text>
          </View>
          {sale?.customer && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{sale.customer.name}</Text>
              </View>
              {sale.customer.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{sale.customer.email}</Text>
                </View>
              )}
              {sale.customer.phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{sale.customer.phone}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Purchased</Text>
          <View style={[styles.itemRow, styles.itemHeader, styles.boldText]}>
            <Text style={styles.itemDescription}>Item</Text>
            <Text style={styles.itemQty}>Qty</Text>
            <Text style={styles.itemPrice}>Price</Text>
            <Text style={styles.itemTotal}>Total</Text>
          </View>
          {sale?.items?.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              {/* Use variant name */}
              <Text style={styles.itemDescription}>{item.variant?.name || 'Unknown Item'}</Text>
              <Text style={styles.itemQty}>{item.quantity}</Text>
              <Text style={styles.itemPrice}>{Number(item.unitPrice).toFixed(2)}</Text>
              <Text style={styles.itemTotal}>{Number(item.totalAmount).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            {/* Use totalAmount before discounts/taxes */}
            <Text>
              {currency} {Number(sale?.totalAmount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Discount:</Text>
            <Text>
              - {currency} {Number(sale?.discountAmount || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Tax:</Text>
            <Text>
              {currency} {Number(sale?.taxAmount || 0).toFixed(2)}
            </Text>
          </View>
          {/* Grand Total */}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>TOTAL:</Text>
            <Text>
              {currency} {Number(sale?.finalAmount).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text>Payment Method:</Text>
            <Text style={styles.boldText}>{sale?.paymentMethod}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Payment Status:</Text>
            <Text style={styles.boldText}>{sale?.paymentStatus}</Text>
          </View>
        </View>

        {sale?.notes && (
          <View style={[styles.section, { marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={{ fontSize: 8, fontStyle: 'italic', textAlign: 'center' }}>{sale.notes}</Text>
          </View>
        )}

        {/* QR Code Section */}
        <Image style={styles.qrCode} src={qrCodeUrl} />
        <Text style={{ fontSize: 7, textAlign: 'center', marginBottom: 10 }}>Scan for details</Text>

        <View style={styles.footer}>
          <Text>Thank you for shopping with {organization?.name || 'us'}!</Text>
          <Text>Visit us again soon!</Text>
          {/* Add Website or other footer details */}
          <Text>{organization?.website || 'www.yourcompany.com'}</Text>
        </View>
      </Page>
    </Document>
  );
};

// The API Route Handler
export async function GET(request: NextRequest, { params }: { params: Promise<{ saleId: string }> }) {
  const { saleId } = await params;
  const { organizationId } = await getServerAuthContext(); // Assuming this provides the current org ID
  const searchParams = request.nextUrl.searchParams;
  const size = searchParams.get('size') || '80mm'; // Default to 80mm

  if (!saleId || !organizationId) {
    return NextResponse.json({ error: 'Missing saleId or organizationId' }, { status: 400 });
  }

  try {
    // Fetch the sale data with all necessary relations based on the schema
    const sale = await prisma.sale.findUnique({
      where: { id: saleId, organizationId: organizationId },
      include: {
        items: {
          include: {
            variant: true, // Fetch variant for item name [cite: 76, 47]
          },
        },
        customer: true, // Fetch customer details [cite: 69, 63]
        member: {
          // Fetch member (cashier) [cite: 70]
          include: {
            user: true, // *** Include user to get the name *** [cite: 9, 1]
          },
        },
        location: true, // Fetch location for branch name and address [cite: 71, 128, 131]
        organization: {
          // Fetch organization details [cite: 22]
          include: {
            settings: true, // Fetch settings for currency, etc. [cite: 24, 232]
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // --- Generate QR Code ---
    // Include key info: Sale ID, Org ID, Date, Amount for verification/lookup
    const qrCodeData = JSON.stringify({
      saleId: sale.id,
      orgId: sale.organizationId,
      number: sale.saleNumber,
      date: sale.saleDate,
      amount: sale.finalAmount,
    });
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData);
    // --- End QR Code Generation ---
    
    // Render the PDF to a stream
    const stream = await renderToBuffer(
      <ReceiptPdfDocument sale={sale} organization={sale.organization} size={size} qrCodeUrl={qrCodeUrl} />
    );

    // Return the stream as a PDF response
    return new NextResponse(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        // 'inline' shows in browser, 'attachment' forces download
        'Content-Disposition': `inline; filename="receipt-${sale.saleNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF receipt:', error);
    return NextResponse.json({ error: 'Failed to generate PDF receipt' }, { status: 500 });
  }
}
