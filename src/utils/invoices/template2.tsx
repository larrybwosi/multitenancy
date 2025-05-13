// components/pdf/InvoiceDocument.tsx
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Sale, SaleItem, Customer, Organization, ProductVariant } from '@/prisma/client'; // Assuming Prisma client types

// --- Types ---
// Extend Prisma types if necessary or create a specific type for props
type InvoiceDocumentProps = {
  sale: Sale & {
    customer: Customer | null;
    organization: Organization & { settings?: { defaultCurrency?: string } | null }; // Include org settings if needed
    items: (SaleItem & {
      variant: ProductVariant;
    })[];
  };
};

// --- Styles ---
// Register fonts if needed (ensure font files are accessible)
// Font.register({ family: 'Oswald', src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf' });

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', // Default font
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 30,
    lineHeight: 1.5,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold', // Use 'bold' or numeric values like 700
    textAlign: 'right',
    // fontFamily: 'Oswald' // Use registered font if needed
  },
  invoiceInfo: {
    fontSize: 9,
    textAlign: 'left',
  },
  addressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  addressBlock: {
    width: '45%', // Adjust as needed
  },
  addressTitle: {
    fontSize: 9,
    color: '#888888', // Grey color
    marginBottom: 3,
  },
  addressText: {
    fontSize: 10,
    lineHeight: 1.3,
  },
  companyName: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  table: {
    display: 'flex', // Use flexbox for table layout
    width: 'auto',
    borderStyle: 'solid',
    borderColor: '#eaeaea',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#00684A', // Green header
    color: 'white',
    borderBottomColor: '#eaeaea',
    borderBottomWidth: 1,
    alignItems: 'center',
    height: 24,
    textAlign: 'center',
    fontStyle: 'normal',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#eaeaea',
    borderBottomWidth: 1,
    alignItems: 'center',
    minHeight: 24, // Ensure row height fits content
    // height: 24, // Fixed height might clip text
  },
  tableColHeaderDesc: {
    width: '70%',
    borderRightColor: '#eaeaea',
    borderRightWidth: 1,
    textAlign: 'left',
    paddingLeft: 8,
    paddingVertical: 5, // Add padding for text
  },
  tableColHeaderPrice: {
    width: '30%',
    textAlign: 'right',
    paddingRight: 8,
    paddingVertical: 5, // Add padding for text
  },
  tableColDesc: {
    width: '70%',
    borderRightColor: '#eaeaea',
    borderRightWidth: 1,
    textAlign: 'left',
    paddingLeft: 8,
    paddingVertical: 5, // Add padding for text
  },
  tableColPrice: {
    width: '30%',
    textAlign: 'right',
    paddingRight: 8,
    paddingVertical: 5, // Add padding for text
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align to the right
    marginBottom: 30,
  },
  summaryBox: {
    width: '40%', // Adjust width as needed
    backgroundColor: '#F7F7F7', // Light grey background
    padding: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
  },
  summaryValue: {
    fontSize: 10,
    textAlign: 'right',
  },
  summaryTotalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
    fontSize: 9,
  },
  paymentMethod: {
    marginBottom: 20,
  },
  paymentTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  signatureContainer: {
    borderTopColor: '#000000',
    borderTopWidth: 1,
    paddingTop: 5,
    marginTop: 40, // Space above signature line
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureText: {
    width: '60%', // Adjust as needed
  },
  dateText: {
    width: '30%', // Adjust as needed
    textAlign: 'right',
  },
});

