import {
  InventoryValuationReport,
  LowStockReport,
  StockTransactionHistory,
  InventoryValuationItem,
  StockTransaction,
} from "./types";

// Helper functions for date manipulation
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Mock inventory items
export const inventoryItems: InventoryValuationItem[] = [
  {
    id: 1,
    name: "Premium Leather Chair",
    sku: "FUR-CH-001",
    stock: 12,
    purchasePrice: 149.99,
    totalValue: 1799.88,
    imageUrl:
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=200",
    category: "Furniture",
    sellingUnit: "each",
    units: "each",
    minStockLevel: 5,
  },
  {
    id: 2,
    name: "Ergonomic Keyboard",
    sku: "TECH-KB-202",
    stock: 45,
    purchasePrice: 89.99,
    totalValue: 4049.55,
    imageUrl:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200",
    category: "Electronics",
    sellingUnit: "each",
    units: "each",
    minStockLevel: 10,
  },
  {
    id: 3,
    name: "Wireless Headphones",
    sku: "TECH-HP-305",
    stock: 23,
    purchasePrice: 129.99,
    totalValue: 2989.77,
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
    category: "Electronics",
    sellingUnit: "each",
    units: "each",
    minStockLevel: 15,
  },
  {
    id: 4,
    name: "Desk Lamp",
    sku: "OFF-LP-412",
    stock: 0,
    purchasePrice: 34.99,
    totalValue: 0,
    imageUrl:
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=200",
    category: "Office Supplies",
    sellingUnit: "each",
    units: "each",
    minStockLevel: 5,
  },
  {
    id: 5,
    name: "Notebook Set",
    sku: "OFF-NB-555",
    stock: 120,
    purchasePrice: 12.99,
    totalValue: 1558.8,
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200",
    category: "Office Supplies",
    sellingUnit: "pack of 5",
    units: "dozen",
    minStockLevel: 24,
  },
  {
    id: 6,
    name: "Stapler",
    sku: "OFF-ST-001",
    stock: 1,
    purchasePrice: 8.99,
    totalValue: 8.99,
    imageUrl:
      "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=200",
    category: "Office Supplies",
    sellingUnit: "each",
    units: "each",
    minStockLevel: 5,
  },
];

// Generate inventory valuation report
export const inventoryReport: InventoryValuationReport = {
  items: inventoryItems,
  totalValue: inventoryItems.reduce((sum, item) => sum + item.totalValue, 0),
  totalItems: inventoryItems.reduce((sum, item) => sum + item.stock, 0),
  reportDate: new Date(),
  orgId: "org-123",
};

// Generate low stock report
export const lowStockReport: LowStockReport = {
  items: inventoryItems
    .filter((item) => item.stock < (item.minStockLevel || 5))
    .map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      stock: item.stock,
      minStockLevel: item.minStockLevel,
      stockStatus: item.stock === 0 ? "OUT_OF_STOCK" : "LOW",
      imageUrl: item.imageUrl,
      category: item.category,
    })),
  totalLowStockItems: inventoryItems.filter(
    (item) => item.stock > 0 && item.stock < (item.minStockLevel || 5)
  ).length,
  totalOutOfStockItems: inventoryItems.filter((item) => item.stock === 0)
    .length,
  reportDate: new Date(),
  orgId: "org-123",
};

