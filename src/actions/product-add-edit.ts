'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { MeasurementUnit, Prisma, Product } from '@/prisma/client';
import { z } from 'zod';
import crypto from 'crypto';
import { getServerAuthContext } from './auth';
import {
  AddProductSchema,
  // EditProductSchema,
  // ProductSupplierInput,
  AddProductMinimalSchema,
  // ProductSupplierSchema,
  // ProductVariantSchema,
} from '@/lib/validations/product';
import { v4 as uuidv4 } from 'uuid';
// --- Helper Functions ---

// Parses JSON array from FormData, validates structure with Zod schema
function parseJsonArrayField<T extends z.ZodTypeAny>(
  formData: FormData,
  fieldName: string,
  schema: T
): z.infer<T>[] | { success: false; error: string; fieldErrors: Record<string, string> } {
  const jsonString = formData.get(fieldName) as string | null;
  if (!jsonString || jsonString === '[]' || jsonString.trim() === '') {
    return [];
  }
  try {
    const parsed = JSON.parse(jsonString);
    const validationResult = schema.array().safeParse(parsed);
    if (!validationResult.success) {
      console.error(`Zod validation failed for ${fieldName} structure:`, validationResult.error.flatten());
      const errors = validationResult.error.flatten();
      const fieldErrors = {
        [fieldName]: `Invalid ${fieldName} data. ${Object.entries(errors.fieldErrors)
          .map(([key, msgs]) => `${key}: ${msgs?.join(', ')}`)
          .join('; ')}`,
      };
      return {
        success: false,
        error: `Validation failed for ${fieldName} structure.`,
        fieldErrors: fieldErrors,
      };
    }
    return validationResult.data;
  } catch (e) {
    console.error(`Error parsing JSON for ${fieldName}:`, e);
    return {
      success: false,
      error: `Invalid JSON format for ${fieldName}.`,
      fieldErrors: { [fieldName]: 'Invalid JSON format.' },
    };
  }
}

// Reusable Prisma Error Handler
const handlePrismaError = (error: unknown): { success: false; error: string; fieldErrors?: Record<string, string> } => {
  console.error('Prisma Error:', error);
  let errorMessage = 'An unexpected error occurred. Please contact support if the problem persists.';
  let fieldErrors: Record<string, string> | undefined = undefined;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    errorMessage = `Database error occurred (Code: ${error.code}). Please try again.`;
    if (error.code === 'P2002') {
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      const fields = target ? target.join(', ') : 'field';
      // Try to map common unique fields from schema
      let userFriendlyField = fields;
      if (fields.includes('sku'))
        userFriendlyField = 'SKU'; // [cite: 30, 40]
      else if (fields.includes('barcode'))
        userFriendlyField = 'Barcode'; // [cite: 31, 40]
      else if (fields.includes('organizationId') && fields.includes('name') && fields.includes('Supplier'))
        userFriendlyField = 'Supplier Name'; // [cite: 42] Supplier name unique per org
      else if (fields.includes('productId') && fields.includes('supplierId') && fields.includes('ProductSupplier'))
        userFriendlyField = 'Product/Supplier combination'; // [cite: 47] ProductSupplier unique constraint
      else if (fields.includes('productId') && fields.includes('sku') && fields.includes('ProductVariant'))
        userFriendlyField = 'Variant SKU for this Product'; // ProductVariant unique constraint

      if (target?.includes('sku')) userFriendlyField = 'SKU';
      if (target?.includes('Product_organizationId_name_key'))
        userFriendlyField = 'Product Name (must be unique within the organization)';
      if (target?.includes('ProductVariant_productId_sku_key')) userFriendlyField = 'Variant SKU (must be unique for this product)';
      if (target?.includes('ProductVariant_productId_barcode_key'))
        userFriendlyField = 'Variant Barcode (must be unique for this product)';


      errorMessage = `This ${userFriendlyField} already exists. Please use a unique value.`;
      const simpleField = target ? target.find(f => !f.toLowerCase().includes('id')) || target[0] : 'general';
      fieldErrors = { [simpleField]: `This ${userFriendlyField} is already taken.` };
    } else if (error.code === 'P2003') {
      // Foreign key constraint failed
      const fieldName = (error.meta?.field_name as string) || 'related field';
      const simpleField = fieldName.replace(/(_fkey|_id)/i, '');
      errorMessage = `Cannot save, the selected ${simpleField} does not exist or is invalid.`;
      fieldErrors = { [simpleField + 'Id']: `This ${simpleField} does not exist.` }; // e.g., { categoryId: '...' }
    } else if (error.code === 'P2025') {
      // Record not found (often on update/delete)
      errorMessage = 'The record you are trying to modify could not be found. It might have been deleted.';
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    errorMessage = 'Invalid data format provided to the database. Please check your input.';
  } else if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
  }

  return {
    success: false,
    error: errorMessage,
    fieldErrors: fieldErrors,
  };
};

