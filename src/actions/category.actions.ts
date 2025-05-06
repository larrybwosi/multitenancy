"use server";

import { Prisma, Category } from "@/prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getServerAuthContext } from "./auth";

// --- Type Definitions ---

export type CategoryWithStats = Category & {
  _count: {
    products: number;
  };
  totalRevenue: number;
  potentialProfit: number; // Calculated from SaleItem cost/price
  bestSellingProduct: { name: string | null; totalSold: number } | null;
  // Add parent category name for display if needed
  parentName?: string | null;
};

// --- Validation Schemas ---

const CategoryFormSchema = z.object({
  id: z.string().optional(), // Optional: only present for updates
  name: z.string().min(1, "Category name is required."),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
});

// --- Server Actions ---

export async function getCategories() {
  const { organizationId } = await getServerAuthContext();
  try {
    const categories = await db.category.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

/**
 * Fetches all categories and calculates statistics for each.
 */

export type GetCategoriesWithStatsParams = {
  search?: string;
  filter?: string;
  page?: number;
  pageSize?: number;
}

export async function getCategoriesWithStats({
  search,
  filter,
  page = 1,
  pageSize = 10,
}: GetCategoriesWithStatsParams = {}): Promise<{
  data: CategoryWithStats[];
  totalItems: number;
  totalPages: number;
}> {
  try {
  const { organizationId } = await getServerAuthContext();
    const where: Prisma.CategoryWhereInput = {organizationId};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filter === "withProducts") {
      where.products = { some: {} };
    } else if (filter === "noProducts") {
      where.products = { none: {} };
    }

    const [categories, totalItems] = await Promise.all([
      db.category.findMany({
        where,
        include: {
          _count: {
            select: { products: true },
          },
          parent: {
            select: { name: true },
          },
          products: {
            select: {
              id: true,
              name: true,
              variants: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  saleItems: {
                    select: {
                      quantity: true,
                      totalAmount: true,
                      unitPrice: true,
                      unitCost: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.category.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    const data = categories.map((category) => {
      let totalRevenue = new Prisma.Decimal(0);
      let potentialProfit = new Prisma.Decimal(0);
      const productSales: Record<string, { name: string; totalSold: number }> =
        {};

      category.products.forEach((product) => {
        product.variants[0].saleItems.forEach((item) => {
          totalRevenue = totalRevenue.add(item.totalAmount);
          const itemProfit = item.unitPrice
            .sub(item.unitCost)
            .mul(item.quantity);
          potentialProfit = potentialProfit.add(itemProfit);

          if (!productSales[product.id]) {
            productSales[product.id] = { name: product.name, totalSold: 0 };
          }
          productSales[product.id].totalSold += item.quantity;
        });
      });

      let bestSeller: { name: string | null; totalSold: number } | null = null;
      for (const productId in productSales) {
        if (
          !bestSeller ||
          productSales[productId].totalSold > bestSeller.totalSold
        ) {
          bestSeller = productSales[productId];
        }
      }

      //eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { products, ...restOfCategory } = category;

      return {
        ...restOfCategory,
        parentName: category.parent?.name,
        totalRevenue: totalRevenue.toNumber(),
        potentialProfit: potentialProfit.toNumber(),
        bestSellingProduct: bestSeller,
      };
    });

    return { data, totalItems, totalPages };
  } catch (error) {
    console.error("Failed to fetch categories with stats:", error);
    throw new Error("Database error: Could not fetch categories.");
  }
}

/**
 * Fetches a list of categories suitable for a dropdown (e.g., parent selection).
 */
export async function getCategoryOptions(): Promise<
  { value: string; label: string }[]
> {
  const { organizationId } = await getServerAuthContext();
  try {
    const categories = await db.category.findMany({
      where: { organizationId },
      select: { id: true, name: true, parentId: true },
      orderBy: { name: "asc" },
    });
    return categories.map((cat) => ({ value: cat.id, label: cat.name }));
  } catch (error) {
    console.error("Failed to fetch category options:", error);
    return [];
  }
}

/**
 * Creates or updates a category.
 */
export async function saveCategory(formData: FormData) {
  const { organizationId } = await getServerAuthContext();
  
  const validatedFields = CategoryFormSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    parentId: formData.get("parentId") || null, // Handle empty string from form
  });

  if (!validatedFields.success) {
    console.error(
      "Validation Error:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid data provided.",
    };
  }

  const { id, name, description, parentId } = validatedFields.data;
  const parentIdValue =
    parentId === "" || parentId === "null" ? null : parentId; // Ensure null if empty/explicitly 'null'

  try {
    if (id) {
      // Update existing category
      await db.category.update({
        where: { id, organizationId },
        data: {
          name,
          description,
          parentId: parentIdValue,
        },
      });
    } else {
      // Create new category
      await db.category.create({
        data: {
          id: `CATEGORY-${crypto.randomUUID().slice(0, 8)}`,
          name,
          description,
          organization: { connect: { id: organizationId } },
          parent: parentIdValue ? { connect: { id: parentIdValue } } : undefined,
        },
      });
    }
    revalidatePath("/categories"); // Update the cache for the category page
    return {
      message: id
        ? "Category updated successfully."
        : "Category created successfully.",
    };
  } catch (error) {
    console.error("Database Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle potential errors like unique constraints or foreign key issues
      if (error.code === "P2002") {
        // Unique constraint violation
        return {
          message: `Error: A category with the name "${name}" already exists.`,
        };
      }
      if (error.code === "P2003") {
        // Foreign key constraint (e.g., parentId doesn't exist)
        return {
          message: `Error: The selected parent category does not exist.`,
        };
      }
    }
    return { message: "Database Error: Failed to save category." };
  }
}

/**
 * Deletes a category.
 */
export async function deleteCategory(id: string) {
  if (!id) {
    return { message: "Error: Category ID is missing." };
  }
  const { organizationId } = await getServerAuthContext();

  try {
    // Optional: Check if category has products or subcategories before deleting
    const category = await db.category.findUnique({
      where: { id, organizationId },
      include: {
        _count: {
          select: { products: true, subcategories: true },
        },
      },
    });

    if (!category) {
      return { message: `Error: Category with ID ${id} not found.` };
    }

    if (category._count.products > 0) {
      return {
        message: `Error: Cannot delete category. It has ${category._count.products} associated product(s). Reassign products first.`,
      };
    }
    if (category._count.subcategories > 0) {
      return {
        message: `Error: Cannot delete category. It has ${category._count.subcategories} subcategories. Delete or reassign subcategories first.`,
      };
    }

    // Proceed with deletion if no blocking relations exist
    await db.category.delete({
      where: { id: id },
    });
    revalidatePath("/dashboard/categories"); // Update the cache
    return { message: "Category deleted successfully." };
  } catch (error) {
    console.error("Database Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Catch specific Prisma errors if needed, though the checks above handle common ones
      if (error.code === "P2025") {
        // Record to delete not found
        return { message: `Error: Category with ID ${id} not found.` };
      }
      // P2014: Relation violation (might occur if checks above fail or schema changes)
      if (error.code === "P2014" || error.code === "P2003") {
        return {
          message: `Error: Cannot delete category due to existing relations (e.g., products or subcategories).`,
        };
      }
    }
    return { message: "Database Error: Failed to delete category." };
  }
}
