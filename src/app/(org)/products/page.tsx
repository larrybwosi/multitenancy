'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Package2 } from 'lucide-react';
import ProductsTab from './components/products-tab';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCategories } from '@/lib/hooks/use-categories';
import { useProducts } from '@/lib/hooks/use-products';
import { useQueryState } from 'nuqs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Pagination } from '@/components/pagination';

export default function ProductsPage() {
  // State management with nuqs for pagination and filters
  const [page, setPage] = useQueryState('page', { defaultValue: '1' });
  const [pageSize, setPageSize] = useQueryState('pageSize', { defaultValue: '10' });
  const [search, setSearch] = useQueryState('search');
  const [categoryId, setCategoryId] = useQueryState('categoryId');
  const [sortBy, setSortBy] = useQueryState<'name' | 'createdAt' | 'basePrice'>('sortBy', {
    defaultValue: 'name',
    parse: (value) => value as 'name' | 'createdAt' | 'basePrice',
  });
  const [sortOrder, setSortOrder] = useQueryState<'asc' | 'desc'>('sortOrder', { defaultValue: 'asc', parse: (value) => value as 'asc' | 'desc' });

  // Convert query params to numbers
  const currentPage = parseInt(page || '1');
  const currentPageSize = parseInt(pageSize || '10');

  // Fetch products with current filters
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useProducts({
    includeVariants: true,
    includeCategory: true,
    page: currentPage,
    limit: currentPageSize,
    search: search || undefined,
    categoryId: categoryId || undefined,
    sortBy: sortBy,
    sortOrder: sortOrder,
  });

  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories, error: categoriesError } = useCategories();

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage.toString());
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize.toString());
    setPage('1'); // Reset to first page when changing page size
  };

  // Prepare pagination props
  const paginationProps = {
    currentPage: currentPage,
    totalPages: productsData?.meta?.totalPages || 1,
    pageSize: currentPageSize,
    totalItems: productsData?.meta?.totalProducts || 0,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  };

  // Loading state
  if (isLoadingProducts || isLoadingCategories) {
    return (
      <Card className="border-none shadow-lg flex-1 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader>
          <SectionHeader
            title="Products"
            subtitle="Manage your products efficiently and effectively"
            icon={<Package2 className="h-8 w-8 text-blue-800" />}
          />
        </CardHeader>
        <CardContent className="px-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (productsError || categoriesError) {
    return (
      <Card className="border-none shadow-lg flex-1 overflow-hidden">
        <CardHeader>
          <SectionHeader
            title="Products"
            subtitle="Manage your products efficiently and effectively"
            icon={<Package2 className="h-8 w-8 text-blue-800" />}
          />
        </CardHeader>
        <CardContent className="px-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading data</AlertTitle>
            <AlertDescription>
              {productsError?.message || categoriesError?.message || 'Unknown error occurred'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none flex-1 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 flex flex-col min-h-[calc(100vh-theme(spacing.32))]">
      <CardHeader>
        <SectionHeader
          title="Products"
          subtitle="Manage your products efficiently and effectively"
          icon={<Package2 className="h-8 w-8 text-blue-800" />}
        />
      </CardHeader>

      <CardContent className="px-6 flex-1 flex flex-col">
        <ProductsTab
          initialProducts={productsData?.data ?? []}
          initialCategories={categoriesData?.data ?? []}
          onSearchChange={value => setSearch(value || null)}
          onCategoryChange={value => setCategoryId(value || null)}
          onSortChange={(by, order) => {
            setSortBy(by);
            setSortOrder(order);
            setPage('1'); 
          }}
          currentFilters={{
            search: search || '',
            categoryId: categoryId || '',
            sortBy,
            sortOrder,
          }}
        />
        
        <div className="mt-auto border-t pt-4">
          <Pagination
            currentPage={paginationProps.currentPage}
            totalPages={paginationProps.totalPages}
            pageSize={paginationProps.pageSize}
            totalItems={paginationProps.totalItems}
            onPageChange={paginationProps.onPageChange}
            onPageSizeChange={paginationProps.onPageSizeChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
