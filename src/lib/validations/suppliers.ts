// --- Zod Schemas (Updated: Removed organizationId) ---

import { z } from "zod";

const RequiredCuidSchema = z
  .string()
  .cuid({ message: "Required ID is missing or invalid" });

// Schema for data payload when creating (orgId comes from context)
export const CreateSupplierPayloadSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Supplier name is required (min 2 chars)" }),
  contactName: z.string().max(100).optional().nullable(), // Updated field name from contactPerson
  email: z
    .string()
    .email({ message: "Invalid email format" })
    .optional()
    .nullable(),
  phone: z.string().max(30).optional().nullable(), // Increased length slightly
  address: z.string().max(255).optional().nullable(),
  paymentTerms: z.string().max(100).optional().nullable(), // Added based on schema
  leadTime: z.coerce.number().int().min(0).optional().nullable(), // Added based on schema
  isActive: z.boolean().default(true), // Added based on schema
});

// Schema for data payload when updating (orgId from context, id required)
export const UpdateSupplierPayloadSchema = z.object({
  id: RequiredCuidSchema, // ID of the supplier to update
  name: z.string().min(2).optional(),
  contactName: z.string().max(100).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  paymentTerms: z.string().max(100).optional().nullable(),
  leadTime: z.coerce.number().int().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

// Schema for identifying supplier to delete (orgId from context)
export const DeleteSupplierPayloadSchema = z.object({
  id: RequiredCuidSchema, // ID of the supplier to delete
});


//Types
export type CreateSupplierPayload = z.infer<typeof CreateSupplierPayloadSchema>;
export type UpdateSupplierPayload = z.infer<typeof UpdateSupplierPayloadSchema>;
export type DeleteSupplierPayload = z.infer<typeof DeleteSupplierPayloadSchema>;