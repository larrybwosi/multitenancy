"use server";

import { Prisma, Category } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

// --- Type Definitions ---

// Define the structure of the category data including calculated stats
export type CategoryWithStats = Category & {
  _count: {
    products: number;
  };
  totalRevenue: Decimal;
  potentialProfit: Decimal; // Calculated from SaleItem cost/price
  bestSellingProduct: { name: string | null; totalSold: number } | null;
  // Add parent category name for display if needed
  parentName?: string | null;
};

// --- Validation Schemas ---

const CategoryFormSchema = z.object({
  id: z.string().optional(), // Optional: only present for updates
  name: z.string().min(1, "Category name is required."),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(), // Allow empty string or null
});

// --- Server Actions ---

/**
 * Fetches all categories and calculates statistics for each.
 */
export async function getCategoriesWithStats(): Promise<CategoryWithStats[]> {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
        parent: {
          // Include parent to potentially display its name
          select: { name: true },
        },
        // We need products to link to SaleItems
        products: {
          select: {
            id: true,
            name: true, // Needed for best seller lookup later
            // Include SaleItems related to each product
            saleItems: {
              select: {
                quantity: true,
                totalAmount: true,
                unitPrice: true,
                unitCost: true, // Crucial for profit calculation
                productId: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Calculate stats for each category
    const categoriesWithStats = categories.map((category) => {
      let totalRevenue = new Decimal(0);
      let potentialProfit = new Decimal(0);
      const productSales: Record<string, { name: string; totalSold: number }> =
        {};

      category.products.forEach((product) => {
        product.saleItems.forEach((item) => {
          totalRevenue = totalRevenue.add(item.totalAmount);
          // Profit for this item = (Selling Price - Cost Price) * Quantity
          // Assuming unitPrice is the selling price before discounts/taxes reflected in totalAmount
          // and unitCost is the cost of the item when sold.
          const itemProfit = item.unitPrice
            .sub(item.unitCost)
            .mul(item.quantity);
          potentialProfit = potentialProfit.add(itemProfit);

          // Track sales per product
          if (!productSales[product.id]) {
            productSales[product.id] = { name: product.name, totalSold: 0 };
          }
          productSales[product.id].totalSold += item.quantity;
        });
      });

      // Find best selling product within this category
      let bestSeller: { name: string | null; totalSold: number } | null = null;
      for (const productId in productSales) {
        if (
          !bestSeller ||
          productSales[productId].totalSold > bestSeller.totalSold
        ) {
          bestSeller = productSales[productId];
        }
      }

      // Remove the detailed product/saleItem data before sending to client
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { products, ...restOfCategory } = category;

      return {
        ...restOfCategory,
        parentName: category.parent?.name, // Add parent name
        totalRevenue,
        potentialProfit,
        bestSellingProduct: bestSeller,
      };
    });

    return categoriesWithStats;
  } catch (error) {
    console.error("Failed to fetch categories with stats:", error);
    // In a real app, you might throw a more specific error or return an empty array/error structure
    throw new Error("Database error: Could not fetch categories.");
  }
}

/**
 * Fetches a list of categories suitable for a dropdown (e.g., parent selection).
 */
export async function getCategoryOptions(): Promise<
  { value: string; label: string }[]
> {
  try {
    const categories = await db.category.findMany({
      select: { id: true, name: true },
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
        where: { id: id },
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
          name,
          description,
          parentId: parentIdValue,
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

  try {
    // Optional: Check if category has products or subcategories before deleting
    const category = await db.category.findUnique({
      where: { id },
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
