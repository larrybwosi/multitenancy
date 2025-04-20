import { z } from "zod";

export const VariantAttributeSchema = z.object({
  name: z.string().min(1, "Attribute name required"),
  value: z.string().min(1, "Attribute value required"),
});

export const VariantSchema = z.object({
  id: z.string().cuid().optional(), // Optional for creation
  name: z.string().min(1),
  barcode: z.string().optional().nullable(),
  attributes: z.record(z.any()).optional(), // Basic JSON validation
  isActive: z.boolean().default(true),
  reorderPoint: z.coerce.number().int().positive().default(5),
  reorderQty: z.coerce.number().int().positive().default(10),
  lowStockAlert: z.boolean().default(false),
});

export const ProductSupplierSchema = z.object({
  supplierId: z.string().min(1),
  costPrice: z.coerce.number().positive(),
  minimumOrderQuantity: z.coerce.number().int().positive().optional(),
  packagingUnit: z.string().optional(),
  isPreferred: z.boolean().default(false),
});

// Product Schema for Creation with new fields
export const ProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().min(1),
  basePrice: z.coerce.number(), // Coerce from string/number
  reorderPoint: z.coerce.number().int().positive().default(5),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).optional(),
  variants: z.array(VariantSchema).optional().default([]),

  // New physical dimension fields
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  length: z.coerce.number().positive().optional(),
  dimensionUnit: z.string().optional(),
  weight: z.coerce.number().positive().optional(),
  weightUnit: z.string().optional(),
  volumetricWeight: z.coerce.number().positive().optional(),

  // Default location
  defaultLocationId: z.string(),

  // Suppliers
  suppliers: z.array(ProductSupplierSchema).optional().default([]),
});

// Define the actual type based on your Zod schema if needed elsewhere
export type ProductVariantInput = z.infer<typeof VariantSchema>;
export type ProductSupplierInput = z.infer<typeof ProductSupplierSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;

// Schema for editing includes the Product ID
export const EditProductSchema = ProductSchema.extend({
  id: z.string().cuid(),
});

export const RestockSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional().nullable(),
  // Add supplierId - make it required
  supplierId: z.string().cuid({ message: "Please select a supplier." }),
  initialQuantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a number" })
    .int()
    .positive("Quantity must be positive"),
  purchasePrice: z.coerce
    .number({ invalid_type_error: "Price must be a number" })
    .min(0, "Purchase price must be non-negative"),
  expiryDate: z.coerce.date().optional().nullable(),
  // Ensure location is treated as a required CUID if that's your ID format
  location: z.string().cuid({ message: "Please select a storage location." }),
  purchaseItemId: z.string().cuid().optional().nullable(), // Optional: link to a PO item
});

export type RestockSchemaType = z.infer<typeof RestockSchema>;

// Example - adjust based on your actual Prisma schema
export type ProductWithRelations = {
  id: string;
  name: string;
  // other fields...
};

export type Supplier = {
  id: string;
  name: string;
  // Add other relevant supplier fields if needed
};