import { z } from "zod";

// --- Zod Schemas (Aligned with schema.txt) ---

// Schema for individual product variants
export const ProductVariantSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, 'Variant name cannot be empty.'),
  sku: z.string().min(1, 'Variant SKU is required.').optional().nullable(),
  barcode: z.string().optional().nullable(),
  buyingPrice: z.union([z.string(), z.number()]).pipe(z.coerce.number().nonnegative('Buying price must be non-negative.')),
  retailPrice: z.union([z.string(), z.number(), z.null()]).pipe(z.coerce.number().nonnegative('Retail price must be non-negative.').optional().nullable()),
  wholesalePrice: z.union([z.string(), z.number(), z.null()]).pipe(z.coerce.number().nonnegative('Wholesale price must be non-negative.').optional().nullable()),
  attributes: z
    .union([z.string(), z.record(z.string(), z.any()), z.null()])
    .transform((val, ctx) => {
      if (typeof val === 'string') {
        try {
          if (!val) return null;
          return JSON.parse(val);
        } catch (e) {
          console.error('Error parsing attributes JSON:', e);
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid JSON format for attributes.',
          });
          return z.NEVER;
        }
      }
      return val ?? null;
    })
    .pipe(z.any().optional().nullable()),
  isActive: z
    .union([z.boolean(), z.string()])
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true' || val === 'on';
    })
    .default(true),
  reorderPoint: z.union([z.string(), z.number(), z.null()]).pipe(z.coerce.number().int().nonnegative().default(5)),
  reorderQty: z.union([z.string(), z.number(), z.null()]).pipe(z.coerce.number().int().positive().default(10)),
  lowStockAlert: z
    .union([z.boolean(), z.string()])
    .transform(val => val === true || val === 'true' || val === 'on')
    .default(false),
});

// Exporting Type for potential use elsewhere
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;

// Schema for individual product suppliers (ProductSupplier model)
export const ProductSupplierSchema = z.object({
  id: z.string().cuid().optional(), // For edits (ID of the ProductSupplier record) [cite: 47]
  supplierId: z.string().cuid('Invalid Supplier ID format.'), // [cite: 47] ID of the Supplier
  supplierSku: z.string().optional().nullable(), // [cite: 48] Nullable string
  // [cite: 48] Decimal
  costPrice: z.union([
  z.string(), 
  z.number()
])
  .nullable()
  .refine((val) => val !== null, {
    message: 'Cost price cannot be null.',
  })
  .pipe(
    z.coerce.number().nonnegative('Cost price must be non-negative.')
  ),
  // [cite: 49] Int, optional
  minimumOrderQuantity: z
    .union([z.string(), z.number(), z.null()])
    .pipe(z.coerce.number().int().positive('Minimum order quantity must be positive.').optional().nullable()),
  // [cite: 50] String, optional
  packagingUnit: z.string().optional().nullable(),
  // [cite: 51] Boolean, default false
  isPreferred: z
    .union([z.boolean(), z.string()])
    .transform(val => val === true || val === 'true' || val === 'on')
    .default(false),
});
export type ProductSupplierInput = z.infer<typeof ProductSupplierSchema>;

