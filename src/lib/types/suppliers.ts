import { Supplier } from "@prisma/client";

// --- Types ---
export type ActionResponse<T = null> = Promise<
  | { success: true; data: T }
  | { success: false; error: string; details?: any; errorCode?: string }
>;
export interface SupplierStockHistoryItem {
  // Purchase Info
  purchaseId: string;
  purchaseItemId: string;
  purchaseNumber: string | null;
  purchaseDate: Date;

  // Product Info
  productId: string | null; // Nullable if variant/product somehow missing
  variantId: string | null; // Nullable if variant somehow missing
  productName: string;
  productSku: string | null; // Nullable if variant missing
  productCategory: string;

  // Item/Batch Specifics
  stockId: string | null; // Ambiguous: Remains null as PurchaseItem doesn't map directly to a single Stock ID
  batchNumber: string | null;
  expiryDate: Date | null;
  isExpired: boolean | null;
  daysUntilExpiry: number | null;

  // Quantities & Costs
  quantityPurchased: number; // orderedQuantity from PurchaseItem
  quantityReceived: number | null; // receivedQuantity from PurchaseItem
  quantityRemaining: number | null; // currentQuantity from the primary StockBatch
  buyingPricePerUnit: number; // unitCost from PurchaseItem
  totalBuyingPrice: number; // totalCost from PurchaseItem

  // Metadata
  unit: string | null; // No standard field in schema for general unit
  notes: string | null; // From parent Purchase
  attachmentUrl: string | null; // Requires separate Attachment query

  // Transaction Info
  transactionId: string; // Using Purchase ID
  transactionDate: Date;
  transactionType: 'PURCHASE';

  // Supplier Info
  supplierName: string;
  supplierId: string;
}

export interface SupplierStockHistorySummary {
  totalProducts: number; // Unique products/variants on this page
  totalQuantityPurchased: number; // Total units ordered on this page
  totalValuePurchased: number; // Total value ordered on this page
  averagePricePerUnit: number; // Avg price on this page
  // Stock/Expiry related fields calculated *for this page only*
  upcomingExpiryCount: number; // Count items expiring soon on this page
  expiredCount: number; // Count expired items on this page
  zeroStockCount: number; // Count items with zero remaining stock in their batch on this page
  totalActiveStock: number; // Total quantity remaining in batches on this page (non-expired)
  highestValueProduct: { productId: string | null; productName: string; totalValue: number } | null;
  mostPurchasedProduct: { productId: string | null; productName: string; totalQuantity: number } | null;
  byCategory: { category: string; totalQuantity: number; totalValue: number; percentage: number }[];
}

export type SupplierInfo = {
  id: string;
  name: string;
  contactPerson: string | null;
  totalSpent: number | null; // Requires aggregating all purchases, not just page
  lastOrderDate: Date | null; // Most recent order date on this page
} & Supplier

export interface SupplierStockHistoryResponse {
  items: SupplierStockHistoryItem[];
  // Pagination
  totalItems: number; // Total number of *Purchases* for the supplier
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  // Summary (Calculated based on current page's items)
  summary: SupplierStockHistorySummary;
  // Supplier Info
  supplierInfo: SupplierInfo;
}
