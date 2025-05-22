import { useEffect, useState } from 'react';
import { Edit, Package, Trash2, MoreHorizontal, Grid, List, Plus, Info, Loader2, Settings } from 'lucide-react';
import Image from 'next/image';
import { FilterControls, FilterControlsProps } from '@/components/file-controls';
import ProductModal from './product-details-modal';
import { useDeleteProduct } from '@/lib/hooks/use-products';
import { Product, ProductVariant, Supplier, Category } from '@/prisma/client';

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
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

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
  onRestock: (product: Product) => void;
  filterControlsProps: FilterControlsProps;
  categories: Category[];
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
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
  const router = useRouter()
  
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
        {formatCurrency(product?.retailPrice?.toString()|| '0')}
      </TableCell>
      <TableCell className="text-sm text-gray-500">{product.totalStock || 0}</TableCell>
      <TableCell className="text-sm text-gray-500">{product.reorderPoint || 0}</TableCell>
      <TableCell>{getStatusBadge(product.isActive)}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`products/${product.id}`)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Product Config</span>
            </DropdownMenuItem>
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
  
  // Define the ProductWithDetails type
  interface ProductWithDetails {
    id: string;
    name: string;
    sku: string | null;
    imageUrls: string[];
    isActive: boolean;
    retailPrice: number | null;
    totalStock: number;
    reorderPoint: number;
    category?: { name: string } | null;
  }

  // Utility function to format currency (example implementation)
  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  // // Utility function to get status badge (example implementation)
  // const getStatusBadge = (isActive: boolean) => (
  //   <Badge variant={isActive ? 'default' : 'destructive'} className={isActive ? 'bg-green-500' : 'bg-red-500'}>
  //     {isActive ? 'Active' : 'Inactive'}
  //   </Badge>
  // );

  interface ProductCardProps {
    product: ProductWithDetails;
    setSelectedProduct: (product: ProductWithDetails) => void;
    handleEditClick: (product: ProductWithDetails) => void;
    onRestock: (product: ProductWithDetails) => void;
    handleDeleteClick: (product: ProductWithDetails) => void;
  }

  const ProductCard: React.FC<ProductCardProps> = ({
    product,
    setSelectedProduct,
    handleEditClick,
    onRestock,
    handleDeleteClick,
  }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const router = useRouter();

    // Auto-change images if there are multiple
    useEffect(() => {
      if (product.imageUrls.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndex(prev => (prev + 1) % product.imageUrls.length);
        }, 3000); // Change every 3 seconds

        return () => clearInterval(interval);
      }
    }, [product.imageUrls.length]);

    // Handle clicking on an image indicator
    const handleIndicatorClick = (index: number) => {
      setCurrentImageIndex(index);
    };

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-white">
        <div
          className="h-40 w-full bg-gradient-to-br from-gray-50 to-gray-100 relative cursor-pointer group"
          onClick={() => setSelectedProduct(product)}
        >
          {product.imageUrls.length > 0 ? (
            <>
              <Image
                src={product.imageUrls[currentImageIndex]}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-t-md"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={currentImageIndex === 0} // Optimize loading for the first image
              />
              {/* Image indicators */}
              {product.imageUrls.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {product.imageUrls.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleIndicatorClick(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-10 w-10 text-gray-300" />
            </div>
          )}
          {/* Status indicator overlay */}
          <div className="absolute top-2 left-2">{getStatusBadge(product.isActive)}</div>
          {/* Category badge overlay */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs bg-white/90 text-gray-700 border-0">
              {product.category?.name ?? 'No Category'}
            </Badge>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {/* Header with title and menu */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900 truncate leading-tight">{product.name}</h3>
              <div className="text-xs text-gray-500 mt-0.5">SKU: {product.sku ?? 'N/A'}</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/products/${product.id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Product Config</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditClick(product)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Edit Product</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRestock(product)}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Restock Inventory</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => handleDeleteClick(product)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Product</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(product.retailPrice?.toString() ?? '0')}
            </div>
          </div>

          {/* Stock information */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="text-xs text-gray-500 mb-0.5">Stock</div>
              <div className="text-sm font-semibold text-gray-900">{product.totalStock}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded-md">
              <div className="text-xs text-gray-500 mb-0.5">Reorder</div>
              <div className="text-sm font-semibold text-gray-900">{product.reorderPoint}</div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

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
