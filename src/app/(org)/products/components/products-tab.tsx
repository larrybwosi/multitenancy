'use client';

import { Category, Product, ProductVariant } from '@/prisma/client';
import { Download, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { RestockDialog } from './restock';
import { ProductTable } from './products-table';
import { CreateProductModal } from './add-modal';
import { useQueryState } from 'nuqs';

type ProductWithRelations = Product & {
  category: Category | null;
  variants?: ProductVariant[];
  _count?: { stockBatches?: number };
  totalStock: number;
  retailPrice?: number | null;
  wholesalePrice?: number | null;
  buyingPrice?: number | null;
  sellingPrice?: number | null;
  defaultLocation?: { id: string; name: string } | null;
  reorderPoint?: number | null;
};

interface ProductsTabProps {
  initialProducts: ProductWithRelations[];
  initialCategories: Category[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (by: 'name' | 'createdAt' | 'basePrice', order: 'asc' | 'desc') => void;
  currentFilters: {
    search: string;
    categoryId: string;
    sortBy: 'name' | 'createdAt' | 'basePrice';
    sortOrder: 'asc' | 'desc';
  };
}

export default function ProductsTab({
  initialProducts,
  initialCategories,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  currentFilters,
}: ProductsTabProps) {
  const [isRestockOpen, setIsRestockOpen] = useQueryState('restock', {
    defaultValue: false,
    parse: v => v === 'true',
    serialize: v => (v ? 'true' : ''),
  });

  const [selectedProductForRestockId, setSelectedProductForRestockId] = useQueryState('restock-product');

  const selectedProductForRestock = selectedProductForRestockId
    ? initialProducts.find(p => p.id === selectedProductForRestockId)
    : null;


  const handleRestockClick = (product: Product) => {
    const productWithRelations = initialProducts.find(p => p.id === product.id);
    if (productWithRelations) {
      setSelectedProductForRestockId(product.id);
      setIsRestockOpen(true);
    }
  };


  const filterOptions = {
    searchPlaceholder: 'Search products...',
    showSearch: true,
    onSearch: (value: string) => onSearchChange(value),

    showFilterButton: true,
    onFilterButtonClick: () => console.log('Advanced filters clicked'),

    filters: [
      {
        name: 'status',
        label: 'Status',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
        defaultValue: 'all',
        onChange: (value: string) => console.log('Status filter:', value),
      },
      {
        name: 'category',
        label: 'Category',
        options: [
          { value: 'all', label: 'All Categories' },
          ...initialCategories.map(cat => ({
            value: cat.id,
            label: cat.name,
          })),
        ],
        defaultValue: 'all',
        onChange: (value: string) => onCategoryChange(value),
      },
      {
        name: 'stockStatus',
        label: 'Stock Status',
        options: [
          { value: 'all', label: 'All' },
          { value: 'inStock', label: 'In Stock' },
          { value: 'lowStock', label: 'Low Stock' },
          { value: 'outOfStock', label: 'Out of Stock' },
        ],
        defaultValue: 'all',
        onChange: (value: string) => console.log('Stock status filter:', value),
      },
      {
        name: 'priceRange',
        label: 'Price Range',
        options: [
          { value: 'all', label: 'All Prices' },
          { value: '0-50', label: 'Under $50' },
          { value: '50-100', label: '$50 - $100' },
          { value: '100-500', label: '$100 - $500' },
          { value: '500+', label: 'Over $500' },
        ],
        defaultValue: 'all',
        onChange: (value: string) => console.log('Price range filter:', value),
      },
    ],

    sortOptions: [
      { label: 'Name (A-Z)', value: 'name', order: 'asc' },
      { label: 'Name (Z-A)', value: 'name', order: 'desc' },
      { label: 'Price (Low-High)', value: 'basePrice', order: 'asc' },
      { label: 'Price (High-Low)', value: 'basePrice', order: 'desc' },
      { label: 'Newest First', value: 'createdAt', order: 'desc' },
      { label: 'Oldest First', value: 'createdAt', order: 'asc' },
    ],
    onSort: (sortOption: { value: 'name' | 'createdAt' | 'basePrice'; order: 'asc' | 'desc' }) => {
      onSortChange(sortOption.value, sortOption.order);
    },
    currentSort: {
      value: currentFilters.sortBy,
      order: currentFilters.sortOrder,
    },

    exportActions: [
      {
        label: 'Export as CSV',
        icon: <Download className="w-4 h-4 mr-2" />,
        onClick: () => toast.info('Preparing CSV export...'),
      },
      {
        label: 'Export as PDF',
        icon: <FileText className="w-4 h-4 mr-2" />,
        onClick: () => toast.info('Generating PDF report...'),
      },
      {
        label: 'Print List',
        icon: <Printer className="w-4 h-4 mr-2" />,
        onClick: () => {
          toast.info('Preparing print layout...');
          setTimeout(() => window.print(), 1000);
        },
      },
    ],
  };

  return (
    <div className="px-4 py-6 space-y-6 border-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CreateProductModal categories={initialCategories ?? []} />
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <ProductTable
          products={initialProducts}
          onRestock={handleRestockClick}
          filterControlsProps={filterOptions}
          categories={initialCategories}
        />
      </div>

      {selectedProductForRestock && (
        <RestockDialog
          productId={selectedProductForRestock.id}
          open={isRestockOpen}
          onOpenChange={setIsRestockOpen}
          variantId={selectedProductForRestock.variants?.[0]?.id}
          onSuccess={() => {
            toast.success('Restock successful', {
              description: `${selectedProductForRestock.name} has been restocked`,
            });
            setIsRestockOpen(false);
            setSelectedProductForRestockId(null);
          }}
        />
      )}
    </div>
  );
}