// --- Component ---
export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ sale }) => {
  const customer = sale.customer; // [cite: 55]
  const organization = sale.organization; // [cite: 18]
  const currency = organization.settings?.defaultCurrency || '$'; // [cite: 180] Default to $ if not set

  // Format date helper (optional)
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      // Example format DD/MM/YYYY
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Calculate tax percentage if needed (example: using average rate from items)
  // This might need adjustment based on how tax is stored/calculated
  const totalTaxAmount = sale.taxAmount?.toNumber() ?? 0; // [cite: 56]
  const subtotal = sale.totalAmount?.toNumber() ?? 0; // [cite: 56]
  const calculatedTaxPercent = subtotal > 0 ? (totalTaxAmount / subtotal) * 100 : 0;

  return (
    <Document title={`Invoice ${sale.saleNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.invoiceInfo}>
            <Text>NO. {sale.saleNumber}</Text> {/* [cite: 56] */}
            <Text>DUE {formatDate(sale.saleDate)}</Text> {/* [cite: 56] */}
          </View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        {/* Addresses */}
        <View style={styles.addressContainer}>
          <View style={styles.addressBlock}>
            <Text style={styles.addressTitle}>INVOICE TO</Text>
            <Text style={styles.addressText}>{customer?.name || 'N/A'}</Text> {/* [cite: 49] */}
            <Text style={styles.addressText}>{customer?.address || 'N/A'}</Text> {/* [cite: 50] */}
            {/* Add more customer address fields if available */}
          </View>
          <View style={[styles.addressBlock, { textAlign: 'right' }]}>
            <Text style={styles.addressTitle}>COMPANY</Text>
            <Text style={[styles.addressText, styles.companyName]}>{organization.name}</Text> {/* [cite: 15] */}
            <Text style={styles.addressText}>{organization.address || 'N/A'}</Text> {/* [cite: 15] */}
            {/* Add more organization address fields if available */}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableColHeaderDesc}>Description</Text>
            <Text style={styles.tableColHeaderPrice}>Price</Text>
          </View>
          {/* Table Body */}
          {sale.items.map((item, index) => (
            <View style={styles.tableRow} key={item.id || index}>
              <Text style={styles.tableColDesc}>
                {item.variant.name} {/* [cite: 36] */}
                {item.quantity > 1 ? ` (x${item.quantity})` : ''} {/* [cite: 65] */}
              </Text>
              <Text style={styles.tableColPrice}>
                {currency}
                {item.totalAmount.toFixed(2)} {/* [cite: 65] */}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {currency}
                {(sale.totalAmount?.toNumber() ?? 0).toFixed(2)}
              </Text>
              {/* [cite: 56] */}
            </View>
            {/* Show discount if applicable */}
            {sale.discountAmount && sale.discountAmount.toNumber() > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryValue}>
                  -{currency}
                  {sale.discountAmount.toFixed(2)}
                </Text>
                {/* [cite: 56] */}
              </View>
            )}
            <View style={styles.summaryRow}>
              {/* Display tax amount and potentially the percentage */}
              <Text style={styles.summaryLabel}>
                Tax ({calculatedTaxPercent > 0 ? `${calculatedTaxPercent.toFixed(0)}%` : 'Rate N/A'})
              </Text>
              <Text style={styles.summaryValue}>
                {currency}
                {(sale.taxAmount?.toNumber() ?? 0).toFixed(2)}
              </Text>
              {/* [cite: 56] */}
            </View>
            <View
              style={[styles.summaryRow, { marginTop: 5, borderTopWidth: 1, borderTopColor: '#aaaaaa', paddingTop: 5 }]}
            >
              <Text style={styles.summaryTotalLabel}>TOTAL</Text>
              <Text style={styles.summaryTotalValue}>
                {currency}
                {(sale.finalAmount?.toNumber() ?? 0).toFixed(2)}
              </Text>
              {/* [cite: 56] */}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.paymentMethod}>
            <Text style={styles.paymentTitle}>PAYMENT METHOD</Text>
            {/* Replace with dynamic data if available in OrganizationSettings or Sale */}
            <Text>Bank Name: Thynk Unlimited Bank</Text>
            <Text>Bank Account: 123-456-7890</Text>
            <Text style={{ fontSize: 8, color: '#555555', marginTop: 5 }}>
              Payment Terms Are Usually Stated on the Invoice. These May Specify That the Buyer Has a Maximum Number of
              Days In Which To Pay and Is Sometimes Offered a Discount If Paid Before the Due Date. The Buyer Could Have
              Already Paid for the Products or Services Listed on the Invoice.
            </Text>
          </View>
          <View style={styles.signatureContainer}>
            <Text style={styles.signatureText}>Signature of Authorized Person</Text>
            <Text style={styles.dateText}>Date</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