// Generate transactions
export const transactions: StockTransaction[] = [
  {
    id: 1,
    productId: 1,
    productName: "Premium Leather Chair",
    transactionType: "PURCHASE",
    quantity: 5,
    unitPrice: 149.99,
    totalAmount: 749.95,
    direction: "IN",
    transactionDate: addDays(new Date(), -7),
    notes: "Initial stock purchase\nVendor: Furniture World",
    supplierName: "Furniture Co.",
    createdBy: "admin@example.com",
    attachments: [
      {
        id: 1,
        name: "invoice_001.pdf",
        url: "https://example.com/documents/invoice_001.pdf",
      },
      {
        id: 2,
        name: "receipt_001.jpg",
        url: "https://example.com/documents/receipt_001.jpg",
      },
    ],
  },
  {
    id: 2,
    productId: 2,
    productName: "Ergonomic Keyboard",
    transactionType: "SALE",
    quantity: 2,
    unitPrice: 129.99,
    totalAmount: 259.98,
    direction: "OUT",
    transactionDate: addDays(new Date(), -6),
    notes: "Online order #1001\nCustomer: John Smith",
    supplierName: null,
    createdBy: "system",
    attachments: [
      {
        id: 3,
        name: "order_1001.pdf",
        url: "https://example.com/documents/order_1001.pdf",
      },
    ],
  },
  {
    id: 3,
    productId: 4,
    productName: "Desk Lamp",
    transactionType: "ADJUSTMENT",
    quantity: 1,
    unitPrice: 34.99,
    totalAmount: 34.99,
    direction: "OUT",
    transactionDate: addDays(new Date(), -5),
    notes: "Damaged during handling\nMarked as defective",
    supplierName: null,
    createdBy: "staff@example.com",
    attachments: [],
  },
  {
    id: 4,
    productId: 3,
    productName: "Wireless Headphones",
    transactionType: "PURCHASE",
    quantity: 10,
    unitPrice: 119.99,
    totalAmount: 1199.9,
    direction: "IN",
    transactionDate: addDays(new Date(), -4),
    notes: "Restock order\nVendor: Tech Supplies Inc.",
    supplierName: "Tech Supplies Inc.",
    createdBy: "admin@example.com",
    attachments: [
      {
        id: 4,
        name: "invoice_002.pdf",
        url: "https://example.com/documents/invoice_002.pdf",
      },
    ],
  },
  {
    id: 5,
    productId: 5,
    productName: "Notebook Set",
    transactionType: "SALE",
    quantity: 20,
    unitPrice: 12.99,
    totalAmount: 259.8,
    direction: "OUT",
    transactionDate: addDays(new Date(), -3),
    notes: "Bulk order\nCustomer: Riverside High School",
    supplierName: null,
    createdBy: "system",
    attachments: [
      {
        id: 5,
        name: "school_order.pdf",
        url: "https://example.com/documents/school_order.pdf",
      },
      {
        id: 6,
        name: "delivery_confirmation.pdf",
        url: "https://example.com/documents/delivery_confirmation.pdf",
      },
    ],
  },
  {
    id: 6,
    productId: 2,
    productName: "Ergonomic Keyboard",
    transactionType: "PURCHASE",
    quantity: 15,
    unitPrice: 85.99,
    totalAmount: 1289.85,
    direction: "IN",
    transactionDate: addDays(new Date(), -2),
    notes: "Bulk discount applied\nVendor: Keyboard World",
    supplierName: "Keyboard World",
    createdBy: "purchasing@example.com",
    attachments: [
      {
        id: 7,
        name: "invoice_kb003.pdf",
        url: "https://example.com/documents/invoice_kb003.pdf",
      },
    ],
  },
  {
    id: 7,
    productId: 1,
    productName: "Premium Leather Chair",
    transactionType: "SALE",
    quantity: 1,
    unitPrice: 299.99,
    totalAmount: 299.99,
    direction: "OUT",
    transactionDate: addDays(new Date(), -1),
    notes: "Showroom sale\nCustomer: Jane Doe",
    supplierName: null,
    createdBy: "pos@example.com",
    attachments: [
      {
        id: 8,
        name: "receipt_007.pdf",
        url: "https://example.com/documents/receipt_007.pdf",
      },
    ],
  },
];

// Generate transaction history
export const transactionHistory: StockTransactionHistory = {
  transactions: transactions.sort(
    (a, b) => b.transactionDate.getTime() - a.transactionDate.getTime()
  ),
  totalTransactions: transactions.length,
  startDate: addDays(new Date(), -30),
  endDate: new Date(),
  orgId: "org-123",
};

// Recent transactions for overview (last 5)
export const recentTransactions = transactions
  .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime())
  .slice(0, 5);
