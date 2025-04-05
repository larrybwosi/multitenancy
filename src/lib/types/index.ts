import type { Organization } from '@prisma/client';
import { Decimal } from "@prisma/client/runtime/library"; 

export enum MemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  STAFF = "STAFF",
  VIEWER = "VIEWER",
}

export enum ProductType {
  PHYSICAL = "PHYSICAL",
  SERVICE = "SERVICE",
}

export enum StockTransactionType {
  PURCHASE = "PURCHASE",
  SALE = "SALE",
  ADJUSTMENT = "ADJUSTMENT",
  RETURN = "RETURN",
  SPOILAGE = "SPOILAGE",
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_OUT = "TRANSFER_OUT",
}

export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  AWAITING_PAYMENT = "AWAITING_PAYMENT",
  PAID = "PAID",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum DeliveryType {
  DELIVERY = "DELIVERY",
  IN_STORE = "IN_STORE",
}

export enum PaymentMethod {
  CASH = "CASH",
  CARD_ONLINE = "CARD_ONLINE",
  CARD_TERMINAL = "CARD_TERMINAL",
  BANK_TRANSFER = "BANK_TRANSFER",
  MOBILE_MONEY = "MOBILE_MONEY",
  VOUCHER = "VOUCHER",
  OTHER = "OTHER",
}

export enum ReportType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  ANNUAL = "ANNUAL",
  CUSTOM = "CUSTOM",
}

export enum ReportStatus {
  PENDING = "PENDING",
  GENERATING = "GENERATING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

// Base Types
export type User = {
  id: string;
  email: string;
  name?: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  memberships?: Member[];
  stockTransactions?: StockTransaction[];
  uploadedAttachments?: Attachment[];
};

export type Organisation = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  members?: Member[];
  categories?: Category[];
  products?: Product[];
  stock?: Stock[];
  stockTransactions?: StockTransaction[];
  customers?: Customer[];
  orders?: Order[];
  suppliers?: Supplier[];
  reports?: Report[];
};

export type Member = {
  id: string;
  userId: string;
  organisationId: string;
  role: MemberRole;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  organisation?: Organisation;
  createdOrders?: Order[];
  reports?: Report[];
};

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  organisationId: string;
  createdAt: Date;
  updatedAt: Date;
  organisation?: Organisation;
  products?: Product[];
};

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  type: ProductType;
  unit: string;
  currentSellingPrice: number;
  categoryId?: string | null;
  organisationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organisation?: Organisation;
  category?: Category | null;
  stockEntries?: Stock[];
  orderItems?: OrderItem[];
  stockTransactions?: StockTransaction[];
};

export type Stock = {
  id: string;
  productId: string;
  organisationId: string;
  quantityAvailable: number;
  unit: string;
  buyingPricePerUnit: number;
  batchNumber?: string | null;
  purchaseDate?: Date | null;
  expiryDate?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  supplierId?: string | null;
  product?: Product;
  organisation?: Organisation;
  stockTransactions?: StockTransaction[];
  supplier?: Supplier | null;
};

export type StockTransaction = {
  id: string;
  productId: string;
  stockId?: string | null;
  organisationId: string;
  type: StockTransactionType;
  quantityChange: number;
  reason?: string | null;
  relatedOrderId?: string | null;
  createdById?: string | null;
  transactionDate: Date;
  createdAt: Date;
  product?: Product;
  stock?: Stock | null;
  organisation?: Organisation;
  relatedOrder?: Order | null;
  createdBy?: User | null;
};

export type Supplier = {
  id: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  organisationId: string;
  createdAt: Date;
  updatedAt: Date;
  organisation?: Organisation;
  stockEntries?: Stock[];
};

export type Customer = {
  id: string;
  customerId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  totalLoyaltyPoints: number;
  organisationId: string;
  createdAt: Date;
  updatedAt: Date;
  organisation?: Organisation;
  orders?: Order[];
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  organisationId: string;
  createdById: string;
  status: OrderStatus;
  totalAmount: number;
  discountAmount?: number | null;
  finalAmount: number;
  loyaltyPointsEarned: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  organisation?: Organisation;
  createdBy?: Member;
  items?: OrderItem[];
  delivery?: Delivery | null;
  attachments?: Attachment[];
  stockTransactions?: StockTransaction[];
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPriceAtSale: number;
  totalPrice: number;
  loyaltyPointsAwarded: number;
  createdAt: Date;
  updatedAt: Date;
  order?: Order;
  product?: Product;
};

export type Delivery = {
  id: string;
  orderId: string;
  type: DeliveryType;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  status?: string | null;
  trackingNumber?: string | null;
  estimatedDeliveryDate?: Date | null;
  actualDeliveryDate?: Date | null;
  deliveryCost?: number | null;
  notes?: string | null;
  paymentMethod?: PaymentMethod | null;
  paymentReference?: string | null;
  paymentDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  order?: Order;
};

