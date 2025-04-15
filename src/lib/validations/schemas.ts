// lib/validations/schemas.ts
import { z } from "zod";
import {
  PaymentMethod,
  PaymentStatus, // Not typically validated in POST body, but maybe for filters
  PurchaseStatus, // Not typically validated in POST body, but maybe for filters
  StockAdjustmentReason,
  LoyaltyReason, // Used internally, not usually in request body
  UserRole, // Used internally, not usually in request body
  DrawerStatus, // Used internally, not usually in request body
} from "@prisma/client"; // Import enums from generated client

// --- Supplier Schemas ---

export const SupplierSchema = z.object({
  name: z.string().min(1, { message: "Supplier name is required" }),
  contactName: z.string().optional(),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .optional()
    .or(z.literal("")), // Allow empty string or valid email
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadTime: z.number().int().positive().optional(),
  isActive: z.boolean().optional().default(true), // Include if you allow setting on create/update
});

// For PUT, all fields are optional, but we often reuse the base and make fields optional
// Or use .partial()
export const UpdateSupplierSchema = SupplierSchema.partial();

// --- Customer Schemas ---

export const CustomerSchema = z.object({
  name: z.string().min(1, { message: "Customer name is required" }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  // loyaltyPoints: z.number().int().optional(), // Typically calculated, not set directly
  isActive: z.boolean().optional().default(true),
});

export const UpdateCustomerSchema = CustomerSchema.partial();

// --- Sale Schemas ---

const SaleItemInputSchema = z.object({
  productId: z.string().cuid({ message: "Invalid Product ID" }),
  variantId: z.string().cuid({ message: "Invalid Variant ID" }).optional(),
  quantity: z.number().int().positive({ message: "Quantity must be positive" }),
  unitPriceOverride: z.number().positive().optional(), // Allow setting price manually
  discountAmount: z.number().nonnegative().optional().default(0), // Item-level discount amount
  taxRate: z.number().nonnegative().max(1).optional().default(0), // Tax rate (0 to 1)
});

export const CreateSaleSchema = z.object({
  customerId: z.string().cuid({ message: "Invalid Customer ID" }).optional(),
  userId: z.string().cuid({ message: "Invalid User ID" }), // Should ideally come from session/auth
  items: z
    .array(SaleItemInputSchema)
    .min(1, { message: "Sale must include at least one item" }),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: "Invalid payment method" }),
  }),
  discountAmount: z.number().nonnegative().optional().default(0), // Sale-level discount amount
  notes: z.string().optional(),
  cashDrawerId: z
    .string()
    .cuid({ message: "Invalid Cash Drawer ID" })
    .optional(),
  // paymentStatus: z.nativeEnum(PaymentStatus).optional(), // Usually set server-side
});

// --- Stock Adjustment Schema ---

export const CreateStockAdjustmentSchema = z.object({
  productId: z.string().cuid({ message: "Invalid Product ID" }),
  variantId: z.string().cuid({ message: "Invalid Variant ID" }).optional(),
  stockBatchId: z
    .string()
    .cuid({ message: "Invalid Stock Batch ID" })
    .optional(),
  userId: z.string().cuid({ message: "Invalid User ID" }), // Should come from session/auth
  quantity: z
    .number()
    .int()
    .refine((val) => val !== 0, { message: "Quantity cannot be zero" }), // Must be non-zero int
  reason: z.nativeEnum(StockAdjustmentReason, {
    errorMap: () => ({ message: "Invalid adjustment reason" }),
  }),
  notes: z.string().optional(),
  locationId: z.string().cuid({ message: "Invalid Location ID" }).optional(),
  adjustmentDate: z
    .string()
    .datetime({ message: "Invalid date format" })
    .optional(), // ISO string e.g., .toISOString()
});
