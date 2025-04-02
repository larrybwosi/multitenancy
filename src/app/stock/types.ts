/**
 * Inventory Valuation Types
 */

export type InventoryValuationItem = {
  id: number;
  name: string;
  sku: string | null;
  stock: number;
  purchasePrice: number | null;
  totalValue: number;
  imageUrl: string | null;
  category: string;
  sellingUnit: string;
  units: "each" | "dozen" | "pack" | "box" | "case" | string;
  minStockLevel?: number | null;
};

export type InventoryValuationReport = {
  items: InventoryValuationItem[];
  totalValue: number;
  totalItems: number;
  reportDate: Date;
  orgId: string;
};

/**
 * Low Stock Types
 */

export type LowStockItem = {
  id: number;
  name: string;
  sku: string | null;
  stock: number;
  minStockLevel: number | null;
  stockStatus: "LOW" | "OUT_OF_STOCK" | "NORMAL";
  imageUrl: string | null;
  category: string;
};

export type LowStockReport = {
  items: LowStockItem[];
  totalLowStockItems: number;
  totalOutOfStockItems: number;
  reportDate: Date;
  orgId: string;
};

/**
 * Stock Transaction Types
 */

export type TransactionAttachment = {
  id: number;
  name: string;
  url: string;
  type?: string;
  size?: number;
};

export type StockTransaction = {
  id: number;
  productId: number;
  productName: string;
  transactionType:
    | "PURCHASE"
    | "SALE"
    | "ADJUSTMENT"
    | "RETURN"
    | "TRANSFER"
    | string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  direction: "IN" | "OUT";
  transactionDate: Date;
  notes: string | null;
  supplierName: string | null;
  createdBy: string | null;
  attachments?: TransactionAttachment[];
  referenceNumber?: string;
  locationId?: number;
  batchNumber?: string;
};

export type StockTransactionHistory = {
  transactions: StockTransaction[];
  totalTransactions: number;
  startDate: Date;
  endDate: Date;
  orgId: string;
};

/**
 * Additional Supporting Types
 */

export type ProductCategory = {
  id: number;
  name: string;
  description?: string;
  parentCategoryId?: number | null;
};

export type Supplier = {
  id: number;
  name: string;
  contactEmail: string;
  phoneNumber: string;
  address?: string;
  leadTimeDays?: number;
  paymentTerms?: string;
};

export type InventoryLocation = {
  id: number;
  name: string;
  description?: string;
  address?: string;
  isPrimary: boolean;
  capacity?: number;
};

export type StockLevelAlert = {
  id: number;
  productId: number;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  status: "LOW" | "CRITICAL" | "OUT_OF_STOCK";
  lastNotificationDate?: Date | null;
};

export type InventoryAdjustment = {
  id: number;
  productId: number;
  quantityChange: number;
  reason: "DAMAGED" | "LOST" | "COUNT_ERROR" | "OTHER";
  notes?: string;
  date: Date;
  createdBy: string;
  approvedBy?: string;
};

/**
 * API Response Types
 */

export type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
  timestamp: Date;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type InventoryOverview = {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentTransactions: StockTransaction[];
  valuationByCategory: {
    category: string;
    value: number;
    percentage: number;
  }[];
};

/**
 * Request Types
 */

export type CreateTransactionRequest = Omit<
  StockTransaction,
  "id" | "totalAmount" | "transactionDate"
> & {
  transactionDate?: Date;
};

export type UpdateInventoryRequest = {
  productId: number;
  quantityChange: number;
  direction: "IN" | "OUT";
  reason?: string;
  notes?: string;
};

export type RestockRequest = {
  productId: number;
  quantity: number;
  supplierId?: number;
  expectedDeliveryDate?: Date;
  unitCost?: number;
  notes?: string;
};
