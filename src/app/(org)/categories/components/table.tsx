"use client";

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
import { FileText, Grid, PlusCircle } from "lucide-react";
import { Category } from "@/prisma/client";
import { CategoryForm } from "./category-form";
import { CategoryActions } from "./category-actions";
import { Pagination } from "@/components/pagination";
import { FilterControls } from "@/components/file-controls";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { useCategories } from "@/lib/hooks/use-categories";
import LoadingSkeleton from "../loading";
import { formatCurrency } from "@/lib/utils";

interface CategoryTableProps {
  currentPage: number;
  pageSize: number;
}

export function CategoryTable({
  currentPage,
  pageSize,
}: CategoryTableProps) {
  const [isModalOpen, setIsModalOpen] = useQueryState('modal', {
    parse: (v) => v === 'true',
    serialize: (v) => v ? 'true' : 'false'
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [search, setSearch] = useQueryState('search');
  const [page, setPage] = useQueryState('page', {
    defaultValue: currentPage.toString(),
    parse: Number,
    serialize: String
  });
  const [size, setSize] = useQueryState('pageSize', {
    defaultValue: pageSize.toString() || '10',
    parse: Number,
    serialize: String
  });
  
  const { data: categoriesData, isLoading, error } = useCategories({
    page,
    pageSize: size,
    search: search || undefined,
    // filter: filter || undefined, // optional
  });
  const categories = categoriesData?.data || [];
  const totalPages = categoriesData?.totalPages || 0;

  const handleOpenModal = (category: Category | null = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleExportPdf = async () => {
    try {
      // const pdfBuffer = await exportToPdf(categories);
      // const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = "categories-report.pdf";
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    }
  };

  const handleExportExcel = async () => {
    try {
      // const excelBuffer = await exportToExcel(categories);
      // const blob = new Blob([excelBuffer], {
      //   type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // });
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = "categories-report.xlsx";
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    }
  };


  const handleSearch = (value: string) => {
    setSearch(value || null);
    setPage('1');
  };


  const handlePageChange = (newPage: number) => {
    setPage(newPage.toString());
  };

  const handlePageSizeChange = (newSize: number) => {
    setSize(newSize.toString());
    setPage('1');
  };

  const handleSortChange = (column: string) => {
    console.log(column)
    // Implement sorting logic here
  };

  if (isLoading) return <LoadingSkeleton/>;
  if (error) return <div>Error loading categories</div>;
  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Dialog open={isModalOpen as boolean} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenModal()}
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              <p className="text-gray-50">Add Category</p>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <CategoryForm
                category={editingCategory}
                onFormSubmit={handleCloseModal}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <FilterControls
        searchPlaceholder="Search categories..."
        filters={[
          {
            name: "status",
            label: "Status",
            options: [
              { value: "all", label: "All" },
              { value: "withProducts", label: "With Products" },
              { value: "inactive", label: "Inactive" },
            ],
            onChange: (value) => handleSortChange(value),
          },
        ]}
        onSearch={handleSearch}
        exportActions={[
          {
            label: "PDF",
            onClick: handleExportPdf,
            icon: <FileText className="mr-2 h-4 w-4" />,
          },
          {
            label: "Exel",
            onClick: handleExportExcel,
            icon: <Grid className="mr-2 h-4 w-4" />,
          },
        ]}
      />

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
                      onEdit={() => handleOpenModal(category)}
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={categoriesData?.totalItems || 0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}