// --- Base Schema for Core Product Fields (Product model) ---
export const BaseProductSchema = z.object({
  name: z.string().min(1, 'Product name is required.'), 
  description: z.string().optional().nullable(), 
  sku: z.string().min(1, 'Product SKU is required.').optional().nullable(), // Will generate if missing on add
  barcode: z.string().optional().nullable(), // Nullable string
  categoryId: z.string().min(3, 'Invalid Category ID.'), 
  // [cite: 31] Decimal
  buyingPrice: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number().positive('Base price must be a positive number.')),
  // [cite: 32] Decimal, optional
  retailPrice: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number().nonnegative('Base cost must be non-negative.').optional().nullable()),
  wholesalePrice: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number().nonnegative('Base cost must be non-negative.').optional().nullable()),
  isActive: z
    .union([z.boolean(), z.string()]) // [cite: 32] Boolean, default true
    .transform(val => val === true || val === 'true' || val === 'on')
    .default(true),
  // [cite: 32] String[]
  imageUrls: z.preprocess(
    val => (Array.isArray(val) ? val : typeof val === 'string' && val ? [val] : []),
    z.array(z.string().url('Invalid image URL.').trim()).optional().default([])
  ),
  // [cite: 33] Json | null
  customFields: z
    .union([z.string(), z.record(z.string(), z.any()), z.null()])
    .transform((val, ctx) => {
      if (typeof val === 'string') {
        try {
          if (!val) return null;
          return JSON.parse(val);
        } catch (e) {
          console.error('Error parsing customFields JSON:', e);
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid JSON format for customFields.',
          });
          return z.NEVER;
        }
      }
      return val ?? null;
    })
    .pipe(z.any().optional().nullable()),
  // Physical dimensions
  width: z.union([z.string(), z.number(), z.null()]).pipe(z.coerce.number().nonnegative().optional().nullable()),
  height: z.union([z.string(), z.number(), z.null()]).pipe(z.coerce.number().nonnegative().optional().nullable()),
  length: z.union([z.string(), z.number(), z.null()]).pipe(z.coerce.number().nonnegative().optional().nullable()),
  dimensionUnit: z.enum(['METER', 'CENTIMETER', 'MILLIMETER', 'INCH', 'FOOT', 'YARD']).optional().nullable(),
  weight: z.union([z.string(), z.number(), z.null()]).pipe(z.coerce.number().nonnegative().optional().nullable()),
  weightUnit: z.enum(['WEIGHT_KG', 'WEIGHT_G', 'WEIGHT_LB', 'WEIGHT_OZ']).optional().nullable(),
  volumetricWeight: z
    .union([z.string(), z.number(), z.null()])
    .pipe(z.coerce.number().nonnegative().optional().nullable()),
  restockUnit: z.string().optional().nullable(),
  itemsPerUnit: z.union([z.string(), z.number(), z.null()]),
  sellingUnit: z.string().optional().nullable(),
  defaultLocationId: z.string().optional().nullable(),
  baseUnitId: z.string().min(1, 'Base unit is required'),
  stockingUnitId: z.string().min(1, 'Stocking unit is required'),
  sellingUnitId: z.string().min(1, 'Selling unit is required'),
});

// --- Schema for Adding a Product ---
export const AddProductSchema = BaseProductSchema.extend({
  // Expect arrays of objects after initial JSON parsing
  variants: z.array(ProductVariantSchema).optional().default([]),
  suppliers: z.array(ProductSupplierSchema).optional().default([]),
});

// --- Schema for Adding a Product (Minimal) ---
export const AddProductMinimalSchema = z.object({
  name: BaseProductSchema.shape.name, // Required: string, min 1
  categoryId: BaseProductSchema.shape.categoryId, // Required: string, CUID format check likely in BaseProductSchema already
  buyingPrice: BaseProductSchema.shape.buyingPrice, // Required: number (positive after coercion)

  // Optional fields that might influence the default variant or are good to have early
  sku: BaseProductSchema.shape.sku.optional().nullable(), // Optional: string, min 1 (will be generated if null/empty)
  barcode: BaseProductSchema.shape.barcode.optional(), // Optional: string | null
  retailPrice: BaseProductSchema.shape.retailPrice.optional(), // Optional: number (non-negative) | null
  wholesalePrice: BaseProductSchema.shape.wholesalePrice.optional(), // Optional: number (non-negative) | null
  imageUrls: BaseProductSchema.shape.imageUrls.optional(), // Optional: string[] (array of URLs)
  reorderPoint: z.coerce.number().int().positive('Reorder point must be positive.').optional(), // Optional: number (non-negative int), default 5 will be handled by Prisma create if not provided here
  isActive: BaseProductSchema.shape.isActive.optional(), // Optional: boolean, default true will be handled by Prisma create if not provided here
  baseUnitId: z.string().min(1, 'Base unit is required'),
  stockingUnitId: z.string().min(1, 'Stocking unit is required'),
  sellingUnitId: z.string().min(1, 'Selling unit is required'),
});

export type AddProductMinimalInput = z.infer<typeof AddProductMinimalSchema>;

// --- Schema for Editing a Product ---
export const EditProductSchema = BaseProductSchema
  .partial()
  .extend({
    id: z.string().cuid('Product ID is required for editing.'),
    // Overwrite partial fields to make them required again for edit
    name: z.string().min(1, 'Product name is required.').optional(),
    categoryId: z.string().min(4,'Invalid Category ID.').optional(),
    // Use the same variant/supplier schemas (which include optional 'id')
    variants: z.array(ProductVariantSchema).optional().default([]),
    suppliers: z.array(ProductSupplierSchema).optional().default([]),
    // Ensure sku is handled correctly if it becomes required for update
    sku: z.string().min(1, "Product SKU is required for editing."),
  });

export type AddProductSchemaType = z.infer<typeof AddProductSchema>;
export type EditProductSchemaType = z.infer<typeof EditProductSchema>;

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