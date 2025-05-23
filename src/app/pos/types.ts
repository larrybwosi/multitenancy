/**
 * Customer interface represents a customer in the POS system
 */
export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

/**
 * Cart item interface for managing items in the shopping cart
 */
export interface CartItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: string | number;
  variantId?: string | null;
  imageUrls?: string[] | null;
}

/**
 * Sale data interface for submitting a sale
 */
export interface SaleData {
  customerId: string | null;
  paymentMethod: string;
  notes: string;
}

/**
 * Sale result interface for receipt data
 */
export interface SaleResult {
  id: string;
  saleNumber: string;
  customerId: string | null;
  memberId: string;
  saleDate: Date;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  locationId: string;
  notes: string;
  cashDrawerId: string | null;
  receiptUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  items: SaleResultItem[];
  customer: Customer | null;
  member: {
    id: string;
    user: {
      name: string;
    };
  };
  organization: {
    id: string;
    name: string;
    logo: string;
  };
}

/**
 * Sale result item interface
 */
export interface SaleResultItem {
  id: string;
  saleId: string;
  productId: string;
  variantId: string;
  stockBatchId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  product?: {
    name: string;
    sku: string;
  };
  variant: {
    name: string;
    product?: {
      name: string;
      sku: string;
    };
  };
}
