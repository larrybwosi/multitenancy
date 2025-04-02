import { Prisma } from "@prisma/client";

// Base Prisma types from generated client
export type User = Prisma.UserGetPayload<{}>;
export type Organization = Prisma.OrganizationGetPayload<{}>;
export type Order = Prisma.OrderGetPayload<{}>;
export type OrderItem = Prisma.OrderItemGetPayload<{}>;
export type Product = Prisma.ProductGetPayload<{}>;
export type Category = Prisma.CategoryGetPayload<{}>;
export type Customer = Prisma.CustomerGetPayload<{}>;
export type Supplier = Prisma.SupplierGetPayload<{}>;
export type Location = Prisma.LocationGetPayload<{}>;
export type StockTransaction = Prisma.StockTransactionGetPayload<{}>;
export type ProductVariant = Prisma.ProductVariantGetPayload<{}>;
export type Reservation = Prisma.ReservationGetPayload<{}>;
export type InventoryByLocation = Prisma.InventoryByLocationGetPayload<{}>;

// Enums
export enum OrderStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  MPESA = "mpesa",
  BANK_TRANSFER = "bank_transfer",
}

export enum TransactionType {
  SALE = "sale",
  PURCHASE = "purchase",
  RETURN = "return",
  ADJUSTMENT = "adjustment",
}

export enum ReportType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  ANNUAL = "ANNUAL",
  CUSTOM = "CUSTOM",
}

export enum BusinessType {
  RETAIL = "RETAIL",
  RESTAURANT = "RESTAURANT",
  PHARMACY = "PHARMACY",
  GROCERY = "GROCERY",
  ELECTRONICS = "ELECTRONICS",
  FASHION = "FASHION",
  SERVICE = "SERVICE",
  WHOLESALE = "WHOLESALE",
  CUSTOM = "CUSTOM",
}

export enum ModuleAccess {
  INVENTORY = "INVENTORY",
  POS = "POS",
  REPORTING = "REPORTING",
  CUSTOMERS = "CUSTOMERS",
  SUPPLIER_MANAGEMENT = "SUPPLIER_MANAGEMENT",
  EMPLOYEE_MANAGEMENT = "EMPLOYEE_MANAGEMENT",
  ACCOUNTING = "ACCOUNTING",
  LOYALTY = "LOYALTY",
  AI_ASSISTANT = "AI_ASSISTANT",
  BOOKING = "BOOKING",
  RENTAL = "RENTAL",
  CUSTOM = "CUSTOM",
}

export enum StockTransactionType {
  PURCHASE = "PURCHASE",
  SALE = "SALE",
  RETURN = "RETURN",
  ADJUSTMENT = "ADJUSTMENT",
  TRANSFER = "TRANSFER",
  DAMAGED = "DAMAGED",
}

export enum AdjustmentReason {
  DAMAGED = "DAMAGED",
  EXPIRED = "EXPIRED",
  LOST = "LOST",
  FOUND = "FOUND",
  CORRECTION = "CORRECTION",
  OTHER = "OTHER",
}

// Extended types with relations

export type ProductWithCategory = Product & {
  category: Category;
};

export type ProductWithInventory = Product & {
  locationInventory: InventoryByLocation[];
  variants?: ProductVariant[];
};

export type ProductFull = Product & {
  category: Category;
  stockTransactions: StockTransaction[];
  locationInventory: InventoryByLocation[];
  variants: ProductVariant[];
};

