"use server";

import { z } from "zod";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// --- Zod Schemas for Validation ---

const VariantAttributeSchema = z.object({
  name: z.string().min(1, "Attribute name required"),
  value: z.string().min(1, "Attribute value required"),
});

const getRandomSku = () => {
  return (
    Math.floor(Math.random() * 1000000).toString() +
    Math.floor(Math.random() * 1000000).toString()
  );
}
const VariantSchema = z.object({
  id: z.string().cuid().optional(), // Optional for new variants
  name: z.string(),
  sku: z.string().optional().default(getRandomSku()),
  skuSuffix: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  priceModifier: z.coerce
    .number()
    .default(0)
    .describe("Amount to add/subtract from base price"),
  attributes: z
    .array(VariantAttributeSchema)
    .min(1, "At least one attribute is required"),
});

const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  barcode: z
    .string()
    .optional()
    .nullable()
    .describe("Base product barcode if no variants"),
  categoryId: z.string().min(1, "Category is required"),
  basePrice: z.coerce.number().min(0, "Base price must be non-negative"),
  reorderPoint: z.coerce
    .number()
    .int()
    .min(0, "Reorder point must be non-negative")
    .default(5),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).optional().default([]),
  variants: z.array(VariantSchema).optional().default([]),
});

const EditProductSchema = ProductSchema.extend({
  id: z.string().cuid(),
  variants: z
    .array(
      VariantSchema.extend({
        id: z.string().cuid().optional(),
      })
    )
    .optional()
    .default([]),
});

const RestockSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  initialQuantity: z.coerce
    .number()
    .int()
    .positive("Quantity must be positive"),
  purchasePrice: z.coerce
    .number()
    .min(0, "Purchase price must be non-negative"),
  expiryDate: z.coerce.date().optional().nullable(),
  location: z.string().optional().nullable(),
  purchaseItemId: z.string().cuid().optional().nullable(),
});

const StockAdjustmentSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional().nullable(),
  stockBatchId: z.string().cuid().optional().nullable(),
  quantity: z
    .number()
    .int()
    .refine((val) => val !== 0, "Quantity must not be zero"),
  reason: z.enum([
    "INITIAL_STOCK",
    "DAMAGED",
    "EXPIRED",
    "LOST",
    "STOLEN",
    "FOUND",
    "RETURN_TO_SUPPLIER",
    "CUSTOMER_RETURN",
    "INVENTORY_COUNT",
    "OTHER",
  ]),
  notes: z.string().optional(),
});

// --- Helper Function for Error Handling ---
const handlePrismaError = (error: unknown): { error: string } => {
  console.error("Prisma Error:", error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target as string[] | undefined;
      return {
        error: `A record with this ${target?.join(", ")} already exists.`,
      };
    }
    return { error: `Database error: ${error.code}` };
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    return { error: "Invalid data provided." };
  }
  return { error: "An unexpected error occurred." };
};

// --- Product Actions ---

export async function getProducts(
  options: {
    includeVariants?: boolean;
    includeCategory?: boolean;
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    sortBy?: "name" | "createdAt" | "basePrice" | "totalStock";
    sortOrder?: "asc" | "desc";
  } = {}
) {
  const {
    includeVariants = true,
    includeCategory = true,
    page = 1,
    limit = 10,
    search,
    categoryId,
    sortBy = "name",
    sortOrder = "asc",
  } = options;

  const skip = (page - 1) * limit;
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(categoryId && { categoryId }),
  };

  try {
    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: includeCategory,
          variants: includeVariants
            ? {
                include: {
                  stockBatches: {
                    select: { currentQuantity: true },
                  },
                },
              }
            : false,
          stockBatches: {
            select: { currentQuantity: true },
          },
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
      const variantStock = p.variants.reduce(
        (variantSum, variant) =>
          variantSum +
          variant.variantStock.reduce(
            (batchSum, batch) => batchSum + batch.currentQuantity,
            0
          ),
        0
      );

      return {
        ...p,
        basePrice: p.basePrice.toString(),
        totalStock: baseStock + variantStock,
        variants: p.variants.map((v) => ({
          ...v,
          totalStock: v.stockBatches.reduce(
            (batchSum, batch) => batchSum + batch.currentQuantity,
            0
          ),
        })),
      };
    });

    return {
      products: productsWithStock,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      pageSize: limit,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      error: "Failed to fetch products.",
      products: [],
      totalProducts: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: limit,
    };
  }
}

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return { categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { error: "Failed to fetch categories." };
  }
}

