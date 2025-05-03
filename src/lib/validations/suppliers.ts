// --- Zod Schemas (Updated based on Schema & UX) ---

import { z } from 'zod';

const RequiredCuidSchema = z.string({ required_error: 'ID is required.' }).cuid({ message: 'Invalid ID format.' });

// Define base string schema first, then add optional/nullable
const BaseStringSchema = z.string().trim().max(255);
const OptionalStringSchema = BaseStringSchema.optional().nullable();
const OptionalEmailSchema = z.string().email().max(255).optional().nullable();
const OptionalNumberSchema = z.coerce.number().int().positive().optional().nullable();

// Schema for creating a supplier. Only 'name' is strictly required for UX.
// organizationId will be added from server context.
export const CreateSupplierPayloadSchema = z.object({
  name: BaseStringSchema.min(2, { message: 'Supplier name must be at least 2 characters.' }).max(255, {
    message: 'Supplier name must be less than 255 characters.',
  }),
  contactName: BaseStringSchema.max(100).optional().nullable(), // Schema: String?
  email: OptionalEmailSchema, // Schema: String?
  phone: BaseStringSchema.max(30).optional().nullable(), // Schema: String?
  address: OptionalStringSchema, // Schema: String?
  paymentTerms: BaseStringSchema.max(100).optional().nullable(), // Schema: String?
  leadTime: OptionalNumberSchema, // Schema: Int?
  isActive: z.boolean().default(true), // Schema: Boolean @default(true)
  customFields: z.record(z.any()).optional().nullable(), // Schema: Json?
});

// Schema for updating a supplier. ID is required. All other fields are optional.
export const UpdateSupplierPayloadSchema = z.object({
  id: RequiredCuidSchema,
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
});

// Schema for deleting a supplier. ID is required.
export const DeleteSupplierPayloadSchema = z.object({
  id: RequiredCuidSchema,
});

// Types derived from schemas
export type CreateSupplierPayload = z.infer<typeof CreateSupplierPayloadSchema>;
export type UpdateSupplierPayload = z.infer<typeof UpdateSupplierPayloadSchema>;
export type DeleteSupplierPayload = z.infer<typeof DeleteSupplierPayloadSchema>;