// --- addProduct Function (Refactored and Aligned) ---
export async function addProduct(
  formData: FormData
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ success: boolean; data?: any; error?: string; fieldErrors?: any }> {
  let organizationId: string;
  try {
    const context = await getServerAuthContext();
    organizationId = context.organizationId;
    if (!organizationId) throw new Error('Organization context not found.');
    console.log(`addProduct initiated for Organization: ${organizationId}`);
  } catch (authError: unknown) {
    console.error('Authentication context retrieval failed:', authError);
    return { success: false, error: 'Failed to retrieve user authentication context.' };
  }

  const rawData = Object.fromEntries(formData.entries());
  console.log('Raw form data received:', rawData);

  // 1. Parse Variants and Suppliers JSON strings and validate structure
  const parsedVariantsResult = parseJsonArrayField(formData, 'variants', ProductVariantSchema);

  if ('success' in parsedVariantsResult && !parsedVariantsResult.success) return parsedVariantsResult;
  const parsedVariants = parsedVariantsResult; // Type assertion after check
  console.log('Parsed & Structurally Validated Variants:', parsedVariants);

  const parsedSuppliersResult = parseJsonArrayField(formData, 'suppliers', ProductSupplierSchema);
  if ('success' in parsedSuppliersResult && !parsedSuppliersResult.success) return parsedSuppliersResult;
  const parsedSuppliers = parsedSuppliersResult; // Type assertion after check
  console.log('Parsed & Structurally Validated Suppliers:', parsedSuppliers);

  // 2. Prepare data structure for final Zod validation
  const dataToValidate = {
    ...rawData,
    // @ts-expect-error trim() not available on FormData
    sku: rawData.sku ? rawData.sku.trim() : `PROD-${crypto.randomUUID().toLocaleUpperCase().slice(0, 6)}`,
    variants: parsedVariants,
    suppliers: parsedSuppliers,
    imageUrls: formData.getAll('imageUrls').filter(url => typeof url === 'string' && url.trim()),
    // Let Zod handle coercions/defaults for other fields
  };
  console.log('Data prepared for final validation:', dataToValidate);

  // 3. Validate the entire structure using AddProductSchema
  const validatedFields = AddProductSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    console.error('Overall Validation Errors:', fieldErrors);
    // Map Zod errors if specific keys are known
    const errorMap = fieldErrors as Record<string, string[]>;
    const flatFieldErrors: Record<string, string> = {};
    for (const key in errorMap) {
      flatFieldErrors[key] = errorMap[key].join('; ');
    }
    return {
      success: false,
      error: 'Validation failed. Please check the product details, variants, and suppliers.',
      fieldErrors: flatFieldErrors,
    };
  }

  // 4. Extract validated data
  const {
    categoryId, // string
    defaultLocationId,
    buyingPrice,
    retailPrice,
    wholesalePrice,
    width,
    height,
    length,
    weight,
    baseUnitId,
    sellingUnitId,
    stockingUnitId,
    volumetricWeight,
    variants: validatedVariants, // ProductVariantInput[]
    suppliers: validatedSuppliers, // ProductSupplierInput[]
    customFields: validatedCustomFields, // JSON object or null
    ...productData // name, description, isActive, sku, barcode, imageUrls
  } = validatedFields.data;

  // --- Default Variant Logic ---
  let finalVariants = validatedVariants;
  if (!finalVariants || finalVariants.length === 0) {
    console.log('No variants provided, creating a default variant.');

    finalVariants = [
      {
        name: `Default-${productData.name}`,
        sku: null, // Signal generation
        barcode: productData.barcode || null,
        buyingPrice: buyingPrice || 0,
        retailPrice: retailPrice ? retailPrice : null,
        wholesalePrice: wholesalePrice ? wholesalePrice : null,
        attributes: Prisma.JsonNull,
        isActive: productData.isActive,
        reorderPoint: 5,
        reorderQty: 10,
        lowStockAlert: false,
      },
    ];
  }

  // --- Generate SKUs if needed ---
  const productSku = productData.sku || `PROD-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const variantsWithSku = finalVariants.map(v => ({
    ...v,
    sku: v.sku || `${productSku}-VAR-${crypto.randomUUID().slice(0, 4).toUpperCase()}`, // Generate variant SKU if missing
  }));

  // 5. Database Create Operation
  try {
    console.log('Attempting to create product in database...');
    const newProduct = await prisma.product.create({
      data: {
        // Core Product Data
        name: productData.name,
        description: productData.description,
        sku: productSku, // Use generated or provided
        barcode: productData.barcode,
        isActive: productData.isActive, // [cite: 32] Boolean
        imageUrls: productData.imageUrls ?? [], // [cite: 32] String[]
        customFields: validatedCustomFields ?? Prisma.JsonNull, // [cite: 33] Json | JsonNull
        width: width, // [cite: 34] Float | null
        height: height, // [cite: 35] Float | null
        length: length, // [cite: 34] Float | null
        dimensionUnit: MeasurementUnit.METER, // [cite: 36] MeasurementUnit | null
        weight: weight, // [cite: 37] Float | null
        weightUnit: MeasurementUnit.WEIGHT_KG, // [cite: 37] MeasurementUnit | null
        volumetricWeight: volumetricWeight, // [cite: 38] Float | null

        // Relations
        organization: { connect: { id: organizationId } }, // [cite: 39]
        category: { connect: { id: categoryId } }, // [cite: 31]
        defaultLocation: defaultLocationId ? { connect: { id: defaultLocationId } } : undefined, // [cite: 38]

        // --- Variants Creation --- [cite: 38]
        variants: {
          create: variantsWithSku.map(v => ({
            name: v.name, // String
            sku: v.sku, // String (now guaranteed)
            barcode: v.barcode, // String | null
            buyingPrice: new Prisma.Decimal(v.buyingPrice || 0), // Decimal
            retailPrice: v.retailPrice ? new Prisma.Decimal(v.retailPrice) : null, // Decimal
            wholesalePrice: v.wholesalePrice ? new Prisma.Decimal(v.wholesalePrice) : null, // Decimal
            baseUnitId,
            sellingUnitId,
            stockingUnitId,
            attributes: v.attributes ?? Prisma.JsonNull, // Json | JsonNull
            isActive: v.isActive, // Boolean
            reorderPoint: v.reorderPoint || 10, // Int | null
            reorderQty: v.reorderQty || 10, // Int | null
            lowStockAlert: v.lowStockAlert, // Boolean
            suppliers: validatedSuppliers && validatedSuppliers.length > 0
              ? {
                  create: validatedSuppliers.map(s => ({
                    supplier: { connect: { id: s.supplierId } },
                    supplierSku: s.supplierSku,
                    costPrice: new Prisma.Decimal(s.costPrice),
                    minimumOrderQuantity: s.minimumOrderQuantity,
                    packagingUnit: s.packagingUnit,
                    isPreferred: s.isPreferred,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: {
        // Include relations in the response
        variants: {
          include: {
            suppliers: {
              include: {
                supplier: true,
              },
            },
          },
        },
        category: true,
        defaultLocation: true,
      },
    });

    console.log('New product created successfully with Fields:', newProduct);

    // 6. Revalidate Cache
    revalidatePath('/dashboard/inventory/products');
    revalidatePath(`/dashboard/inventory/products/${newProduct.id}`);

    return { success: true, data: newProduct };
  } catch (error) {
    // 7. Handle Prisma Errors
    return handlePrismaError(error);
  }
}

// --- addProductMinimal Function ---
export async function addProductMinimal(
  rawData: unknown
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ success: boolean; data?: any; error?: string; fieldErrors?: any }> {
  let organizationId: string;
  try {
    const context = await getServerAuthContext();
    organizationId = context.organizationId;
    if (!organizationId) throw new Error('Organization context not found.');
    console.log(`addProductMinimal initiated for Organization: ${organizationId}`);
  } catch (authError: unknown) {
    console.error('Authentication context retrieval failed:', authError);
    return { success: false, error: 'Failed to retrieve user authentication context.' };
  }

  // 2. Validate the extracted data using the minimal schema
  const validatedFields = AddProductMinimalSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    console.error('Minimal Validation Errors:', fieldErrors);
    const flatFieldErrors: Record<string, string> = {};
    for (const key in fieldErrors) {
      // @ts-expect-error fieldErrors structure might vary slightly
      flatFieldErrors[key] = fieldErrors[key]?.join('; ');
    }
    return {
      success: false,
      error: 'Validation failed. Please check the required product details.',
      fieldErrors: flatFieldErrors,
    };
  }

  // 3. Extract validated minimal data
  const { name, categoryId, buyingPrice, barcode, reorderPoint, isActive, retailPrice, wholesalePrice, imageUrls } =
    validatedFields.data;

  // 4. Prepare Product and Default Variant Data
  const finalIsActive = isActive ?? true; // Use schema default if validation didn't set one
  const finalReorderPoint = reorderPoint ?? 5; // Use schema default if validation didn't set one
  const productSku = `PROD-${uuidv4().slice(3, 9).toUpperCase()}`;
  const defaultVariantSku = `VAR-${productSku}-DEFAULT`;

  // 5. Database Create Operation
  try {
    console.log('Attempting to create minimal product in database...');
    const newProduct = await prisma.product.create({
      data: {
        // Core Product Data (Minimal Set + Defaults)
        organizationId,
        categoryId,
        name: name,
        description: null, // Explicitly set optional fields to null/default
        sku: productSku,
        barcode: barcode,
        isActive: finalIsActive,
        imageUrls: imageUrls || [],
        width: null,
        height: null,
        length: null,
        dimensionUnit: MeasurementUnit.METER,
        weight: null,
        weightUnit: MeasurementUnit.WEIGHT_KG,
        volumetricWeight: null,
        defaultLocationId: null, // No default location provided

        // Default Variant Creation
        variants: {
          create: [
            {
              name: `Default-${name}`, // Use product name for default variant name
              sku: defaultVariantSku, // Generate a default SKU
              barcode: barcode, // Inherit product barcode if provided
              attributes: Prisma.JsonNull, // Default attributes
              isActive: finalIsActive, // Inherit product active status
              reorderPoint: finalReorderPoint, // Inherit product reorder point
              reorderQty: 10, // Default reorder quantity (from original ProductVariantSchema default)
              lowStockAlert: false, // Default low stock alert (from original ProductVariantSchema default)
              buyingPrice: new Prisma.Decimal(buyingPrice),
              retailPrice,
              wholesalePrice,
              baseUnitId: validatedFields.data.baseUnitId,
              sellingUnitId: validatedFields.data.sellingUnitId,
              stockingUnitId: validatedFields.data.stockingUnitId,
            },
          ],
        },

        // Suppliers - None provided in minimal version
        // suppliers: undefined, // Prisma handles this if omitted
      },
      include: {
        // Include relations in the response
        variants: true,
        category: true,
        organization: true, // Include org for completeness
      },
    });

    console.log('Minimal product created successfully:', newProduct);

    // 6. Revalidate Cache
    revalidatePath('/dashboard/inventory/products');
    // Optional: Revalidate the specific product path if you have detailed view pages
    // revalidatePath(`/dashboard/inventory/products/${newProduct.id}`);

    return { success: true, data: newProduct };
  } catch (error) {
    // 7. Handle Prisma Errors (Ensure handlePrismaError is accessible)
    return handlePrismaError(error);
  }
}

// --- editProduct Function (Refactored and Aligned) ---


// Schema for ProductVariant
export const ProductVariantSchema = z.object({
  id: z.string().optional(), // Optional for new variants
  name: z.string().min(1, 'Variant name is required.'),
  sku: z.string().optional(), // Will be auto-generated if new and not provided
  barcode: z.string().nullable().optional(),
  attributes: z.record(z.any()).nullable().optional(), // Prisma.JsonNull or JSON object
  isActive: z.boolean().optional().default(true),
  reorderPoint: z.number().int().min(0).optional().default(5),
  reorderQty: z.number().int().min(0).optional().default(10),
  lowStockAlert: z.boolean().optional().default(false),
  buyingPrice: z.number().min(0, 'Buying price must be non-negative.'),
  wholesalePrice: z.number().min(0).nullable().optional(),
  retailPrice: z.number().min(0).nullable().optional(),
  // Assuming these are IDs for existing UnitOfMeasure records
  baseUnitId: z.string({ required_error: 'Base unit is required.' }),
  stockingUnitId: z.string({ required_error: 'Stocking unit is required.' }),
  sellingUnitId: z.string({ required_error: 'Selling unit is required.' }),
});

// Input type for ProductSupplier (useful for type safety)
export type ProductSupplierInput = {
  id?: string; // ID of the ProductSupplier record, if it exists
  supplierId: string;
  supplierSku?: string | null;
  costPrice: number; // Make sure this is a number
  minimumOrderQuantity?: number | null;
  packagingUnit?: string | null;
  isPreferred?: boolean | null;
};

// Schema for ProductSupplier
export const ProductSupplierSchema = z.object({
  id: z.string().optional(), // ID of the ProductSupplier link, not the supplier itself
  supplierId: z.string().min(1, "Supplier ID is required for each supplier entry."),
  supplierSku: z.string().nullable().optional(),
  costPrice: z.number().min(0, "Cost price must be a non-negative number."),
  minimumOrderQuantity: z.number().int().min(0).nullable().optional(),
  packagingUnit: z.string().nullable().optional(),
  isPreferred: z.boolean().optional().default(false),
});

// Schema for editing a Product (EditProductSchema)
export const EditProductSchema = z.object({
  productId: z.string().min(1, 'Product ID is required.'), // Changed from 'id' to 'productId' to match formData
  name: z.string().min(1, 'Product name is required.'),
  description: z.string().nullable().optional(),
  sku: z.string().min(1, 'Product SKU is required.'),
  barcode: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  imageUrls: z.array(z.string().url('Image URL must be a valid URL.')).optional().default([]),
  categoryId: z.string().min(1,'Category is required.'),
  defaultLocationId: z.string().nullable().optional(),
  width: z.number().min(0).nullable().optional(),
  height: z.number().min(0).nullable().optional(),
  length: z.number().min(0).nullable().optional(),
  // dimensionUnit: MeasurementUnitSchema.optional(), // Or keep it fixed in the backend
  weight: z.number().min(0).nullable().optional(),
  // weightUnit: MeasurementUnitSchema.optional(), // Or keep it fixed in the backend
  volumetricWeight: z.number().min(0).nullable().optional(),
  customFields: z.record(z.any()).nullable().optional(), // Prisma.JsonNull or JSON object
  variants: z.array(ProductVariantSchema).optional().default([]),
  suppliers: z.array(ProductSupplierSchema).optional().default([]),
  // These fields were present in the destructuring but not in the Prisma update data.
  // Assuming they are not part of the Product model directly or are handled differently.
  // If they are part of the Product model, they should be added to the Prisma update.
  // buyingPrice: z.number().min(0).nullable().optional(), // This seems to be variant-specific
  // retailPrice: z.number().min(0).nullable().optional(), // This seems to be variant-specific
});


export async function editProduct(
  formData: FormData
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ success: boolean; data?: any; error?: string; fieldErrors?: any }> {
  let organizationId: string;
  try {
    const context = await getServerAuthContext();
    organizationId = context.organizationId;
    if (!organizationId) throw new Error('Organization context not found.');
    console.log(`editProduct initiated for Organization: ${organizationId}`);
  } catch (authError: unknown) {
    console.error('Authentication context retrieval failed:', authError);
    return { success: false, error: 'Failed to retrieve user authentication context.' };
  }

  const rawData = Object.fromEntries(formData.entries());
  console.log('Raw form data received for edit:', rawData);

  // 1. Parse Variants and Suppliers JSON strings
  const parsedVariantsResult = parseJsonArrayField(formData, 'variants', ProductVariantSchema);
  if (parsedVariantsResult && 'success' in parsedVariantsResult && !parsedVariantsResult.success)
    return parsedVariantsResult;
  const parsedVariants = parsedVariantsResult as any[]; // Cast to any[] for now, Zod will validate structure
  console.log('Parsed Variants for Edit:', parsedVariants);

  const parsedSuppliersResult = parseJsonArrayField(formData, 'suppliers', ProductSupplierSchema);
  if (parsedSuppliersResult && 'success' in parsedSuppliersResult && !parsedSuppliersResult.success)
    return parsedSuppliersResult;
  const parsedSuppliers = parsedSuppliersResult as ProductSupplierInput[];
  console.log('Parsed Suppliers for Edit:', parsedSuppliers);

  // 2. Prepare data for Zod validation
  const dataToValidate = {
    ...rawData,
    productId: formData.get('productId'), // Ensure productId is present and matches schema
    variants: parsedVariants,
    suppliers: parsedSuppliers,
    imageUrls: formData.getAll('imageUrls').filter(url => typeof url === 'string' && url.trim()),
    // Convert numeric fields from string to number if they are coming from FormData
    width: formData.get('width') ? Number(formData.get('width')) : undefined,
    height: formData.get('height') ? Number(formData.get('height')) : undefined,
    length: formData.get('length') ? Number(formData.get('length')) : undefined,
    weight: formData.get('weight') ? Number(formData.get('weight')) : undefined,
    volumetricWeight: formData.get('volumetricWeight') ? Number(formData.get('volumetricWeight')) : undefined,
    isActive:
      formData.get('isActive') === 'true' || formData.get('isActive') === 'on' || formData.get('isActive') === '1',
    customFields: formData.get('customFields') ? JSON.parse(formData.get('customFields') as string) : undefined,
  };
  console.log('Data prepared for edit validation:', dataToValidate);

  // 3. Validate using EditProductSchema
  const validatedFields = EditProductSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    console.error('Edit Validation Errors:', fieldErrors);
    const errorMap = fieldErrors as Record<string, string[]>;
    const flatFieldErrors: Record<string, string> = {};
    for (const key in errorMap) {
      flatFieldErrors[key] = errorMap[key].join('; ');
    }
    return {
      success: false,
      error: 'Validation failed. Please check the product details, variants, and suppliers.',
      fieldErrors: flatFieldErrors,
    };
  }

  // 4. Extract validated data
  const {
    productId, // string
    categoryId,
    defaultLocationId,
    width,
    height,
    length, // number | null | undefined
    weight,
    volumetricWeight,
    variants: validatedVariants, // ProductVariantInput[] from schema
    suppliers: validatedSuppliers, // ProductSupplierInput[] from schema
    customFields: validatedCustomFields, // JSON object | null | undefined
    ...productData // name, description, isActive, sku, barcode, imageUrls
  } = validatedFields.data;

  const productSkuForVariantGeneration = productData.sku;

  // Ensure SKUs exist for upsert logic (variants need SKU for unique constraint)
  const variantsForUpsert = validatedVariants.map(v => ({
    ...v,
    sku:
      v.sku ||
      (!v.id // Only generate if it's a new variant (no ID) AND SKU is missing
        ? `${productSkuForVariantGeneration || 'PROD'}-VAR-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
        : undefined), // If ID exists and SKU is missing, it's an error or should be handled by DB schema if SKU is nullable
    attributes: v.attributes ?? Prisma.JsonNull, // Ensure attributes are Prisma.JsonNull if null/undefined [cite: 47]
  }));

  const variantIdsFromInput = variantsForUpsert.map(v => v.id).filter(Boolean) as string[];
  const supplierLinkIdsFromInput = validatedSuppliers.map(s => s.id).filter(Boolean) as string[];

  // 5. Database Update Operation
  try {
    console.log(`Attempting to update product ID: ${productId}`);

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
        organizationId: organizationId,
      },
      data: {
        name: productData.name,
        description: productData.description,
        sku: productData.sku,
        barcode: productData.barcode,
        isActive: productData.isActive,
        imageUrls: productData.imageUrls,
        // customFields: validatedCustomFields ?? Prisma.JsonNull, // [cite: 35, 56, 137, 151, 163, 170]
        width: width, // [cite: 42]
        height: height, // [cite: 43]
        length: length, // [cite: 43]
        dimensionUnit: length || width || height ? MeasurementUnit.METER : undefined, // Set if dimensions provided [cite: 44]
        weight: weight, // [cite: 45]
        weightUnit: weight ? MeasurementUnit.WEIGHT_KG : undefined, // Set if weight provided [cite: 45]
        volumetricWeight: volumetricWeight,

        category: categoryId ? { connect: { id: categoryId } } : undefined, // [cite: 38, 39]
        defaultLocation:
          defaultLocationId === null || defaultLocationId === '' // Handle empty string as disconnect
            ? { disconnect: true }
            : defaultLocationId
              ? { connect: { id: defaultLocationId } } // [cite: 46]
              : undefined,

        variants: {
          deleteMany: {
            productId: productId,
            id: { notIn: variantIdsFromInput },
          },
          upsert: variantsForUpsert.map(v => {
            const createData = {
              // organization: { connect: { id: organizationId } }, // Not needed, Prisma infers from Product's organization
              name: v.name, // [cite: 47]
              sku: v.sku!, // Required, generated if missing for new variants [cite: 47]
              barcode: v.barcode, // [cite: 48]
              attributes: v.attributes ?? Prisma.JsonNull, // [cite: 47]
              isActive: v.isActive ?? true,
              reorderPoint: v.reorderPoint ?? 5,
              reorderQty: v.reorderQty ?? 10,
              lowStockAlert: v.lowStockAlert ?? false,
              buyingPrice: new Prisma.Decimal(v.buyingPrice),
              wholesalePrice:
                v.wholesalePrice !== null && v.wholesalePrice !== undefined
                  ? new Prisma.Decimal(v.wholesalePrice)
                  : undefined, // [cite: 49]
              retailPrice:
                v.retailPrice !== null && v.retailPrice !== undefined
                  ? new Prisma.Decimal(v.retailPrice)
                  : undefined, // [cite: 49]
              baseUnit: { connect: { id: v.baseUnitId } }, // [cite: 50]
              stockingUnit: { connect: { id: v.stockingUnitId } }, // [cite: 51]
              sellingUnit: { connect: { id: v.sellingUnitId } }, // [cite: 52]
            };
            const updateData = {
              name: v.name,
              sku: v.sku, // Update SKU only if provided
              barcode: v.barcode,
              attributes: v.attributes, // Send null or JSON object
              isActive: v.isActive,
              reorderPoint: v.reorderPoint,
              reorderQty: v.reorderQty,
              lowStockAlert: v.lowStockAlert,
              buyingPrice: v.buyingPrice !== undefined ? new Prisma.Decimal(v.buyingPrice) : undefined,
              wholesalePrice:
                v.wholesalePrice !== null && v.wholesalePrice !== undefined
                  ? new Prisma.Decimal(v.wholesalePrice)
                  : undefined,
              retailPrice:
                v.retailPrice !== null && v.retailPrice !== undefined
                  ? new Prisma.Decimal(v.retailPrice)
                  : undefined,
              baseUnit: v.baseUnitId ? { connect: { id: v.baseUnitId } } : undefined,
              stockingUnit: v.stockingUnitId ? { connect: { id: v.stockingUnitId } } : undefined,
              sellingUnit: v.sellingUnitId ? { connect: { id: v.sellingUnitId } } : undefined,
            };
            return {
              where: { id: v.id || crypto.randomUUID() },
              create: createData,
              update: updateData,
            };
          }),
        },

        suppliers: {
          // This manages the ProductSupplier join table records
          deleteMany: {
            productId: productId,
            id: { notIn: supplierLinkIdsFromInput }, // These are IDs of ProductSupplier records
          },
          upsert: validatedSuppliers.map(s => {
            const createData = {
              // product is connected implicitly by Prisma as this is a nested write on Product
              supplier: { connect: { id: s.supplierId } }, // [cite: 53, 54, 55]
              supplierSku: s.supplierSku, // [cite: 58, 59]
              costPrice: new Prisma.Decimal(s.costPrice),
              minimumOrderQuantity: s.minimumOrderQuantity, // [cite: 60]
              packagingUnit: s.packagingUnit, // [cite: 61]
              isPreferred: s.isPreferred ?? false, // [cite: 62]
            };
            const updateData = {
              supplierSku: s.supplierSku,
              costPrice: s.costPrice !== undefined ? new Prisma.Decimal(s.costPrice) : undefined,
              minimumOrderQuantity: s.minimumOrderQuantity,
              packagingUnit: s.packagingUnit,
              isPreferred: s.isPreferred,
              // supplier: s.supplierId ? { connect: { id: s.supplierId } } : undefined, // Not needed if supplierId doesn't change for an existing link
            };
            return {
              // 'where' needs a unique identifier for ProductSupplier.
              // If 'id' is the ProductSupplier record's ID, this is correct.
              // If creating, use a non-matching UUID to ensure create is triggered.
              // The unique constraint for ProductSupplier is @@unique([productId, supplierId])
              // So, for upserting on ProductSupplier, a compound unique key for 'where' is more robust if 's.id' is not always present or might be new.
              // However, your current `where: { id: s.id || crypto.randomUUID() }` targets the ProductSupplier's own 'id' field.
              where: { id: s.id || crypto.randomUUID() }, // This assumes s.id is the ID of the ProductSupplier record.
              // For new ProductSupplier records, s.id will be undefined, triggering create.
              create: createData,
              update: updateData,
            };
          }),
        },
      },
      include: {
        variants: {
          include: {
            baseUnit: true,
            stockingUnit: true,
            sellingUnit: true,
          },
        },
        category: true,
        defaultLocation: true,
        // suppliers: {
        //   include: {
        //     supplier: true, // Include the actual supplier details
        //   },
        // },
      },
    });

    console.log(`Product ID: ${productId} updated successfully.`);

    revalidatePath('/dashboard/inventory/products');
    revalidatePath(`/dashboard/inventory/products/${productId}`);

    return { success: true, data: updatedProduct };
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Deletes a product and its associated variants for the current organization.
 * Ensures the user belongs to the organization owning the product.
 * Relies on the `onDelete: Cascade` setting in the Prisma schema for ProductVariant.product relation.
 *
 * @param productId - The ID of the product to delete.
 * @returns The deleted product data.
 * @throws Error if the user is not authenticated or doesn't belong to an organization.
 * @throws Error if the product is not found or doesn't belong to the user's organization (Prisma P2025).
 * @throws Error on other database or Prisma errors.
 */

export async function deleteProduct(productId: string): Promise<Product> {
  // 1. Get the organization ID from the user's session
  const { organizationId } = await getServerAuthContext();

  if (!organizationId) {
    throw new Error('Authentication required: User organization not found.');
  }

  // 2. Attempt to delete the product
  try {
    const deletedProduct = await prisma.product.delete({
      where: {
        // Specify the unique identifier for the product
        id: productId,
        // IMPORTANT: Ensure the product belongs to the user's organization
        // This prevents users from deleting products outside their org scope.
        organizationId: organizationId,
      },
    });

    revalidatePath("/products");
    return deletedProduct;
  } catch (error) {
    // 3. Handle potential errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Check for the specific error code when the record to delete is not found.
      // See Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
      if (error.code === 'P2025') {
        // Throw a more user-friendly error
        throw new Error(`Product with ID '${productId}' not found or you do not have permission to delete it.`);
      }
      // You might want to handle other specific Prisma errors here, e.g., P2003 for foreign key constraint failures
      // if cascade delete wasn't set up correctly or if other relations prevent deletion.
    }
    // Re-throw unexpected errors
    console.error('Failed to delete product:', error); // Log the original error for debugging
    throw new Error('An unexpected error occurred while deleting the product.');
  }
}