export async function addProduct(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const variantsString = formData.get("variants") as string | null;
  let parsedVariants = [];

  try {
    parsedVariants = variantsString ? JSON.parse(variantsString) : [];
  } catch (e) {
    console.error("Error parsing variants:", e);
    return { error: "Invalid variant data format." };
  }

  const validatedFields = ProductSchema.safeParse({
    ...rawData,
    basePrice: parseFloat((rawData.basePrice as string) || "0"),
    reorderPoint: parseInt((rawData.reorderPoint as string) || "5", 10),
    isActive:
      rawData.isActive === "on" ||
      rawData.isActive === "true" ||
      rawData.isActive === true,
    imageUrls: formData
      .getAll("imageUrls")
      .filter((url) => typeof url === "string" && url),
    variants: parsedVariants,
  });

  if (!validatedFields.success) {
    console.error(
      "Validation Errors:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: "Validation failed.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const data = validatedFields.data;

  try {
    const newProduct = await prisma.product.create({
      data: {
        ...data,
        basePrice: new Prisma.Decimal(data.basePrice),
        variants: {
          create:
            data.variants?.map((v) => ({
              name: v.name,
              sku: v.sku,
              skuSuffix: v.skuSuffix,
              barcode: v.barcode,
              priceModifier: new Prisma.Decimal(v.priceModifier),
              attributes: v.attributes as unknown as Prisma.InputJsonValue,
            })) || [],
        },
      },
    });
    revalidatePath("/products");
    return { success: true, product: newProduct };
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function updateProduct(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const productId = rawData.id as string;

  if (!productId) return { error: "Product ID is missing." };

  const variantsString = formData.get("variants") as string | null;
  let parsedVariants = [];
  try {
    parsedVariants = variantsString ? JSON.parse(variantsString) : [];
  } catch (e) {
    console.error("Error parsing variants:", e);
    return { error: "Invalid variant data format." };
  }

  const validatedFields = EditProductSchema.safeParse({
    ...rawData,
    basePrice: parseFloat((rawData.basePrice as string) || "0"),
    reorderPoint: parseInt((rawData.reorderPoint as string) || "5", 10),
    isActive:
      rawData.isActive === "on" ||
      rawData.isActive === "true" ||
      rawData.isActive === true,
    imageUrls: formData
      .getAll("imageUrls")
      .filter((url) => typeof url === "string" && url),
    variants: parsedVariants,
  });

  if (!validatedFields.success) {
    console.error(
      "Validation Errors:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: "Validation failed.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id, variants, ...data } = validatedFields.data;

  try {
    const existingVariants = await prisma.productVariant.findMany({
      where: { productId: id },
      select: { id: true },
    });
    const existingVariantIds = new Set(existingVariants.map((v) => v.id));

    const variantsToCreate = variants?.filter((v) => !v.id) || [];
    const variantsToUpdate =
      variants?.filter((v) => v.id && existingVariantIds.has(v.id)) || [];
    const variantIdsToKeep = new Set(
      variants?.map((v) => v.id).filter(Boolean)
    );
    const variantsToDelete = existingVariants.filter(
      (v) => !variantIdsToKeep.has(v.id)
    );

    const updatedProduct = await prisma.$transaction(async (tx) => {
      if (variantsToDelete.length > 0) {
        await tx.productVariant.deleteMany({
          where: { id: { in: variantsToDelete.map((v) => v.id) } },
        });
      }

      const product = await tx.product.update({
        where: { id },
        data: {
          ...data,
          basePrice: new Prisma.Decimal(data.basePrice),
          variants: {
            create: variantsToCreate.map((v) => ({
              name: v.name,
              sku: v.sku,
              skuSuffix: v.skuSuffix,
              barcode: v.barcode,
              priceModifier: new Prisma.Decimal(v.priceModifier),
              attributes: v.attributes as unknown as Prisma.InputJsonValue,
            })),
          },
        },
      });

      for (const v of variantsToUpdate) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              barcode: v.barcode,
              priceModifier: new Prisma.Decimal(v.priceModifier),
              attributes: v.attributes as unknown as Prisma.InputJsonValue,
            },
          });
        }
      }

      return product;
    });

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    return { success: true, product: updatedProduct };
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function toggleProductStatus(
  productId: string,
  isActive: boolean
) {
  if (!productId) return { error: "Product ID is required." };

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isActive },
    });
    revalidatePath("/products");
    return { success: true, product: updatedProduct };
  } catch (error) {
    return handlePrismaError(error);
  }
}

