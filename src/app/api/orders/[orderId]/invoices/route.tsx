// app/api/orders/[orderId]/invoice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Order, OrderStatus } from '@/prisma/client';
import { PDFViewer, Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import React from 'react'; // react-pdf requires React
import { renderToStream } from '@react-pdf/renderer'; // For server-side streaming

const prisma = new PrismaClient();

// --- Register Fonts (if using custom fonts) ---
// Font.register({
//   family: 'Oswald',
//   src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
// });

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', // Default font
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 30,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    alignSelf: 'center', // Center the logo
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    // fontFamily: 'Oswald', // Example custom font
  },
  subtitle: {
    fontSize: 14,
    color: 'grey',
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 3,
  },
  text: {
    marginBottom: 3,
  },
  boldText: {
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  table: {
    // @ts-expect-error table
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%', // Adjust as needed
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    backgroundColor: '#f2f2f2',
    padding: 5,
    fontWeight: 'bold',
  },
  tableCol: {
    width: '25%', // Adjust as needed
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    padding: 5,
  },
  tableCell: {
    fontSize: 10,
  },
  totalsSection: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: '40%',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
    textAlign: 'center',
    color: 'grey',
    fontSize: 9,
  },
});

// --- Invoice Document Component ---
interface InvoiceProps {
  order: Order & {
    items: Array<any>; // Replace 'any' with actual OrderItem type with variant details
    organization: any; // Replace 'any' with actual Organization type
    customer?: any; // Replace 'any' with actual Customer type
  };
}

const InvoiceDocument: React.FC<InvoiceProps> = ({ order }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Optional: Organization Logo */}
      {order.organization.logo && (
        <img style={styles.logo} src={order.organization.logo} />
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Invoice</Text>
        <Text style={styles.subtitle}>Order #: {order.orderNumber}</Text>
      </View>

      {/* Organization and Customer Details */}
      <View style={styles.row}>
        <View style={{ width: '50%' }}>
          <Text style={styles.sectionTitle}>From:</Text>
          <Text style={styles.boldText}>{order.organization.name}</Text>
          {/* Add more organization address details if available */}
          <Text>Contact: {/* organization contact */}</Text>
        </View>
        <View style={{ width: '50%', textAlign: 'right' }}>
          <Text style={styles.sectionTitle}>To:</Text>
          {order.customer ? (
            <>
              <Text style={styles.boldText}>{order.customer.name}</Text>
              <Text>{order.customer.email}</Text>
              <Text>{order.billingAddress || order.customer.address || 'N/A'}</Text>
            </>
          ) : (
            <Text>N/A</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Details:</Text>
        <Text>Date Placed: {new Date(order.placedAt).toLocaleDateString()}</Text>
        <Text>Payment Status: {order.paymentStatus}</Text>
        {order.paymentMethod && <Text>Payment Method: {order.paymentMethod}</Text>}
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={{ ...styles.tableColHeader, width: '40%' }}><Text style={styles.tableCell}>Item</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCell}>Quantity</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCell}>Unit Price</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCell}>Total</Text></View>
        </View>
        {/* Table Rows */}
        {order.items.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={{ ...styles.tableCol, width: '40%' }}>
              <Text style={styles.tableCell}>{item.productName} ({item.variantName})</Text>
              {item.notes && <Text style={{ ...styles.tableCell, fontSize: 8, color: 'grey' }}>Notes: {item.notes}</Text>}
            </View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.quantity}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>${item.unitPrice.toFixed(2)}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>${item.totalPrice.toFixed(2)}</Text></View>
          </View>
        ))}
      </View>

      {/* Totals Section */}
      <View style={styles.totalsSection}>
        <View style={styles.row}><Text>Subtotal:</Text><Text>${order.subTotal.toFixed(2)}</Text></View>
        {order.discountAmount && order.discountAmount.gt(0) && (
          <View style={styles.row}><Text>Discount:</Text><Text>- ${order.discountAmount.toFixed(2)}</Text></View>
        )}
         {order.shippingAmount && order.shippingAmount.gt(0) && (
          <View style={styles.row}><Text>Shipping:</Text><Text>${order.shippingAmount.toFixed(2)}</Text></View>
        )}
        {order.taxAmount && order.taxAmount.gt(0) && (
          <View style={styles.row}><Text>Tax:</Text><Text>${order.taxAmount.toFixed(2)}</Text></View>
        )}
        <View style={{...styles.row, borderTopWidth: 1, borderTopColor: '#aaaaaa', paddingTop: 5, marginTop: 5}}>
          <Text style={styles.boldText}>Total:</Text>
          <Text style={styles.boldText}>${order.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Footer Notes */}
      <View style={{ marginTop: 30 }}>
        <Text style={styles.sectionTitle}>Notes & Terms:</Text>
        <Text>Thank you for your business!</Text>
        {/* Add payment terms or other notes */}
      </View>

      <Text style={styles.footer}>
        {order.organization.name} - Invoice generated on {new Date().toLocaleDateString()}
      </Text>
    </Page>
  </Document>
);


export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const orderId = params.orderId;
  // TODO: Add authentication and authorization here to ensure the user
  // requesting the invoice has the right to access this order.
  // This might involve getting the current user/member session.
  const organizationId = request.headers.get('x-organization-id'); // Example: Get orgId from header or session

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId, organizationId }, // Ensure it belongs to the claimed organization
      include: {
        items: {
          include: {
            variant: { // To get variant name if not directly on OrderItem productName/variantName
              include: { product: true }
            }
          }
        },
        customer: true,
        organization: true, // Fetch organization details for the invoice header
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 });
    }

    // Check if order status allows invoice generation (e.g., not PENDING_CONFIRMATION or CANCELLED)
    if ([OrderStatus.PENDING_CONFIRMATION, OrderStatus.CANCELLED, OrderStatus.FAILED].includes(order.status)) {
        // return NextResponse.json({ error: `Invoice cannot be generated for order with status: ${order.status}` }, { status: 400 });
    }


    // Create the PDF stream
    const pdfStream = await renderToStream(<InvoiceDocument order={order as any} />); // Cast order as any for simplicity here

    // Set headers for PDF download
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);

    return new NextResponse(pdfStream as any, { headers });

  } catch (error: any) {
    console.error('Failed to generate invoice:', error);
    return NextResponse.json({ error: 'Failed to generate invoice', details: error.message }, { status: 500 });
  }
}