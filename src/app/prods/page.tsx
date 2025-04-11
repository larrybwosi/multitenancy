"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, LayoutGrid, List, Download } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { getCategories, getProducts } from "@/actions/stockActions";
import { ExportAction, FilterControls, FilterOption } from "@/components/file-controls";
import { ProductListItem } from "./components/List";
import { ProductCard } from "./components/ProductCard";
import { Pagination } from "@/components/pagination";
import { Prisma } from "@prisma/client";

// Assuming Product type includes relations after getProducts processing
type ProductWithDetails =
  Awaited<ReturnType<typeof getProducts>> extends { products: infer P }
    ? P[number]
    : never;
type Category =
  Awaited<ReturnType<typeof getCategories>> extends { categories: infer C }
    ? C[number]
    : never;

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

export default function ProductsPage() {
  const [products, setProducts] = useState<Prisma.ProductOrderByWithRelationInput[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition(); // For server action calls

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductWithDetails | null>(null);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // Store category ID

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]); // Default page size

  // --- Data Fetching ---
  const fetchProductsAndCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch categories only once or if they might change
      if (categories.length === 0) {
        const catResult = await getCategories();
        if (catResult.categories) {
          setCategories(catResult.categories);
        } else {
          console.error("Failed to fetch categories:", catResult.error);
          // Don't necessarily block product loading for category failure
        }
      }

      // Fetch products with current filters/pagination
      const result = await getProducts({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        categoryId: selectedCategory || undefined,
        // Add sorting options if needed
      });

      if (result.products) {
        setProducts(result.products);
        setTotalItems(result.totalProducts ?? 0);
        setTotalPages(result.totalPages ?? 1);
        setCurrentPage(result.currentPage ?? 1); // Ensure sync with server response
        setPageSize(result.pageSize ?? PAGE_SIZE_OPTIONS[0]);
      } else {
        setError(result.error || "Failed to load products.");
        setProducts([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error("Fetching error:", err);
      setError("An unexpected error occurred.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, selectedCategory, categories.length]); // Dependencies

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  }, 500); // 500ms debounce

  // Initial fetch and re-fetch on dependency change
  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]); // Use the memoized callback

  // --- Event Handlers ---
  const handleOpenAddDialog = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (product: ProductWithDetails) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null); // Clear editing state
  };

  const handleDialogSuccess = () => {
    // Re-fetch data after add/update
    fetchProductsAndCategories();
  };

  const handleDeleteProduct = async (productId: string) => {
    // Basic confirmation (use a nicer modal in production)
    if (
      window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      startTransition(async () => {
        toast.info("Deleting product...");
        // *** TODO: Implement deleteProduct server action ***
        // const result = await deleteProductAction(productId);
        // if (result.success) {
        //    toast.success("Product deleted successfully.");
        //    fetchProductsAndCategories(); // Refresh list
        // } else {
        //    toast.error(`Failed to delete product: ${result.error}`);
        // }
        console.log("Placeholder: Delete product with ID:", productId);
        toast.warning("Delete functionality not yet implemented."); // Placeholder message
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when size changes
  };

  const handleCategoryFilterChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1); // Reset page
  };

  // --- FilterControls Configuration ---
  const categoryFilterOptions: FilterOption[] = [
    { value: "", label: "All Categories" },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ];

  const filterConfig = [
    {
      name: "category",
      label: "Category",
      options: categoryFilterOptions,
      defaultValue: selectedCategory,
      onChange: handleCategoryFilterChange,
    },
    // Add more filters here (e.g., stock status, price range)
  ];

  const exportActions: ExportAction[] = [
    {
      label: "Export CSV",
      icon: <Download className="h-4 w-4 mr-2" />,
      onClick: () => toast.info("Export CSV clicked (implement me!)"),
    },
    // Add more export options
  ];

  // --- Loading Skeletons ---
  const renderSkeletons = (count: number) => {
    return Array.from({ length: count }).map((_, index) =>
      viewMode === "grid" ? (
        <Skeleton key={index} className="h-[350px] w-full" /> // Adjust height for ProductCard
      ) : (
        <div
          key={index}
          className="flex items-center space-x-4 p-3 border-b last:border-b-0"
        >
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-16 hidden md:block" />
          <Skeleton className="h-4 w-12 hidden md:block" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      )
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Products
        </h1>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <Button
            variant={viewMode === "grid" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            aria-label="Grid View"
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            aria-label="List View"
          >
            <List className="h-5 w-5" />
          </Button>
          {/* Add Product Button */}
          <Button
            onClick={handleOpenAddDialog}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <FilterControls
        searchPlaceholder="Search by name, SKU..."
        onSearch={debouncedSearch} // Use debounced handler
        filters={filterConfig}
        exportActions={exportActions}
        showSearch={true}
        // showFilterButton={true} // Optionally hide filters behind a button
        className="mb-6"
        variant="bordered" // Example variant
      />

      {/* Content Area */}
      <div className="space-y-4">
        {error && (
          <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-md">
            {error}
          </p>
        )}

        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {renderSkeletons(pageSize)}
            </div>
          ) : (
            <div className="border rounded-md">{renderSkeletons(pageSize)}</div>
          )
        ) : products.length === 0 && !error ? (
          <p className="text-center text-muted-foreground py-10">
            No products found matching your criteria.
          </p>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleOpenEditDialog}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        ) : (
          <div className="border rounded-md">
            {products.map((product) => (
              <ProductListItem
                key={product.id}
                product={product}
                onEdit={handleOpenEditDialog}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange} // Pass handler if component supports it
            className="mt-6"
          />
        )}
      </div>

      {/* Add/Edit Dialog */}
      <ProductDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        productToEdit={editingProduct ?? undefined}
        categories={categories}
        onSuccess={handleDialogSuccess}
      />

      {/* Toaster for notifications */}
      {/* <Toaster richColors position="top-right" />  Make sure Toaster is included in your layout */}
    </div>
  );
}
