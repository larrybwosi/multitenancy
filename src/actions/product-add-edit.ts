'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { MeasurementUnit, Prisma, Product } from '../../prisma/src/generated/prisma/client';
import { z } from 'zod';
import crypto from 'crypto';
import { getServerAuthContext } from './auth';
import {
  AddProductSchema,
  EditProductSchema,
  ProductSupplierInput,
  AddProductMinimalSchema,
  ProductSupplierSchema,
  ProductVariantSchema,
} from '@/lib/validations/product';

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
        userFriendlyField = 'Variant SKU for this Product'; // [cite: 40] ProductVariant unique constraint

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
    defaultLocationId, // string | null | undefined
    buyingPrice,
    retailPrice,
    wholesalePrice,
    width,
    height,
    length, // number | null | undefined
    weight,
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
        priceModifier: 0,
        attributes: Prisma.JsonNull,
        isActive: productData.isActive,
        reorderPoint: reorderPoint, // Inherit from product (which has default 5)
        reorderQty: 10, // Default from schema [cite: 40]
        lowStockAlert: false, // Default from schema [cite: 40]
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
        length: length, // [cite: 34] Float | null (corrected typo length->depth if applicable, schema says length)
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
            organization: { connect: { id: organizationId } }, // [cite: 40] Ensure org connection
            name: v.name, // [cite: 40] String
            sku: v.sku, // [cite: 40] String (now guaranteed)
            barcode: v.barcode, // [cite: 40] String | null
            priceModifier: new Prisma.Decimal(v.priceModifier), // [cite: 40] Decimal
            attributes: v.attributes ?? Prisma.JsonNull, // [cite: 40] Json | JsonNull
            isActive: v.isActive, // [cite: 40] Boolean
            reorderPoint: v.reorderPoint || 10, // [cite: 40] Int | null
            reorderQty: v.reorderQty || 10, // [cite: 40] Int | null
            lowStockAlert: v.lowStockAlert, // [cite: 40] Boolean
            buyingPrice: new Prisma.Decimal(buyingPrice), // [cite: 40] Decimal (assumed same as product base price)
          })),
        },

        // --- Suppliers Creation (ProductSupplier model) --- [cite: 38]
        suppliers:
          validatedSuppliers && validatedSuppliers.length > 0
            ? {
                create: validatedSuppliers.map(s => ({
                  supplier: { connect: { id: s.supplierId } }, // [cite: 47] Connect to Supplier
                  supplierSku: s.supplierSku, // [cite: 48] String | null
                  costPrice: new Prisma.Decimal(s.costPrice), // [cite: 48] Decimal
                  minimumOrderQuantity: s.minimumOrderQuantity, // [cite: 49] Int | null
                  packagingUnit: s.packagingUnit, // [cite: 50] String | null
                  isPreferred: s.isPreferred, // [cite: 51] Boolean
                  // productId is implicitly connected by Prisma
                })),
              }
            : undefined,
      },
      include: {
        // Include relations in the response
        variants: true,
        suppliers: { include: { supplier: true } }, // Include supplier details [cite: 47]
        category: true, // [cite: 31]
        defaultLocation: true, // [cite: 38]
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

  console.log('Raw minimal form data received:', rawData);

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
  const { name, categoryId, buyingPrice, barcode, reorderPoint, isActive, retailPrice, wholesalePrice } =
    validatedFields.data;

  // 4. Prepare Product and Default Variant Data
  const finalIsActive = isActive ?? true; // Use schema default if validation didn't set one
  const finalReorderPoint = reorderPoint ?? 5; // Use schema default if validation didn't set one
  const productSku = `PROD-${crypto.randomUUID().slice(3, 9).toUpperCase()}`;
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
        imageUrls: [],
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
              name: `Default - ${name}`, // Use product name for default variant name
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

  // 1. Parse Variants and Suppliers JSON strings and validate structure
  const parsedVariantsResult = parseJsonArrayField(formData, 'variants', ProductVariantSchema);
  if ('success' in parsedVariantsResult && !parsedVariantsResult.success) return parsedVariantsResult;
  const parsedVariants = parsedVariantsResult;
  console.log('Parsed & Structurally Validated Variants for Edit:', parsedVariants);

  const parsedSuppliersResult = parseJsonArrayField(formData, 'suppliers', ProductSupplierSchema);
  if ('success' in parsedSuppliersResult && !parsedSuppliersResult.success) return parsedSuppliersResult;
  const parsedSuppliers = parsedSuppliersResult as ProductSupplierInput[];
  console.log('Parsed & Structurally Validated Suppliers for Edit:', parsedSuppliers);

  // 2. Prepare data for Zod validation (using EditProductSchema)
  const dataToValidate = {
    ...rawData,
    productId: formData.get('productId'), // Ensure productId is present
    variants: parsedVariants,
    suppliers: parsedSuppliers,
    imageUrls: formData.getAll('imageUrls').filter(url => typeof url === 'string' && url.trim()),
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
    productId, // string (validated as CUID)
    categoryId, // string | undefined (required by EditProductSchema override)
    defaultLocationId, // string | null | undefined
    buyingPrice, // number | undefined
    retailPrice, // number | null | undefined
    reorderPoint, // number | undefined
    width,
    height,
    length, // number | null | undefined
    weight,
    volumetricWeight,
    variants: validatedVariants, // ProductVariantInput[]
    suppliers: validatedSuppliers, // ProductSupplierInput[]
    customFields: validatedCustomFields, // JSON object | null | undefined
    ...productData // name, description, isActive, sku, barcode, imageUrls (all potentially undefined if partial)
  } = validatedFields.data;

  // We need the *original* product SKU to generate variant SKUs if new ones are added without an SKU
  // Fetching it separately or ensuring it's part of the validated data if it's not updatable is needed.
  // Assuming productData.sku contains the *intended* SKU (new or existing). If SKU is immutable, fetch original.
  const productSkuForVariantGeneration = productData.sku; // Or fetch original if SKU is immutable

  // Ensure SKUs exist for upsert logic (variants need SKU for unique constraint [cite: 40])
  const variantsForUpsert = validatedVariants.map(v => ({
    ...v,
    // Generate SKU only if it's missing AND no ID exists (i.e., it's a new variant being added)
    sku:
      v.sku ||
      (!v.id
        ? `${productSkuForVariantGeneration || 'PROD'}-VAR-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
        : undefined),
  }));

  const variantIdsFromInput = variantsForUpsert.map(v => v.id).filter(Boolean) as string[];
  const supplierLinkIdsFromInput = validatedSuppliers.map(s => s.id).filter(Boolean) as string[]; // IDs of ProductSupplier records

  // 5. Database Update Operation
  try {
    console.log(`Attempting to update product ID: ${productId}`);

    const updatedProduct = await prisma.product.update({
      where: {
        id: productId,
        organizationId: organizationId, // Ensure user owns the product
      },
      data: {
        // Update core fields if they exist in validated data
        name: productData.name, // Always present due to schema override
        description: productData.description,
        sku: productData.sku ? productData.sku : undefined, // Update SKU if provided
        barcode: productData.barcode,
        buyingPrice: buyingPrice !== undefined ? new Prisma.Decimal(buyingPrice) : undefined,
        retailPrice:
          retailPrice !== undefined ? (retailPrice !== null ? new Prisma.Decimal(retailPrice) : null) : undefined,
        reorderPoint: reorderPoint,
        isActive: productData.isActive,
        imageUrls: productData.imageUrls,
        customFields: validatedCustomFields,
        width: width,
        height: height,
        length: length,
        dimensionUnit: MeasurementUnit.METER,
        weight: weight,
        weightUnit: MeasurementUnit.WEIGHT_KG,
        volumetricWeight: volumetricWeight,

        // Relations (only connect/disconnect if ID is present in validated data)
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        defaultLocation:
          defaultLocationId === null
            ? { disconnect: true }
            : defaultLocationId
              ? { connect: { id: defaultLocationId } }
              : undefined,

        // --- Variants: Upsert and Delete ---
        variants: {
          // Delete variants associated with this product NOT in the input array's IDs
          deleteMany: {
            productId: productId,
            id: { notIn: variantIdsFromInput },
          },
          // Upsert variants based on the input array
          upsert: variantsForUpsert.map(v => {
            // Data for creation (ensure required fields have values)
            const createData = {
              organization: { connect: { id: organizationId } },
              name: v.name, // Required
              sku: v.sku!, // Required, generated if missing for new variants
              barcode: v.barcode,
              priceModifier: new Prisma.Decimal(v.priceModifier ?? 0), // Use default if undefined
              attributes: v.attributes ?? Prisma.JsonNull,
              isActive: v.isActive ?? true, // Use default if undefined
              reorderPoint: v.reorderPoint ?? 5, // Use default if undefined
              reorderQty: v.reorderQty ?? 10, // Use default if undefined
              lowStockAlert: v.lowStockAlert ?? false, // Use default if undefined
            };
            // Data for update (only include fields present in input 'v')
            const updateData = {
              name: v.name, // Assume name is always provided for update
              sku: v.sku, // Update SKU only if provided in input
              barcode: v.barcode,
              priceModifier: v.priceModifier !== undefined ? new Prisma.Decimal(v.priceModifier) : undefined,
              attributes: v.attributes, // Send null or JSON object
              isActive: v.isActive,
              reorderPoint: v.reorderPoint || 10,
              reorderQty: v.reorderQty || 10,
              lowStockAlert: v.lowStockAlert,
            };
            return {
              where: { id: v.id || crypto.randomUUID() }, // Use real ID or non-matching UUID for create
              create: createData,
              update: updateData,
            };
          }),
        },

        // --- Suppliers (ProductSupplier): Upsert and Delete ---
        suppliers: {
          // Delete ProductSupplier links NOT in the input array's IDs
          deleteMany: {
            productId: productId,
            id: { notIn: supplierLinkIdsFromInput },
          },
          // Upsert ProductSupplier links based on the input array
          upsert: validatedSuppliers.map(s => {
            // Data for creation
            const createData = {
              supplier: { connect: { id: s.supplierId } }, // Required
              supplierSku: s.supplierSku,
              costPrice: new Prisma.Decimal(s.costPrice ?? 0), // Required
              minimumOrderQuantity: s.minimumOrderQuantity,
              packagingUnit: s.packagingUnit,
              isPreferred: s.isPreferred ?? false, // Use default
            };
            // Data for update
            const updateData = {
              supplierSku: s.supplierSku,
              costPrice: s.costPrice !== undefined ? new Prisma.Decimal(s.costPrice) : undefined,
              minimumOrderQuantity: s.minimumOrderQuantity,
              packagingUnit: s.packagingUnit,
              isPreferred: s.isPreferred,
            };
            return {
              where: { id: s.id || crypto.randomUUID() }, // Use real ProductSupplier ID or dummy
              create: createData,
              update: updateData,
            };
          }),
        },
      },
      include: {
        // Include relations in the response
        variants: true,
        suppliers: { include: { supplier: true } },
        category: true,
        defaultLocation: true,
      },
    });

    console.log(`Product ID: ${productId} updated successfully.`);

    // 6. Revalidate Cache
    revalidatePath('/dashboard/inventory/products');
    revalidatePath(`/dashboard/inventory/products/${productId}`);

    return { success: true, data: updatedProduct };
  } catch (error) {
    // 7. Handle Prisma Errors
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