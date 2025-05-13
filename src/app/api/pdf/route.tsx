import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Document, Page, Text, View, StyleSheet, Font, renderToStream } from '@react-pdf/renderer';

// Validation schema using zod
const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be a positive number'),
});

const InvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  recipient: z.object({
    name: z.string().min(1, 'Recipient name is required'),
    address: z.string().min(1, 'Recipient address is required'),
  }),
  company: z.object({
    name: z.string().min(1, 'Company name is required'),
    address: z.string().min(1, 'Company address is required'),
  }),
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
  taxRate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
  bankDetails: z.object({
    bankName: z.string().min(1, 'Bank name is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
  }),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
});

// Styles for the PDF
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  text: { fontSize: 12, marginBottom: 5 },
  table: { border: '1px solid black', marginBottom: 20 },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid black' },
  tableCell: { flex: 1, padding: 5, fontSize: 12 },
  bold: { fontWeight: 'bold' },
  footer: { marginTop: 20, fontSize: 10 },
});

// Register font (Helvetica is built-in in react-pdf)
Font.register({ family: 'Helvetica', fonts: [{ src: 'Helvetica' }] });

// PDF Component
const InvoicePDF = ({ data }: { data: z.infer<typeof InvoiceSchema> }) => {
  const subtotal = data.items.reduce((sum, item) => sum + item.price, 0);
  const tax = (subtotal * data.taxRate) / 100;
  const total = subtotal + tax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.text}>NO: {data.invoiceNumber}</Text>
            <Text style={styles.text}>DUE: {data.dueDate}</Text>
          </View>
          <Text style={styles.title}>INVOICE</Text>
        </View>

        {/* Recipient and Company */}
        <View style={styles.header}>
          <View>
            <Text style={styles.text}>INVOICE TO</Text>
            <Text style={styles.text}>{data.recipient.name}</Text>
            <Text style={styles.text}>{data.recipient.address}</Text>
          </View>
          <View>
            <Text style={styles.text}>COMPANY:</Text>
            <Text style={styles.text}>{data.company.name}</Text>
            <Text style={styles.text}>{data.company.address}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.bold]}>Description</Text>
            <Text style={[styles.tableCell, styles.bold]}>Price</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.description}</Text>
              <Text style={styles.tableCell}>${item.price}</Text>
            </View>
          ))}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.bold]}>Subtotal</Text>
            <Text style={styles.tableCell}>${subtotal}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.bold]}>Tax ({data.taxRate}%)</Text>
            <Text style={styles.tableCell}>${tax}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.bold]}>TOTAL</Text>
            <Text style={styles.tableCell}>${total}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <Text style={styles.text}>PAYMENT METHOD</Text>
        <Text style={styles.text}>Bank Name: {data.bankDetails.bankName}</Text>
        <Text style={styles.text}>Bank Account: {data.bankDetails.accountNumber}</Text>
        <Text style={styles.text}>{data.paymentTerms}</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.text}>Signature of Authorized Person ____________________ Date ____________________</Text>
        </View>
      </Page>
    </Document>
  );
};

// POST Route Handler
export async function GET(request: Request) {
  try {
    // const body = await request.json();

    // Validate the request body
    // const parsedData = InvoiceSchema.safeParse(body);
    // if (!parsedData.success) {
    //   return NextResponse.json({ error: parsedData.error.errors }, { status: 400 });
    // }

    const data = {
      invoiceNumber: '1009-01',
      dueDate: '1 April 2022',
      recipient: {
        name: 'Bailey Dupont',
        address: 'Studio Shadowe, 123 Anywhere St., Any City, ST 12345',
      },
      company: {
        name: 'Wardiere Inc',
        address: '123 Anywhere St., Any City, ST 12345',
      },
      items: [
        { description: 'Digital Consulting', price: 1000 },
        { description: 'Application Management Services', price: 2470 },
        { description: 'Cloud Business Services', price: 3000 },
        { description: 'Business Analyst', price: 1700 },
      ],
      taxRate: 10,
      bankDetails: {
        bankName: 'Thynk Unlimited Bank',
        accountNumber: '123-456-7890',
      },
      paymentTerms:
        'Payment Terms Are Usually Stated on the Invoice. These May Specify That the Buyer Has a Maximum Number of Days in Which To Pay and Is Sometimes Offered a Discount If Paid Before the Due Date. The Buyer Could Have Already Paid for the Products or Services Listed on the Invoice.',
    };

    // Generate PDF buffer
    const stream = await renderToStream(<InvoicePDF data={data} />);
    
    return new NextResponse(stream);
  } catch (error) {
    console.log('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