export type Attachment = {
  id: string;
  orderId?: string | null;
  fileName: string;
  storagePath: string;
  url?: string | null;
  mimeType: string;
  sizeBytes?: number | null;
  uploadedById: string;
  description?: string | null;
  createdAt: Date;
  attachmentUrl?: string | null;
  order?: Order | null;
  uploadedBy?: User;
};

export type Report = {
  id: string;
  organisationId: string;
  type: ReportType;
  status: ReportStatus;
  startDate: Date;
  endDate: Date;
  generatedAt?: Date | null;
  reportUrl?: string | null;
  errorMessage?: string | null;
  requestedById: string;
  createdAt: Date;
  organisation?: Organisation;
  requestedBy?: Member;
};

// Extended Types with full relationships
export type OrderWithRelations = Order & {
  customer: Customer;
  organisation: Organisation;
  createdBy: Member;
  items: OrderItem[];
  delivery?: Delivery | null;
  attachments: Attachment[];
  stockTransactions: StockTransaction[];
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type OrderItemWithProduct = OrderItem & {
  product: Product;
};

export type OrderWithItemsAndProducts = Order & {
  items: OrderItemWithProduct[];
};

export type OrderWithItemsAndDelivery = OrderWithItems & {
  delivery?: Delivery | null;
};

export type OrganisationWithMembers = Organisation & {
  members: Member[];
};

export type OrganisationWithProducts = Organisation & {
  products: Product[];
};

export type OrganisationWithCategories = Organisation & {
  categories: Category[];
};

export type ProductWithStock = Product & {
  stockEntries: Stock[];
};

export type ProductWithCategory = Product & {
  category?: Category | null;
};

export type ProductWithStockAndCategory = Product & {
  stockEntries: Stock[];
  category?: Category | null;
};

export type StockWithSupplier = Stock & {
  supplier?: Supplier | null;
};

export type StockWithProduct = Stock & {
  product: Product;
};

export type StockWithProductAndSupplier = Stock & {
  product: Product;
  supplier?: Supplier | null;
};

export type StockTransactionWithRelations = StockTransaction & {
  product: Product;
  stock?: Stock | null;
  organisation: Organisation;
  relatedOrder?: Order | null;
  createdBy?: User | null;
};

export type CustomerWithOrders = Customer & {
  orders: Order[];
};

export type MemberWithUser = Member & {
  user: User;
};

export type ReportWithOrganisation = Report & {
  organisation: Organisation;
  requestedBy: Member;
};

// Request and Response Types
export type CreateOrderRequest = {
  customerId: string;
  organisationId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  deliveryInfo?: {
    type: DeliveryType;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    estimatedDeliveryDate?: Date;
    deliveryCost?: number;
    notes?: string;
  };
  discountAmount?: number;
  notes?: string;
};

export type UpdateOrderStatusRequest = {
  status: OrderStatus;
  paymentInfo?: {
    method: PaymentMethod;
    reference?: string;
    date: Date;
  };
};

export type StockSummary = {
  productId: string;
  productName: string;
  totalQuantity: number;
  unit: string;
  averageBuyingPrice: number;
  currentSellingPrice: number;
  lowStockAlert: boolean;
};

export type SalesReport = {
  period: {
    start: Date;
    end: Date;
  };
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }[];
  salesByStatus: Record<OrderStatus, number>;
};

export type ProductInventoryReport = {
  productId: string;
  productName: string;
  sku?: string;
  currentStock: number;
  stockValue: number;
  reorderPoint?: number;
  transactions: {
    date: Date;
    type: StockTransactionType;
    quantity: number;
    balance: number;
  }[];
};

// Input type for creating an organization
export type CreateOrganizationInput = Pick<
  Organization,
  'name' | 'description' | 'logo' // Add other fields user can provide directly
>;

// Input type for updating an organization
export type UpdateOrganizationInput = Partial<
  Pick<Organization, 'name' | 'description' | 'logo'> // Add other updatable fields
>;

// Interface for stock entries needed for calculation
export interface StockEntryForStats extends Pick<Stock, 'buyingPricePerUnit' | 'quantityAvailable' | 'purchaseDate'> {
    // Ensure correct types are expected
    buyingPricePerUnit: number;
    quantityAvailable: number;
    purchaseDate: Date | null;
}


// Combine Supplier with calculated stats
export interface SupplierWithStats extends Supplier {
  totalSpent: Decimal; // Using Decimal for precision
  lastOrderDate: Date | null;
  // We add the raw stockEntries data if needed elsewhere, or just use it for calculation
  // stockEntries?: StockEntryForStats[];
}

// Input type for creating a supplier (if needed for actions)
export type CreateSupplierInput = Omit<Supplier, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'stockEntries'>;

// Input type for updating a supplier (if needed for actions)
export type UpdateSupplierInput = Partial<CreateSupplierInput>;

// Example Session structure (adjust based on your actual auth setup)
export interface AppSession {
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
    activeOrganizationId?: string | null; // Crucial for context
    // Add other user properties you need from the session
  };
  expires: string; // Or Date
}