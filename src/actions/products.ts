"use server";

import prisma from "@/lib/db"; 
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getServerAuthContext } from "./auth";
import { EditProductSchema, ProductSchema, ProductSupplierInput, ProductVariantInput } from "@/lib/validations/product";

// --- Helper Functions ---

const handlePrismaError = (
  error: unknown
): { error: string; fieldErrors?: Record<string, string> } => {
  console.error("Prisma Error:", error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target as string[] | undefined;
      const field = target ? target.join(", ") : "field";
      return {
        error: `A record with this ${field} already exists. Please use a unique value.`,
        fieldErrors: target
          ? { [target[0]]: `This ${target[0]} is already taken.` }
          : undefined,
      };
    }
    if (error.code === "P2025") {
      return {
        error: "The record you tried to update or delete does not exist.",
      };
    }
    return {
      error: `Database error occurred (Code: ${error.code}). Please try again.`,
    };
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    return { error: "Invalid data format submitted. Please check your input." };
  }
  return {
    error:
      "An unexpected error occurred. Please contact support if the problem persists.",
  };
};

function safeParseVariants(formData: FormData): ProductVariantInput[] | { error: string } {
    const variantsString = formData.get("variants") as string | null;
    if (!variantsString) return [];
    try {
        const parsed = JSON.parse(variantsString);
        if (!Array.isArray(parsed)) {
             return { error: "Variants data must be an array." };
        }
        return parsed as ProductVariantInput[];
    } catch (e) {
        console.error("Error parsing variants JSON:", e);
        return { error: "Invalid JSON format for variant data." };
    }
}

function safeParseSuppliers(formData: FormData): ProductSupplierInput[] | { error: string } {
  const suppliersString = formData.get("suppliers") as string | null;
  if (!suppliersString) return [];
  try {
      const parsed = JSON.parse(suppliersString);
      if (!Array.isArray(parsed)) {
            return { error: "Suppliers data must be an array." };
      }
      return parsed as ProductSupplierInput[];
  } catch (e) {
      console.error("Error parsing suppliers JSON:", e);
      return { error: "Invalid JSON format for supplier data." };
  }
}

// --- Product Actions ---

export async function getProducts(
  options: {
    includeVariants?: boolean;
    includeCategory?: boolean;
    includeSuppliers?: boolean;
    includeDefaultLocation?: boolean;
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    sortBy?: "name" | "createdAt" | "basePrice";
    sortOrder?: "asc" | "desc";
  } = {}
) {
  const {
    includeVariants = true,
    includeCategory = true,
    includeSuppliers = false,
    includeDefaultLocation = false,
    page = 1,
    limit = 10,
    search,
    categoryId,
    sortBy = "name",
    sortOrder = "asc",
  } = options;

  const { organizationId } = await getServerAuthContext();

  const where: Prisma.ProductWhereInput = {
    organizationId,
    category: {
      organizationId
    },
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        {
          variants: {
            some: { sku: { contains: search, mode: "insensitive" } },
          },
        },
      ],
    }),
    ...(categoryId && { categoryId }),
  };

  const skip = (page - 1) * limit;

  try {
    const [products, totalProducts] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          category: includeCategory,
          variants: includeVariants
            ? {
                include: {
                  stockBatches: {
                    select: { currentQuantity: true },
                    where: { currentQuantity: { gt: 0 } },
                  },
                },
                where: { isActive: true },
              }
            : false,
          stockBatches: {
            select: { currentQuantity: true },
            where: { variantId: null, currentQuantity: { gt: 0 } },
          },
          suppliers: includeSuppliers ? {
            include: {
              supplier: true
            }
          } : false,
          defaultLocation: includeDefaultLocation,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);
    
    const productsWithStock = products.map((p) => {
      const baseStock = p.stockBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0
      );
      const variantsWithStock =
        p.variants?.map((v) => {
          const variantStockTotal = v.stockBatches.reduce(
            (sum, batch) => sum + batch.currentQuantity,
            0
          );
          return {
            ...v,
            priceModifier: v.priceModifier.toString(),
            totalStock: variantStockTotal,
            attributes: v.attributes
          };
        }) || [];
      const totalVariantStock = variantsWithStock.reduce(
        (sum, v) => sum + v.totalStock,
        0
      );

      return {
        ...p,
        basePrice: p.basePrice.toString(),
        totalStock: baseStock + totalVariantStock,
        variants: variantsWithStock,
        suppliers: p.suppliers?.map(s => ({
          ...s,
          costPrice: s.costPrice.toString()
        })),
        stockBatches: undefined,
        category: p.category ? { ...p.category } : undefined,
      };
    });

    return {
      data: productsWithStock,
      meta: {
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        pageSize: limit,
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { error: "Failed to fetch products due to a database error." };
  }
}

