// app/pos/mock-data.ts
import { Category, Product, Customer } from "@prisma/client"; // Assuming types are available or define simplified versions

export interface MockProduct
  extends Omit<
    Product,
    | "orgId"
    | "org"
    | "category"
    | "orderItems"
    | "stockTransactions"
    | "inventoryAdjustments"
    | "stock_history"
    | "locationInventory"
    | "variants"
    | "createdAt"
    | "updatedAt"
  > {
  category: { id: number; name: string }; // Simplified nested category
}

export interface MockCategory
  extends Omit<
    Category,
    "orgId" | "org" | "products" | "createdAt" | "updatedAt"
  > {}

export interface MockCustomer
  extends Omit<
    Customer,
    "orgId" | "org" | "orders" | "created_at" | "updated_at"
  > {}

export const mockCategories: MockCategory[] = [
  { id: 1, name: "Beverages", description: "Refreshing drinks" },
  { id: 2, name: "Snacks", description: "Quick bites" },
  { id: 3, name: "Bakery", description: "Freshly baked goods" },
  { id: 4, name: "Electronics", description: "Gadgets and accessories" },
  { id: 5, name: "Apparel", description: "Clothing items" },
];

export const mockProducts: MockProduct[] = [
  // Beverages
  {
    id: 1,
    name: "Mineral Water",
    price: 50,
    stock: 100,
    category_id: 1,
    image_url: "https://via.placeholder.com/150/0000FF/FFFFFF?text=Water",
    description: "500ml Bottle",
    sku: "BW001",
    barcode: "111111",
    purchase_price: 20,
    profit_margin: 60,
    min_stock_level: 10,
    unit: "bottle",
    isActive: true,
    isService: false,
    customFields: null,
    category: { id: 1, name: "Beverages" },
    selling_unit: "bottle",
    selling_unit_quantity: 1,
    taxRate: 8,
    unit_price: 50,
    unit_quantity: 1,
  },
  {
    id: 2,
    name: "Orange Juice",
    price: 120,
    stock: 50,
    category_id: 1,
    image_url: "https://via.placeholder.com/150/FFA500/FFFFFF?text=Juice",
    description: "1L Carton",
    sku: "BJ001",
    barcode: "222222",
    purchase_price: 60,
    profit_margin: 50,
    min_stock_level: 5,
    unit: "carton",
    isActive: true,
    isService: false,
    customFields: null,
    category: { id: 1, name: "Beverages" },
    selling_unit: "carton",
    selling_unit_quantity: 1,
    taxRate: 8,
    unit_price: 120,
    unit_quantity: 1,
  },
  {
    id: 3,
    name: "Espresso",
    price: 150,
    stock: 200,
    category_id: 1,
    image_url: "https://via.placeholder.com/150/A0522D/FFFFFF?text=Espresso",
    description: "Single Shot",
    sku: "BC001",
    barcode: "333333",
    purchase_price: 50,
    profit_margin: 66.67,
    min_stock_level: 20,
    unit: "cup",
    isActive: true,
    isService: true,
    customFields: null,
    category: { id: 1, name: "Beverages" },
    selling_unit: "cup",
    selling_unit_quantity: 1,
    taxRate: 8,
    unit_price: 150,
    unit_quantity: 1,
  },

  // Snacks
  {
    id: 4,
    name: "Potato Chips",
    price: 80,
    stock: 80,
    category_id: 2,
    image_url: "https://via.placeholder.com/150/FFD700/000000?text=Chips",
    description: "Salted Flavor",
    sku: "SN001",
    barcode: "444444",
    purchase_price: 40,
    profit_margin: 50,
    min_stock_level: 15,
    unit: "bag",
    isActive: true,
    isService: false,
    customFields: null,
    category: { id: 2, name: "Snacks" },
    selling_unit: "bag",
    selling_unit_quantity: 1,
    taxRate: 8,
    unit_price: 80,
    unit_quantity: 1,
  },
  {
    id: 5,
    name: "Chocolate Bar",
    price: 100,
    stock: 120,
    category_id: 2,
    image_url: "https://via.placeholder.com/150/8B4513/FFFFFF?text=Chocolate",
    description: "Dark Chocolate",
    sku: "SN002",
    barcode: "555555",
    purchase_price: 50,
    profit_margin: 50,
    min_stock_level: 10,
    unit: "bar",
    isActive: true,
    isService: false,
    customFields: null,
    category: { id: 2, name: "Snacks" },
    selling_unit: "bar",
    selling_unit_quantity: 1,
    taxRate: 8,
    unit_price: 100,
    unit_quantity: 1,
  },

  // Bakery
  {
    id: 6,
    name: "Croissant",
    price: 90,
    stock: 40,
    category_id: 3,
    image_url: "https://via.placeholder.com/150/F5DEB3/000000?text=Croissant",
    description: "Butter Croissant",
    sku: "BK001",
    barcode: "666666",
    purchase_price: 45,
    profit_margin: 50,
    min_stock_level: 5,
    unit: "piece",
    isActive: true,
    isService: false,
    customFields: null,
    category: { id: 3, name: "Bakery" },
    selling_unit: "piece",
    selling_unit_quantity: 1,
    taxRate: 8,
    unit_price: 90,
    unit_quantity: 1,
  },
  {
    id: 7,
    name: "Baguette",
    price: 150,
    stock: 30,
    category_id: 3,
    image_url: "https://via.placeholder.com/150/D2B48C/000000?text=Baguette",
    description: "French Baguette",
    sku: "BK002",
    barcode: "777777",
    purchase_price: 70,
    profit_margin: 53.33,
    min_stock_level: 5,
    unit: "loaf",
    isActive: true,
    isService: false,
    customFields: null,
    category: { id: 3, name: "Bakery" },
    selling_unit: "loaf",
    selling_unit_quantity: 1,
    taxRate: 8,
    unit_price: 150,
    unit_quantity: 1,
  },

  // Electronics
  {
    id: 8,
    name: "USB Cable",
    price: 500,
    stock: 60,
    category_id: 4,
    image_url: "https://via.placeholder.com/150/808080/FFFFFF?text=USB",
    description: "Type-C Cable",
    sku: "EL001",
    barcode: "888888",
    purchase_price: 200,
    profit_margin: 60,
    min_stock_level: 10,
    unit: "piece",
    isActive: true,
    isService: false,
    customFields: null,
    category: { id: 4, name: "Electronics" },
    selling_unit: "piece",
    selling_unit_quantity: 1,
    taxRate: 16,
    unit_price: 500,
    unit_quantity: 1,
  },
  {
    id: 9,
    name: "Wireless Mouse",
    price: 1200,
    stock: 25,
    category_id: 4,
    image_url: "https://via.placeholder.com/150/000000/FFFFFF?text=Mouse",
    description: "Optical Mouse",
    sku: "EL002",
    barcode: "999999",
    purchase_price: 600,
    profit_margin: 50,
    min_stock_level: 5,
    unit: "piece",
    isActive: true,
    isService: false,
    customFields: null,
    category: { id: 4, name: "Electronics" },
    selling_unit: "piece",
    selling_unit_quantity: 1,
    taxRate: 16,
    unit_price: 1200,
    unit_quantity: 1,
  },

  // Apparel
  {
    id: 10,
    name: "T-Shirt",
    price: 1500,
    stock: 75,
    category_id: 5,
    image_url: "https://via.placeholder.com/150/4682B4/FFFFFF?text=T-Shirt",
    description: "Cotton T-Shirt (M)",
    sku: "AP001",
    barcode: "101010",
    purchase_price: 700,
    profit_margin: 53.33,
    min_stock_level: 10,
    unit: "piece",
    isActive: true,
    isService: false,
    customFields: null,
    category: { id: 5, name: "Apparel" },
    selling_unit: "piece",
    selling_unit_quantity: 1,
    taxRate: 16,
    unit_price: 1500,
    unit_quantity: 1,
  },
];

export const mockCustomers: MockCustomer[] = [
  {
    id: 1,
    name: "Walk-in Customer",
    email: null,
    phone: null,
    loyalty_points: 0,
    notes: "Default customer for quick sales.",
    address: null,
    id_number: null,
    image_url: null,
    phone_number: null,
  },
  {
    id: 2,
    name: "Alice Wonder",
    email: "alice@example.com",
    phone: "+254712345678",
    loyalty_points: 150,
    notes: "Prefers digital receipts.",
    address: "123 Main St",
    id_number: "12345678",
    image_url: "https://via.placeholder.com/40/FFA07A/000000?text=AW",
    phone_number: "+254712345678",
  },
  {
    id: 3,
    name: "Bob The Builder",
    email: "bob@example.com",
    phone: "+254787654321",
    loyalty_points: 50,
    notes: "",
    address: "456 Side St",
    id_number: "87654321",
    image_url: "https://via.placeholder.com/40/20B2AA/FFFFFF?text=BB",
    phone_number: "+254787654321",
  },
];

// Define a type for Cart Items (simplified from OrderItem)
export type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  stock: number; // Keep track of available stock
  taxRate: number; // Store tax rate per item if needed, or use global
};
