// --- Types ---
export type ActionResponse<T = null> = Promise<
  | { success: true; data: T }
  | { success: false; error: string; details?: any; errorCode?: string }
>;
export interface SupplierStockHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  productId?: string;
  batchNumber?: string;
  minQuantity?: number;
  maxQuantity?: number;
  includeZeroStock?: boolean;
  includeExpired?: boolean;
  sortBy?:
    | "purchaseDate"
    | "expiryDate"
    | "productName"
    | "quantityRemaining"
    | "daysUntilExpiry";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  productCategory?: string;
}

export interface SupplierStockHistoryItem {
  stockId: string;
  productId: string;
  productName: string;
  productSku: string | null;
  productCategory: string | null;
  batchNumber: string | null;
  purchaseDate: Date | null;
  expiryDate: Date | null;
  quantityPurchased: number;
  quantityRemaining: number;
  buyingPricePerUnit: number;
  totalBuyingPrice: number;
  unit: string;
  attachmentUrl: string | null;
  notes: string | null;
  transactionId: string | null;
  transactionDate: Date | null;
  transactionType: "PURCHASE" | "RETURN" | "ADJUSTMENT" | null;
  supplierName: string;
  supplierId: string;
  isExpired: boolean;
  daysUntilExpiry: number | null;
}

export interface SupplierStockHistorySummary {
  totalProducts: number;
  totalQuantityPurchased: number;
  totalValuePurchased: number;
  averagePricePerUnit: number;
  upcomingExpiryCount: number;
  expiredCount: number;
  zeroStockCount: number;
  totalActiveStock: number;
  highestValueProduct: {
    productId: string;
    productName: string;
    totalValue: number;
  }| null;
  mostPurchasedProduct?: {
    productId: string;
    productName: string;
    totalQuantity: number;
  } | null;
  byCategory?: Array<{
    category: string;
    totalQuantity: number;
    totalValue: number;
    percentage: number;
  }>;
}

export interface SupplierStockHistoryResponse {
  items: SupplierStockHistoryItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  summary: SupplierStockHistorySummary;
  supplierInfo?: {
    id: string;
    name: string;
    contactPerson: string | null;
    totalSpent: number;
    lastOrderDate: Date | null;
  };
  mostPurchasedProduct?: {
    productId: string;
    productName: string;
    totalQuantity: number;
  } | null;
  highestValueProduct?: {
    productId: string;
    productName: string;
    totalValue: number;
  } | null;
}
