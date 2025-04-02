"use server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  ProductInput,
  ProductInputSchema,
  UpdateStockInput,
  UpdateStockInputSchema,
} from "@/lib/validations/product";
import { revalidatePath } from "next/cache";
import { Product as PrismaProduct } from "@prisma/client";
import { headers } from "next/headers";
import { Product, ProductWithCategory } from "@/lib/types";
import { auth } from "@/lib/auth";
import { AuditAction, AuditResource } from "@/lib/logging/audit-types";
import { logAuditEvent } from "@/lib/logging/audit-logger";


// Adapter to convert Prisma Product to our custom Product type
function adaptProduct(product: ProductWithCategory): any {
  return {
    id: product.id.toString(),
    name: product.name,
    price: product.price,
    category: {
      id: product.category_id.toString(),
      name: product.category?.name || "Uncategorized",
    },
    image: product.image_url || undefined,
    stock: product.stock,
    sku: product.sku || undefined,
    description: product.description || undefined,
    barcode: product.barcode || undefined,
    // Add any other fields needed
  };
}

export async function getProducts(): Promise<Product[]> {
  try {
    const products = await db.product.findMany({
      include: {
        category: true,
      },
    });
    return products.map(adaptProduct);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const product = await db.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
      },
    });

    if (!product) return null;
    return adaptProduct(product);
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    return null;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { barcode: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        category: true,
      },
    });

    return products.map(adaptProduct);
  } catch (error) {
    console.error(`Error searching products for "${query}":`, error);
    return [];
  }
}

export async function getProductByBarcode(barcode: string) {
  return await db.product.findUnique({
    where: { barcode },
  });
}

export async function createProduct(product: ProductInput) {
  try {
    const validatedProduct = ProductInputSchema.parse(product);

    const { categoryId, ...rest } = validatedProduct;
    const org = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    const result = await db.product.create({
      data: {
        ...rest,
        category: {
          connect: {
            id: parseInt(categoryId),
          },
        },
        org: {
          connect: {
            id: org.id,
          },
        },
      },
    });

    await logAuditEvent({
      action: AuditAction.CREATE_PRODUCT,
      resource: AuditResource.PRODUCT,
      resourceId: result.id,
      details: {
        product: result,
      },
    });

    revalidatePath("/api/products");
    revalidatePath("/products");
    revalidatePath("/pos");

    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("A product with this SKU or barcode already exists");
      }
    }
    throw error;
  }
}

export async function updateProduct(
  id: number,
  product: Partial<ProductInput>
) {
  const result = await db.product.update({
    where: { id },
    data: {
      ...product,
      updatedAt: new Date(),
    },
  });

  await logAuditEvent({
    action: AuditAction.UPDATE_PRODUCT,
    resource: AuditResource.PRODUCT,
    resourceId: id,
    details: {
      before: await getProductById(id.toString()),
      after: result,
      changes: product,
    },
  });
  return result;
}

export async function deleteProduct(id: number) {
  const result = await db.product.delete({
    where: { id },
  });
  revalidatePath("/products");
  revalidatePath("/pos");
  return result;
}
