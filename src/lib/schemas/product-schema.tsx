import { z } from "zod"

// Enums
export const MeasurementUnit = z.enum(["m", "cm", "mm", "in", "ft", "yd", "kg", "g", "lb", "oz"] as const)

// Base schema for product variants
export const ProductVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  priceModifier: z.coerce.number().default(0),
  attributes: z.record(z.string()).optional().nullable(),
  isActive: z.boolean().default(true),
  reorderPoint: z.coerce.number().int().nonnegative().default(5),
  reorderQty: z.coerce.number().int().positive().default(10),
  lowStockAlert: z.boolean().default(false),
})

// Base schema for product suppliers
export const ProductSupplierSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string(),
  supplierSku: z.string().optional().nullable(),
  costPrice: z.coerce.number().nonnegative(),
  minimumOrderQuantity: z.coerce.number().int().nonnegative().optional().nullable(),
  packagingUnit: z.string().optional().nullable(),
  isPreferred: z.boolean().default(false),
})

// Schema for adding a new product
export const AddProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  categoryId: z.string(),
  basePrice: z.coerce.number().nonnegative(),
  baseCost: z.coerce.number().nonnegative().optional().nullable(),
  reorderPoint: z.coerce.number().int().nonnegative().default(5),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).default([]),
  customFields: z.record(z.string()).optional().nullable(),
  width: z.coerce.number().nonnegative().optional().nullable(),
  height: z.coerce.number().nonnegative().optional().nullable(),
  length: z.coerce.number().nonnegative().optional().nullable(),
  dimensionUnit: z
    .enum(["m", "cm", "mm", "in", "ft", "yd"] as const)
    .optional()
    .nullable(),
  weight: z.coerce.number().nonnegative().optional().nullable(),
  weightUnit: z
    .enum(["kg", "g", "lb", "oz"] as const)
    .optional()
    .nullable(),
  volumetricWeight: z.coerce.number().nonnegative().optional().nullable(),
  defaultLocationId: z.string().optional().nullable(),
  variants: z.array(ProductVariantSchema).optional(),
  suppliers: z.array(ProductSupplierSchema).optional(),
})

// Schema for editing an existing product
export const EditProductSchema = AddProductSchema.partial()

export type AddProductSchemaType = z.infer<typeof AddProductSchema>
export type ProductVariant = z.infer<typeof ProductVariantSchema>
export type ProductSupplier = z.infer<typeof ProductSupplierSchema>