export type OrderItemWithProduct = OrderItem & {
  product: Product;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type OrderWithItemsAndProducts = Order & {
  items: OrderItemWithProduct[];
};

export type OrderWithCustomer = Order & {
  customer: Customer | null;
};

export type OrderWithReservation = Order & {
  reservation: Reservation | null;
};

export type OrderFull = Order & {
  items: OrderItemWithProduct[];
  customer: Customer | null;
  user: User | null;
  createdBy: User | null;
  reservation: Reservation | null;
  location: Location | null;
};

export type OrganizationWithMembers = Organization & {
  members: Member[];
};

export type OrganizationWithLocations = Organization & {
  locations: Location[];
};

export type OrganizationWithCategories = Organization & {
  categories: Category[];
};

export type OrganizationWithProducts = Organization & {
  products: ProductWithCategory[];
};

export type OrganizationFull = Organization & {
  members: Member[];
  locations: Location[];
  categories: Category[];
  products: ProductWithCategory[];
  customers: Customer[];
  suppliers: Supplier[];
};

export type LocationWithInventory = Location & {
  inventory: (InventoryByLocation & {
    product: Product;
  })[];
};

export type SupplierWithTransactions = Supplier & {
  transactions: StockTransaction[];
};

export type CustomerWithOrders = Customer & {
  orders: Order[];
};

export type UserWithOrders = User & {
  orders: Order[];
  createdOrders: Order[];
};

export type UserWithMemberships = User & {
  members: Member[];
};

export type Member = Prisma.MemberGetPayload<{}>;

export type MemberWithOrganization = Member & {
  organization: Organization;
  user: User;
};

// Request/Response types for API endpoints

export type CreateOrderRequest = {
  customerId?: number;
  locationId?: number;
  deliveryAddress?: string;
  deliveryMethod?: string;
  deliveryNotes?: string;
  deliveryFee?: number;
  priority?: string;
  subtotal: number;
  discount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  status?: OrderStatus;
  notes?: string;
  taxRate?: number;
  tax: number;
  items: {
    productId: number;
    quantity: number;
    price: number;
  }[];
  tableNumber?: string;
  guestCount?: number;
  reservation?: {
    reservationDate: Date;
    reservationTime: string;
    duration?: number;
    specialRequests?: string;
  };
};

export type UpdateProductRequest = {
  name?: string;
  sku?: string;
  barcode?: string;
  stock?: number;
  description?: string;
  image_url?: string;
  price?: number;
  purchase_price?: number;
  profit_margin?: number;
  min_stock_level?: number;
  category_id?: number;
  unit?: string;
  unit_quantity?: number;
  unit_price?: number;
  selling_unit?: string;
  selling_unit_quantity?: number;
  taxRate?: number;
  isActive?: boolean;
  isService?: boolean;
  customFields?: Record<string, any>;
};

export type DashboardStats = {
  totalSales: number;
  salesCount: number;
  topProducts: {
    id: number;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  recentOrders: OrderWithItems[];
  lowStockProducts: ProductWithCategory[];
  dailySales: {
    date: string;
    sales: number;
    orders: number;
  }[];
};

export type SalesReportData = {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByProduct: {
    productId: number;
    productName: string;
    quantity: number;
    revenue: number;
  }[];
  salesByCategory: {
    categoryId: number;
    categoryName: string;
    quantity: number;
    revenue: number;
  }[];
  salesByPaymentMethod: {
    method: string;
    count: number;
    amount: number;
  }[];
  salesByDay?: {
    date: string;
    sales: number;
    orders: number;
  }[];
  salesByMonth?: {
    month: string;
    sales: number;
    orders: number;
  }[];
};

export type InventoryReportData = {
  totalProducts: number;
  totalStockValue: number;
  lowStockProducts: ProductWithCategory[];
  outOfStockProducts: ProductWithCategory[];
  stockMovement: {
    productId: number;
    productName: string;
    startingStock: number;
    purchases: number;
    sales: number;
    adjustments: number;
    endingStock: number;
  }[];
  productPerformance: {
    productId: number;
    productName: string;
    stock: number;
    stockValue: number;
    turnoverRate: number;
  }[];
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type FilterParams = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: OrderStatus;
  categoryId?: number;
  locationId?: number;
  paymentMethod?: PaymentMethod;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// Context types for auth and state management
export type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
};

export type OrganizationContextType = {
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  locations: Location[];
  categories: Category[];
  activeLocation: Location | null;
  setActiveLocation: (location: Location) => void;
  refreshOrganization: () => Promise<void>;
};

// Utility types
export type JsonObject = {
  [key: string]: any;
};

export type DateRange = {
  startDate: Date;
  endDate: Date;
};

export type SelectOption = {
  value: string | number;
  label: string;
};
