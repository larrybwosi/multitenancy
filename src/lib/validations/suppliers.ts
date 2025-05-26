// --- Zod Schemas (Updated based on Schema & UX) ---

import { z } from 'zod';

const RequiredCuidSchema = z.string({ required_error: 'ID is required.' }).cuid({ message: 'Invalid ID format.' });

// Define base string schema first, then add optional/nullable
const BaseStringSchema = z.string().trim().max(255);
const OptionalStringSchema = BaseStringSchema.optional().nullable();
const OptionalEmailSchema = z.string().email().max(255).optional().nullable();
const OptionalNumberSchema = z.coerce.number().int().positive().optional().nullable();

// Schema for a single product to be associated with a supplier
const ProductSupplierInputSchema = z.object({
  productId: RequiredCuidSchema, // This is the ProductVariant ID [cite: 57, 183]
  costPrice: z.number().positive({ message: 'Cost price must be positive.' }), // [cite: 59]
  supplierSku: BaseStringSchema.max(100).optional().nullable(), // [cite: 58]
  minimumOrderQuantity: OptionalNumberSchema, // [cite: 60]
  packagingUnit: BaseStringSchema.max(50).optional().nullable(), 
  isPreferred: z.boolean().default(false), // [cite: 62]
});

// Updated schema for creating a supplier, now includes products
export const CreateSupplierPayloadSchema = z.object({
  name: BaseStringSchema.min(2, { message: 'Supplier name must be at least 2 characters.' }).max(255, {
    message: 'Supplier name must be less than 255 characters.',
  }),
  contactName: BaseStringSchema.max(100).optional().nullable(), // [cite: 53]
  email: OptionalEmailSchema, // [cite: 53]
  phone: BaseStringSchema.max(30).optional().nullable(), // [cite: 54]
  address: OptionalStringSchema, // [cite: 54]
  paymentTerms: BaseStringSchema.max(100).optional().nullable(), // [cite: 54]
  leadTime: OptionalNumberSchema, // [cite: 55]
  isActive: z.boolean().default(true), // [cite: 55]
  customFields: z.record(z.any()).optional().nullable(), // [cite: 56]
  products: z.array(ProductSupplierInputSchema).optional().nullable(), // <-- Added products
});

// Schema for updating a supplier, including adding/removing products
export const UpdateSupplierPayloadSchema = z.object({
  id: RequiredCuidSchema, // [cite: 57]
  name: BaseStringSchema.min(2, { message: 'Supplier name must be at least 2 characters.' })
    .max(255, { message: 'Supplier name must be less than 255 characters.' })
    .optional(),
  contactName: BaseStringSchema.max(100).optional().nullable(),
  email: OptionalEmailSchema,
  phone: BaseStringSchema.max(30).optional().nullable(),
  address: OptionalStringSchema,
  paymentTerms: BaseStringSchema.max(100).optional().nullable(),
  leadTime: OptionalNumberSchema,
  isActive: z.boolean().optional(),
  customFields: z.record(z.any()).optional().nullable(),
  addProducts: z
    .array(ProductSupplierInputSchema.omit({ isPreferred: true }).extend({ isPreferred: z.boolean().optional() }))
    .optional()
    .nullable(), // <-- Products to add/update (isPreferred is optional)
  removeProductIds: z.array(RequiredCuidSchema).optional().nullable(), // <-- ProductVariant IDs to remove
});


// Schema for deleting a supplier. ID is required.
export const DeleteSupplierPayloadSchema = z.object({
  id: RequiredCuidSchema,
});

// Types derived from schemas
export type CreateSupplierPayload = z.infer<typeof CreateSupplierPayloadSchema>;
export type UpdateSupplierPayload = z.infer<typeof UpdateSupplierPayloadSchema>;
export type DeleteSupplierPayload = z.infer<typeof DeleteSupplierPayloadSchema>;
