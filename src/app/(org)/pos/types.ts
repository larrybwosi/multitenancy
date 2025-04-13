/**
 * Product interface represents a product in the POS system
 */
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  basePrice: string; // Stored as string for decimal precision
  imageUrls: string[];
}

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
  unitPrice: string;
  totalPrice: string;
  variantId?: string | null;
}

/**
 * Props for the PosClientWrapper component
 */
export interface PosClientWrapperProps {
  products: Product[];
  customers: Customer[];
}

/**
 * Props for the Cart component
 */
export interface CartProps {
  cartItems: CartItem[];
  cartTotal: string;
  customers: Customer[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onSubmitSale: (saleData: SaleData) => Promise<SaleResult>;
}

/**
 * Props for the CartItem component
 */
export interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

/**
 * Data structure for submitting a sale
 */
export interface SaleData {
  customerId: string | null;
  paymentMethod: PaymentMethod;
  notes: string;
  items: Array<{
    productId: string;
    variantId: string | null;
    quantity: number;
  }>;
  taxAmount: string;
  totalAmount: string;
  phoneNumber?: string; // For MPESA payments
}

/**
 * Result from submitting a sale
 */
export interface SaleResult {
  success: boolean;
  message: string;
  errors?: string[];
}

/**
 * Enum representing the possible payment methods
 */
export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
  MPESA = 'MPESA',
}

/**
 * Order interface for managing completed orders
 */
export interface Order {
  id: string;
  customerId: string | null;
  items: CartItem[];
  total: string;
  createdAt: Date;
  status: OrderStatus;
}

/**
 * Enum representing the possible statuses of an order
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
} 