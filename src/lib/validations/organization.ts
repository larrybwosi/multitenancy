import { z } from 'zod';
import { InventoryPolicy, MeasurementUnit } from '@/prisma/client';


// Enum definitions based on your schema
const InventoryPolicyEnum = z.enum([InventoryPolicy.FIFO, InventoryPolicy.LIFO, InventoryPolicy.FEFO]);
const MeasurementUnitEnum = z.enum([
    MeasurementUnit.CUBIC_METER,
    MeasurementUnit.CUBIC_FEET,
    MeasurementUnit.SQUARE_METER,
    MeasurementUnit.SQUARE_FEET,
    MeasurementUnit.METER,
    MeasurementUnit.FEET,
    MeasurementUnit.COUNT,
    MeasurementUnit.WEIGHT_KG,
    MeasurementUnit.WEIGHT_LB,
]);

export const CreateOrganizationInputSchema = z.object({
  name: z.string().min(1, "Organization name is required."),
  slug: z.string().min(2, "Slug must be at least 2 characters.")
    .max(30, "Slug must not exceed 30 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  description: z.string().max(500, "Description must not exceed 500 characters.").optional().nullable(),
  logo: z.string().url("Invalid logo URL.").optional().nullable(),
  
  // Expense Settings
  expenseApprovalRequired: z.boolean().default(false),
  expenseApprovalThreshold: z.number().min(0, "Threshold must be a positive number.").optional().nullable(),
  expenseReceiptRequired: z.boolean().default(true),
  expenseReceiptThreshold: z.number().min(0, "Threshold must be a positive number.").optional().nullable(),
  expenseTagOptions: z.array(z.string()).default([]),
  
  // General Settings
  defaultCurrency: z.string().min(3).max(3).optional().default("USD"),
  defaultTimezone: z.string().optional().default("UTC"),
  defaultTaxRate: z.number().min(0).max(1, "Tax rate must be between 0 and 1.").optional().nullable(),
  
  // Inventory Settings
  inventoryPolicy: InventoryPolicyEnum.optional().default(InventoryPolicy.FEFO),
  lowStockThreshold: z.number().int().min(0, "Threshold must be a non-negative integer.").optional().default(10),
  negativeStock: z.boolean().optional().default(false),
  
  // Spatial Settings
  enableCapacityTracking: z.boolean().optional().default(false),
  enforceSpatialConstraints: z.boolean().optional().default(false),
  enableProductDimensions: z.boolean().optional().default(false),
  defaultMeasurementUnit: MeasurementUnitEnum.optional().nullable().default(MeasurementUnit.METER),
  defaultDimensionUnit: MeasurementUnitEnum.optional().nullable().default(MeasurementUnit.METER),
  defaultWeightUnit: MeasurementUnitEnum.optional().nullable().default(MeasurementUnit.WEIGHT_KG),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationInputSchema>;

export const UpdateOrganizationInputSchema = z.object({
  // Organization fields
  name: z.string().min(1, 'Organization name cannot be empty.').optional(),
  slug: z.string().min(2, "Slug must be at least 2 characters.")
    .max(30, "Slug must not exceed 30 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens.")
    .optional(),
  description: z.string().max(500, "Description must not exceed 500 characters.").optional().nullable(),
  logo: z.string().url('Invalid logo URL.').optional().nullable(),

  // Expense Settings
  expenseApprovalRequired: z.boolean().optional(),
  expenseApprovalThreshold: z.number().min(0, "Threshold must be a positive number.").optional().nullable(),
  expenseReceiptRequired: z.boolean().optional(),
  expenseReceiptThreshold: z.number().min(0, "Threshold must be a positive number.").optional().nullable(),
  expenseTagOptions: z.array(z.string()).optional(),

  // OrganizationSettings fields
  defaultCurrency: z.string().min(3).max(3).optional(),
  defaultTimezone: z.string().optional(),
  defaultTaxRate: z.number().min(0).max(1, "Tax rate must be between 0 and 1.").optional().nullable(),
  inventoryPolicy: InventoryPolicyEnum.optional(),
  lowStockThreshold: z.number().int().min(0, "Threshold must be a non-negative integer.").optional(),
  negativeStock: z.boolean().optional(),
  enableCapacityTracking: z.boolean().optional(),
  enforceSpatialConstraints: z.boolean().optional(),
  enableProductDimensions: z.boolean().optional(),
  defaultMeasurementUnit: MeasurementUnitEnum.optional().nullable(),
  defaultDimensionUnit: MeasurementUnitEnum.optional().nullable(),
  defaultWeightUnit: MeasurementUnitEnum.optional().nullable(),
});

export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationInputSchema>;