export async function addProduct(formData: FormData) {
  const context = await getServerAuthContext();
  const { organizationId } = context;

  const rawData = Object.fromEntries(formData.entries());

  // Parse variants and suppliers
  const parsedVariantsResult = safeParseVariants(formData);
  if ("error" in parsedVariantsResult) return parsedVariantsResult;
  const parsedVariants = parsedVariantsResult;

  const parsedSuppliersResult = safeParseSuppliers(formData);
  if ("error" in parsedSuppliersResult) return parsedSuppliersResult;
  const parsedSuppliers = parsedSuppliersResult;

  // Prepare data for validation
  const dataToValidate = {
    ...rawData,
    isActive: rawData.isActive === "on" || rawData.isActive === "true",
    imageUrls: formData
      .getAll("imageUrls")
      .filter((url): url is string => typeof url === "string" && url.length > 0),
    variants: parsedVariants.map((v) => ({
      ...v,
      isActive: typeof v.isActive === "boolean" ? v.isActive : v.isActive === "on" || v.isActive === "true",
      lowStockAlert: typeof v.lowStockAlert === "boolean" ? v.lowStockAlert : v.lowStockAlert === "on" || v.lowStockAlert === "true",
    })),
    suppliers: parsedSuppliers,
  };

  const validatedFields = ProductSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      error: "Validation failed. Please check your input.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { variants, suppliers, categoryId,defaultLocationId, ...productData } = validatedFields.data;

  try {
    const newProduct = await prisma.product.create({
      data: {
        ...productData,
        organization: { connect: { id: organizationId } },
        category: { connect: { id: categoryId } },
        basePrice: new Prisma.Decimal(productData.basePrice),
        reorderPoint: productData.reorderPoint,
        imageUrls: productData.imageUrls ?? [],
        isActive: productData.isActive,
        width: productData.width,
        height: productData.height,
        depth: productData.depth,
        dimensionUnit: productData.dimensionUnit,
        weight: productData.weight,
        weightUnit: productData.weightUnit,
        volumetricWeight: productData.volumetricWeight,
        defaultLocation: { connect: { id: defaultLocationId } },
        variants: {
          create: variants.map((v) => ({
            ...v,
            organization: { connect: { id: organizationId } },
            priceModifier: new Prisma.Decimal(v.priceModifier),
            attributes: (v.attributes as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            reorderPoint: v.reorderPoint,
            reorderQty: v.reorderQty,
            isActive: v.isActive,
            lowStockAlert: v.lowStockAlert,
            barcode: v.barcode,
            name: v.name,
            sku: v.sku,
          })),
        },
        suppliers: suppliers && suppliers.length > 0 ? {
          create: suppliers.map(s => ({
            supplier: { connect: { id: s.supplierId } },
            supplierSku: s.supplierSku,
            costPrice: new Prisma.Decimal(s.costPrice),
            minimumOrderQuantity: s.minimumOrderQuantity,
            packagingUnit: s.packagingUnit,
            isPreferred: s.isPreferred,
          }))
        } : undefined,
      },
      include: { 
        variants: true,
        suppliers: {
          include: {
            supplier: true
          }
        }
      },
    });

    revalidatePath("/products");
    return { success: true, data: newProduct };
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function updateProduct(formData: FormData) {
  const { organizationId } = await getServerAuthContext();
  const rawData = Object.fromEntries(formData.entries());
  const productId = rawData.id as string;

  if (!productId) return { error: "Product ID is missing." };

  // Parse variants and suppliers
  const parsedVariantsResult = safeParseVariants(formData);
  if ("error" in parsedVariantsResult) return parsedVariantsResult;
  const parsedVariants = parsedVariantsResult;

  const parsedSuppliersResult = safeParseSuppliers(formData);
  if ("error" in parsedSuppliersResult) return parsedSuppliersResult;
  const parsedSuppliers = parsedSuppliersResult;

  const dataToValidate = {
    ...rawData,
    id: productId,
    isActive: rawData.isActive === "on" || rawData.isActive === "true",
    imageUrls: formData
      .getAll("imageUrls")
      .filter((url): url is string => typeof url === "string" && url.length > 0),
    variants: parsedVariants.map((v) => ({
      ...v,
      id: v.id || undefined,
      isActive: typeof v.isActive === "boolean" ? v.isActive : v.isActive === "on" || v.isActive === "true",
      lowStockAlert: typeof v.lowStockAlert === "boolean" ? v.lowStockAlert : v.lowStockAlert === "on" || v.lowStockAlert === "true",
    })),
    suppliers: parsedSuppliers,
  };

  const validatedFields = EditProductSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      error: "Validation failed. Please check your input.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    id,
    categoryId,
    variants: submittedVariants,
    suppliers: submittedSuppliers,
    defaultLocationId,
    ...productData
  } = validatedFields.data;

  try {
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // 1. Handle variants (same as before)
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: id, organizationId },
        select: { id: true },
      });
      const existingVariantIds = new Set(existingVariants.map((v) => v.id));

      const variantsToCreate = submittedVariants.filter((v) => !v.id);
      const variantsToUpdate = submittedVariants.filter(
        (v) => v.id && existingVariantIds.has(v.id)
      );
      const submittedVariantIds = new Set(
        submittedVariants
          .map((v) => v.id)
          .filter((variantId): variantId is string => !!variantId)
      );
      const variantsToDeleteIds = [...existingVariantIds].filter(
        (existingId) => !submittedVariantIds.has(existingId)
      );

      if (variantsToDeleteIds.length > 0) {
        await tx.productVariant.deleteMany({
          where: {
            id: { in: variantsToDeleteIds },
            organizationId,
          },
        });
      }

      // 2. Handle suppliers
      const existingSuppliers = await tx.productSupplier.findMany({
        where: { productId: id },
        select: { supplierId: true },
      });
      const existingSupplierIds = new Set(existingSuppliers.map((s) => s.supplierId));

      const suppliersToCreate = submittedSuppliers.filter(
        (s) => !existingSupplierIds.has(s.supplierId)
      );
      const suppliersToUpdate = submittedSuppliers.filter(
        (s) => existingSupplierIds.has(s.supplierId)
      );
      const submittedSupplierIds = new Set(submittedSuppliers.map((s) => s.supplierId));
      const suppliersToDeleteIds = [...existingSupplierIds].filter(
        (existingId) => !submittedSupplierIds.has(existingId)
      );

      if (suppliersToDeleteIds.length > 0) {
        await tx.productSupplier.deleteMany({
          where: {
            productId: id,
            supplierId: { in: suppliersToDeleteIds },
          },
        });
      }

      // 3. Update the main product data
      await tx.product.update({
        where: { id, organizationId },
        data: {
          ...productData,
          category: { connect: { id: categoryId } },
          basePrice: new Prisma.Decimal(productData.basePrice),
          reorderPoint: productData.reorderPoint,
          imageUrls: productData.imageUrls ?? [],
          isActive: productData.isActive,
          width: productData.width,
          height: productData.height,
          depth: productData.depth,
          dimensionUnit: productData.dimensionUnit,
          weight: productData.weight,
          weightUnit: productData.weightUnit,
          volumetricWeight: productData.volumetricWeight,
          defaultLocation: defaultLocationId
            ? { connect: { id: defaultLocationId } }
            : defaultLocationId === null
              ? { disconnect: true }
              : undefined,
        },
      });

      // 4. Create new variants
      if (variantsToCreate.length > 0) {
        await tx.productVariant.createMany({
          data: variantsToCreate.map((v) => ({
            productId: id,
            organizationId,
            name: v.name,
            sku: v.sku,
            barcode: v.barcode,
            isActive: v.isActive,
            priceModifier: new Prisma.Decimal(v.priceModifier),
            attributes: (v.attributes as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            reorderPoint: v.reorderPoint,
            reorderQty: v.reorderQty,
            lowStockAlert: v.lowStockAlert,
          })),
        });
      }

      // 5. Update existing variants
      for (const v of variantsToUpdate) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id, organizationId },
            data: {
              name: v.name,
              sku: v.sku,
              barcode: v.barcode,
              isActive: v.isActive,
              priceModifier: new Prisma.Decimal(v.priceModifier),
              attributes: (v.attributes as Prisma.InputJsonValue) ?? Prisma.JsonNull,
              reorderPoint: v.reorderPoint,
              reorderQty: v.reorderQty,
              lowStockAlert: v.lowStockAlert,
            },
          });
        }
      }

      // 6. Create new suppliers
      if (suppliersToCreate.length > 0) {
        await tx.productSupplier.createMany({
          data: suppliersToCreate.map((s) => ({
            productId: id,
            supplierId: s.supplierId,
            supplierSku: s.supplierSku,
            costPrice: new Prisma.Decimal(s.costPrice),
            minimumOrderQuantity: s.minimumOrderQuantity,
            packagingUnit: s.packagingUnit,
            isPreferred: s.isPreferred,
          })),
        });
      }

      // 7. Update existing suppliers
      for (const s of suppliersToUpdate) {
        await tx.productSupplier.update({
          where: {
            productId_supplierId: {
              productId: id,
              supplierId: s.supplierId,
            },
          },
          data: {
            supplierSku: s.supplierSku,
            costPrice: new Prisma.Decimal(s.costPrice),
            minimumOrderQuantity: s.minimumOrderQuantity,
            packagingUnit: s.packagingUnit,
            isPreferred: s.isPreferred,
          },
        });
      }

      // Fetch the final state of the product
      return await tx.product.findUnique({
        where: { id },
        include: { 
          variants: true,
          suppliers: {
            include: {
              supplier: true
            }
          },
          defaultLocation: true,
        },
      });
    });

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    return { success: true, data: updatedProduct };
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Toggles the isActive status of a product.
 */