// --- Stock Management Actions ---

export async function addStockBatch(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const expiryDateStr = formData.get("expiryDate") as string | null;
  const parsedData = {
    ...rawData,
    expiryDate:
      expiryDateStr && expiryDateStr !== "" ? new Date(expiryDateStr) : null,
    initialQuantity: parseInt(
      (formData.get("initialQuantity") as string) || "0",
      10
    ),
    purchasePrice: parseFloat((formData.get("purchasePrice") as string) || "0"),
  };

  const validatedFields = RestockSchema.safeParse(parsedData);

  if (!validatedFields.success) {
    console.error(
      "Validation Errors:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: "Validation failed.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const data = validatedFields.data;

  try {
    const newBatch = await prisma.stockBatch.create({
      data: {
        productId: data.productId,
        variantId: data.variantId || undefined,
        batchNumber: data.batchNumber || undefined,
        initialQuantity: data.initialQuantity,
        currentQuantity: data.initialQuantity,
        purchasePrice: new Prisma.Decimal(data.purchasePrice),
        expiryDate: data.expiryDate || undefined,
        location: data.location || undefined,
        purchaseItemId: data.purchaseItemId || undefined,
      },
    });

    revalidatePath("/stocks");
    return { success: true, batch: newBatch };
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function getStockBatches(
  options: {
    productId?: string;
    variantId?: string;
    includeProduct?: boolean;
    activeOnly?: boolean;
    page?: number;
    limit?: number;
  } = {}
) {
  const {
    productId,
    variantId,
    includeProduct = true,
    activeOnly = true,
    page = 1,
    limit = 20,
  } = options;

  const skip = (page - 1) * limit;

  try {
    const [batches, totalBatches] = await Promise.all([
      prisma.stockBatch.findMany({
        where: {
          productId,
          variantId,
          currentQuantity: activeOnly ? { gt: 0 } : undefined,
        },
        include: {
          product: includeProduct,
          variant: true,
          purchaseItem: true,
        },
        orderBy: {
          receivedDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.stockBatch.count({
        where: {
          productId,
          variantId,
          currentQuantity: activeOnly ? { gt: 0 } : undefined,
        },
      }),
    ]);

    const cleanBatches = batches.map((batch) => ({
      ...batch,
      purchasePrice: batch.purchasePrice.toString(),
      product: batch.product
        ? {
            ...batch.product,
            basePrice: batch.product.basePrice.toString(),
          }
        : null,
    }));

    return {
      batches: cleanBatches,
      totalBatches,
      totalPages: Math.ceil(totalBatches / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching stock batches:", error);
    return {
      error: "Failed to fetch stock batches.",
      batches: [],
      totalBatches: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
}

export async function getPastStockBatches(
  options: {
    includeProduct?: boolean;
    page?: number;
    limit?: number;
  } = {}
) {
  const { includeProduct = true, page = 1, limit = 20 } = options;

  const skip = (page - 1) * limit;

  try {
    const [batches, totalBatches] = await Promise.all([
      prisma.stockBatch.findMany({
        where: {
          currentQuantity: 0,
        },
        include: {
          product: includeProduct,
          variant: true,
          purchaseItem: true,
          saleItems: {
            select: { id: true, quantity: true, saleId: true },
          },
        },
        orderBy: {
          receivedDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.stockBatch.count({
        where: {
          currentQuantity: 0,
        },
      }),
    ]);

    return {
      batches,
      totalBatches,
      totalPages: Math.ceil(totalBatches / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching past stock batches:", error);
    return {
      error: "Failed to fetch past stock batches.",
      batches: [],
      totalBatches: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
}

export async function adjustStock(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const userId = formData.get("userId") as string;

  if (!userId) {
    return { error: "User ID is required for stock adjustment." };
  }

  const validatedFields = StockAdjustmentSchema.safeParse({
    ...rawData,
    quantity: parseInt(rawData.quantity as string, 10),
  });

  if (!validatedFields.success) {
    console.error(
      "Validation Errors:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: "Validation failed.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { productId, variantId, stockBatchId, quantity, reason, notes } =
    validatedFields.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the adjustment record
      const adjustment = await tx.stockAdjustment.create({
        data: {
          productId,
          variantId: variantId || undefined,
          stockBatchId: stockBatchId || undefined,
          userId,
          quantity,
          reason,
          notes,
        },
      });

      // 2. Update the stock batch if specified
      if (stockBatchId) {
        await tx.stockBatch.update({
          where: { id: stockBatchId },
          data: {
            currentQuantity: {
              increment: quantity,
            },
          },
        });
      } else if (variantId) {
        // Update the first available batch for the variant
        await tx.stockBatch.updateMany({
          where: {
            productId,
            variantId,
            currentQuantity: { gt: 0 },
          },
          data: {
            currentQuantity: {
              increment: quantity,
            },
          },
        });
      } else {
        // Update the first available batch for the product
        await tx.stockBatch.updateMany({
          where: {
            productId,
            variantId: null,
            currentQuantity: { gt: 0 },
          },
          data: {
            currentQuantity: {
              increment: quantity,
            },
          },
        });
      }

      return adjustment;
    });

    revalidatePath("/stocks");
    return { success: true, adjustment: result };
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function getLowStockProducts(threshold: number = 5) {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        stockBatches: {
          select: { currentQuantity: true },
        },
        variants: {
          include: {
            stockBatches: {
              select: { currentQuantity: true },
            },
          },
        },
      },
    });

    const lowStockProducts = products.filter((p) => {
      const baseStock = p.stockBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0
      );
      const variantStock = p.variants.reduce(
        (variantSum, variant) =>
          variantSum +
          variant.stockBatches.reduce(
            (batchSum, batch) => batchSum + batch.currentQuantity,
            0
          ),
        0
      );
      return baseStock + variantStock <= threshold;
    });

    return { products: lowStockProducts };
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return { error: "Failed to fetch low stock products." };
  }
}

// --- Variant Actions ---

export async function getProductVariants(productId: string) {
  if (!productId) return { error: "Product ID is required." };

  try {
    const variants = await prisma.productVariant.findMany({
      where: { productId },
      include: {
        stockBatches: {
          select: { currentQuantity: true },
        },
      },
    });

    const variantsWithStock = variants.map((v) => ({
      ...v,
      priceModifier: v.priceModifier.toString(),
      totalStock: v.stockBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0
      ),
    }));

    return { variants: variantsWithStock };
  } catch (error) {
    console.error("Error fetching variants:", error);
    return { error: "Failed to fetch variants." };
  }
}

export async function toggleVariantStatus(
  variantId: string,
  isActive: boolean
) {
  if (!variantId) return { error: "Variant ID is required." };

  try {
    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive },
    });
    revalidatePath("/products");
    return { success: true, variant: updatedVariant };
  } catch (error) {
    return handlePrismaError(error);
  }
}
