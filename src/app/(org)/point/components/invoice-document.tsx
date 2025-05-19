import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
  },
  invoiceNumber: {
    fontSize: 12,
    textAlign: "right",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  addressSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  addressColumn: {
    width: "45%",
  },
  addressText: {
    fontSize: 10,
    marginBottom: 3,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
  },
  tableCell: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
    fontSize: 10,
  },
  itemCell: {
    width: "40%",
  },
  quantityCell: {
    width: "20%",
    textAlign: "center",
  },
  priceCell: {
    width: "20%",
    textAlign: "right",
  },
  amountCell: {
    width: "20%",
    textAlign: "right",
  },
  summarySection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  summaryColumn: {
    width: "30%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
  },
  summaryLabel: {
    fontSize: 10,
  },
  summaryValue: {
    fontSize: 10,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: "#bfbfbf",
    borderTopStyle: "solid",
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
  },
  footerText: {
    fontSize: 10,
    textAlign: "center",
    color: "#666",
    marginBottom: 5,
  },
  footerWave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  paymentSection: {
    marginTop: 40,
  },
  paymentInfo: {
    fontSize: 10,
    marginBottom: 3,
  },
  noteSection: {
    marginTop: 20,
  },
  noteText: {
    fontSize: 10,
    fontStyle: "italic",
  },
})

// Format currency
const formatCurrency = (amount) => {
  return `Rp ${amount.toLocaleString("id-ID")}`
}

// Invoice Document Component
export function InvoiceDocument({ order }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text>YOUR LOGO</Text>
          </View>
          <View>
            <Text style={styles.invoiceNumber}>NO. {order.orderNumber}</Text>
          </View>
        </View>

        {/* Invoice Title */}
        <View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.addressText}>Date: {order.date}</Text>
        </View>

        {/* Billing and From Information */}
        <View style={styles.addressSection}>
          <View style={styles.addressColumn}>
            <Text style={styles.sectionTitle}>Billed to:</Text>
            <Text style={styles.addressText}>{order.customerName}</Text>
            <Text style={styles.addressText}>{order.customerAddress || "123 Anywhere St., Any City"}</Text>
            <Text style={styles.addressText}>{order.customerEmail || "customer@example.com"}</Text>
          </View>
          <View style={styles.addressColumn}>
            <Text style={styles.sectionTitle}>From:</Text>
            <Text style={styles.addressText}>FoodPoint Restaurant</Text>
            <Text style={styles.addressText}>123 Anywhere St., Any City</Text>
            <Text style={styles.addressText}>info@foodpoint.com</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCell, styles.itemCell]}>
              <Text>Item</Text>
            </View>
            <View style={[styles.tableCell, styles.quantityCell]}>
              <Text>Quantity</Text>
            </View>
            <View style={[styles.tableCell, styles.priceCell]}>
              <Text>Price</Text>
            </View>
            <View style={[styles.tableCell, styles.amountCell]}>
              <Text>Amount</Text>
            </View>
          </View>

          {/* Table Rows */}
          {order.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, styles.itemCell]}>
                <Text>{item.name}</Text>
              </View>
              <View style={[styles.tableCell, styles.quantityCell]}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCell, styles.priceCell]}>
                <Text>{formatCurrency(item.price)}</Text>
              </View>
              <View style={[styles.tableCell, styles.amountCell]}>
                <Text>{formatCurrency(item.price * item.quantity)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryColumn}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>- {formatCurrency(order.discount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>{formatCurrency(order.tax)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment method:</Text>
          <Text style={styles.paymentInfo}>{order.paymentMethod}</Text>
        </View>

        {/* Note */}
        <View style={styles.noteSection}>
          <Text style={styles.sectionTitle}>Note:</Text>
          <Text style={styles.noteText}>Thank you for choosing us!</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>FoodPoint Restaurant - Thank you for your business</Text>
        </View>
      </Page>
    </Document>
  )
}
