import { useState } from 'react';
import { Edit, Package, Trash2, MoreHorizontal, Grid, List, Plus, Info, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { FilterControls, FilterControlsProps } from '@/components/file-controls';
import { Pagination, PaginationProps } from '@/components/pagination';
import ProductModal from './product-details-modal';
import { useDeleteProduct } from '@/lib/hooks/use-products';
import { Product, ProductVariant, Supplier, Category } from '@prisma/client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EditProductDialog } from './edit-product-dialog';

interface ProductWithDetails extends Product {
  category: Category | null;
  variants?: ProductVariant[];
  _count?: { stockBatches?: number };
  totalStock: number;
  retailPrice?: number | null;
  wholesalePrice?: number | null;
  buyingPrice?: number | null;
  sellingPrice?: number | null;
  supplier?: Supplier;
  defaultLocation?: { id: string; name: string } | null;
  reorderPoint?: number | null;
}

interface ProductTableProps {
  products: ProductWithDetails[];
  paginationProps: PaginationProps;
  onRestock: (product: Product) => void;
  filterControlsProps: FilterControlsProps;
  categories: Category[];
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  paginationProps,
  onRestock,
  filterControlsProps,
  categories,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductWithDetails | null>(null);
  
  const { mutateAsync: deleteProduct, isPending: deletingProduct } = useDeleteProduct();

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (product: ProductWithDetails) => {
    setProductToEdit(product);
    setEditDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setProductToEdit(null);
  };

  const handleEditError = () => {
    // Error is handled by the toast in the hook
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">
        Inactive
      </Badge>
    );
  };

  const enhancedFilterProps = {
    searchPlaceholder: 'Search products...',
    showSearch: true,
    showFilterButton: true,
    ...filterControlsProps,
    exportActions: [
      ...(filterControlsProps.exportActions || []),
      {
        label: viewMode === 'list' ? 'Grid View' : 'List View',
        icon: viewMode === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />,
        onClick: () => setViewMode(viewMode === 'list' ? 'grid' : 'list'),
      },
    ],
  };

  const ProductRow: React.FC<{ product: ProductWithDetails }> = ({ product }) => (
    <TableRow className="hover:bg-gray-50 transition-colors duration-150">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-md cursor-pointer" onClick={() => setSelectedProduct(product)}>
            {product.imageUrls.length > 0 ? (
              <AvatarImage src={product.imageUrls[0]} alt={product.name} className="object-cover" />
            ) : (
              <AvatarFallback className="rounded-md bg-gray-100">
                <Package className="h-5 w-5 text-gray-500" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{product.name}</div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 hover:text-blue-800 p-0 h-6 flex items-center mt-1"
              onClick={() => setSelectedProduct(product)}
            >
              <Info className="h-3 w-3 mr-1" /> View details
            </Button>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-500">{product.sku}</TableCell>
      <TableCell className="text-sm text-gray-500">{product.category?.name}</TableCell>
      <TableCell className="text-sm font-medium text-gray-900">
        $
        {typeof product.retailPrice === 'string'
          ? parseFloat(product.retailPrice).toFixed(2)
          : product.retailPrice?.toFixed(2)}
      </TableCell>
      <TableCell className="text-sm text-gray-500">{product.totalStock || 0}</TableCell>
      <TableCell className="text-sm text-gray-500">{product.reorderPoint|| 0}</TableCell>
      <TableCell>{getStatusBadge(product.isActive)}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditClick(product)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit Product</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRestock(product)}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Restock Inventory</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteClick(product)}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Product</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  const ProductCard: React.FC<{ product: ProductWithDetails }> = ({ product }) => (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
      <div
        className="h-48 w-full bg-gray-100 relative cursor-pointer group"
        onClick={() => setSelectedProduct(product)}
      >
        {product.imageUrls.length > 0 ? (
          <Image
            src={product.imageUrls[0]}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 truncate">{product.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditClick(product)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Product</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRestock(product)}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Restock Inventory</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteClick(product)}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Product</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="mt-2 flex items-center gap-2">
          {getStatusBadge(product.isActive)}
          <Badge variant="outline" className="text-xs text-gray-500">
            {product?.category?.name}
          </Badge>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">
            $
            {typeof product.retailPrice === 'string'
              ? parseFloat(product.retailPrice).toFixed(2)
              : product?.retailPrice?.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">SKU: {product.sku}</div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="mt-2 grid grid-cols-2 gap-2 w-full">
          <div className="text-sm bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Stock: </span>
            <span className="font-medium">{product.totalStock}</span>
          </div>
          <div className="text-sm bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Reorder: </span>
            <span className="font-medium">{product.reorderPoint}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="w-full">
      <FilterControls {...enhancedFilterProps} />

      {viewMode === 'list' ? (
        <div className="mt-4 rounded-lg shadow overflow-hidden ">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Reorder Point</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(product => (
                <ProductRow key={product.id} product={product} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="mt-auto pt-4">
        <Pagination
          currentPage={paginationProps.currentPage}
          totalPages={paginationProps.totalPages}
          pageSize={paginationProps.pageSize}
          totalItems={paginationProps.totalItems}
          onPageChange={paginationProps.onPageChange}
          onPageSizeChange={paginationProps.onPageSizeChange}
        />
      </div>

      {selectedProduct && <ProductModal open product={selectedProduct} onClose={() => setSelectedProduct(null)} />}

      {/* Edit Product Dialog */}
      {productToEdit && categories && (
        <EditProductDialog
          isOpen={editDialogOpen}
          setIsOpen={setEditDialogOpen}
          product={productToEdit}
          categories={categories}
          onSuccess={handleEditSuccess}
          onError={handleEditError}
          onClose={() => setProductToEdit(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {productToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deletingProduct}>
              {deletingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