export async function toggleProductStatus(
  productId: string,
  isActive: boolean
) {
  // TODO: Auth checks
  if (!productId) return { error: "Product ID is required." };

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId /* , organizationId: orgId */ }, // Add org check
      data: { isActive },
    });
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    return { success: true, data: updatedProduct };
  } catch (error) {
    return handlePrismaError(error);
  }
}

// --- Variant Actions ---

/**
 * Fetches all active variants for a specific product, including stock counts.
 */
export async function getProductVariants(productId: string) {
  // TODO: Auth checks
  if (!productId) return { error: "Product ID is required." };

  try {
    const variants = await prisma.productVariant.findMany({
      where: { productId: productId, isActive: true }, // Fetch only active variants
      include: {
        // Include active stock batches for stock calculation
        stockBatches: {
          select: { currentQuantity: true },
          where: { currentQuantity: { gt: 0 } },
        },
        // product: { select: { name: true }} // Optionally include product name
      },
      orderBy: { name: "asc" }, // Order variants by name
    });

    // Calculate stock and convert decimals
    const variantsWithStock = variants.map((v) => ({
      ...v,
      priceModifier: v.priceModifier.toString(), // Convert Decimal
      totalStock: v.stockBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0
      ),
      attributes: v.attributes, // Type assertion if needed for client
      stockBatches: undefined, // Don't send raw batches
    }));

    return { data: variantsWithStock };
  } catch (error) {
    console.error(`Error fetching variants for product ${productId}:`, error);
    return { error: "Failed to fetch product variants." };
  }
}

/**
 * Toggles the isActive status of a product variant.
 */
export async function toggleVariantStatus(
  variantId: string,
  isActive: boolean
) {
  // TODO: Auth checks
  if (!variantId) return { error: "Variant ID is required." };

  try {
    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive },
      select: { id: true, isActive: true, productId: true }, // Select needed fields
    });

    // Revalidate the product page where this variant might be shown
    revalidatePath(`/products/${updatedVariant.productId}`);
    return { success: true, data: updatedVariant };
  } catch (error) {
    return handlePrismaError(error);
  }
}


export async function deleteProduct(id: string) {
  const { organizationId } = await getServerAuthContext();
  try {
    await prisma.product.delete({
      where: { id, organizationId },
    });
    
    revalidatePath("/products");
    return { success: true, message: "Product deleted successfully." };
  } catch (error) {
    console.error("Failed to delete product:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle related records preventing deletion if necessary (e.g., P2014)
      if (error.code === "P2025") {
        // Record not found
        return { success: false, message: "Product not found." };
      }
      // Add more specific error handling if needed (e.g., foreign key constraints)
    }
    return {
      success: false,
      message: "Database error: Failed to delete product.",
    };
  }
}
