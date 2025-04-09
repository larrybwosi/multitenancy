"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

import { Category } from "@prisma/client";
import { CategoryForm } from "./category-form";
import { CategoryActions } from "./category-actions";
import { CategoryWithStats } from "@/actions/category.actions";

interface CategoryTableProps {
  categories: CategoryWithStats[];
  categoryOptions: { value: string; label: string }[]; // For the form dropdown
}

// Helper to format currency (replace with a more robust library like `dinero.js` or `Intl` if needed)
const formatCurrency = (
  value:
    | number
    | string
    | import("@prisma/client/runtime/library").Decimal
    | null
    | undefined
): string => {
  if (value === null || value === undefined) return "$0.00"; // Or your default currency/format
  const num = typeof value === "number" ? value : parseFloat(value.toString());
  if (isNaN(num)) return "$0.00";
  // Adjust currency symbol and formatting as needed
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

export function CategoryTable({
  categories,
  categoryOptions,
}: CategoryTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleOpenModal = (category: Category | null = null) => {
    setEditingCategory(category); // Set category for editing, or null for adding
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null); // Clear editing state when closing
  };

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {/* Pass categoryOptions here */}
              <CategoryForm
                category={editingCategory}
                categoryOptions={categoryOptions}
                onFormSubmit={handleCloseModal}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="text-right">Total Products</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
              <TableHead className="text-right">Est. Profit</TableHead>
              <TableHead>Best Seller (Qty)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length > 0 ? (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {category.parentName || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {category._count.products}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(category.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(category.potentialProfit)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {category.bestSellingProduct
                      ? `${category.bestSellingProduct.name} (${category.bestSellingProduct.totalSold})`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <CategoryActions
                      category={category}
                      onEdit={() => handleOpenModal(category)} // Pass category data to edit handler
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
