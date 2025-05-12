'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { 
  AlertCircle, 
  Box, 
  PackageOpen, 
  Plus, 
  ShoppingCart, 
  Truck, 
  Store, 
  Tag
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useProductDetail } from '@/lib/hooks/use-product-detail';
import ProductVariantsList from './components/product-variants-list';
import ProductSuppliersList from './components/product-suppliers-list';
import AddEditVariantModal from './components/add-edit-variant-modal';
import AddEditSupplierModal from './components/add-edit-supplier-modal';
import Image from 'next/image';

// Helper function to format currency
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numAmount);
};

// Define types for our data
interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  buyingPrice: number | string;
  retailPrice?: number | string | null;
  wholesalePrice?: number | string | null;
  isActive: boolean;
  reorderPoint: number;
  reorderQty: number;
  lowStockAlert: boolean;
  attributes?: any;
  variantStocks?: any[];
  suppliers?: any[];
}

interface ProductSupplier {
  id: string;
  supplierId: string;
  supplierSku?: string | null;
  costPrice: number | string;
  minimumOrderQuantity?: number | null;
  packagingUnit?: string | null;
  isPreferred: boolean;
  supplier: {
    id: string;
    name: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = typeof params?.id === 'string' ? params.id : '';

  // Fetch product data with the custom hook
  const { data, isLoading, isError, error } = useProductDetail({ id: productId });

  // State for modals
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantToEdit, setVariantToEdit] = useState<ProductVariant | null>(null);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<ProductSupplier | null>(null);

  // Handlers for variant actions
  const handleAddVariant = () => {
    setVariantToEdit(null);
    setVariantModalOpen(true);
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setVariantToEdit(variant);
    setVariantModalOpen(true);
  };

  // Handlers for supplier actions
  const handleAddSupplier = () => {
    setSupplierToEdit(null);
    setSupplierModalOpen(true);
  };

  const handleEditSupplier = (supplier: ProductSupplier) => {
    setSupplierToEdit(supplier);
    setSupplierModalOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container px-4 py-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-64" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[50vh] px-4 py-6">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Error Loading Product</h1>
        <p className="text-muted-foreground text-center mt-2">
          {error?.message || 'Failed to load product details. Please try again later.'}
        </p>
        <Button asChild className="mt-4">
          <a href="/products">Back to Products</a>
        </Button>
      </div>
    );
  }

  const { product, locations, suppliers } = data || { product: null, locations: [], suppliers: [] };

  if (!product) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[50vh] px-4 py-6">
        <Box className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <p className="text-muted-foreground text-center mt-2">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild className="mt-4">
          <a href="/products">Back to Products</a>
        </Button>
      </div>
    );
  }

  // Compute stock levels and status
  const totalStock = product.variants.reduce((acc, variant) => 
    acc + variant.variantStocks.reduce((sum, stock) => sum + (stock.currentStock || 0), 0), 0);
  
  const hasLowStock = product.variants.some(variant => 
    variant.lowStockAlert && 
    variant.variantStocks.some(stock => (stock.currentStock || 0) <= variant.reorderPoint)
  );

  return (
    <div className="container px-4 py-6 space-y-6 pb-20">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products">Products</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{product.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Product Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={product.isActive ? "default" : "secondary"}>
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
            {product.category && (
              <Badge variant="outline" className="border-primary/20 text-primary">
                {product.category.name}
              </Badge>
            )}
            {hasLowStock && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Low Stock
              </Badge>
            )}
          </div>
        </div>
        <Button asChild>
          <a href={`/products/${productId}/edit`}>Edit Product</a>
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5">
          <CardContent className="flex items-center gap-4 pt-6">
            <Tag className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium">SKU</p>
              <p className="text-2xl font-bold">{product.sku || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5">
          <CardContent className="flex items-center gap-4 pt-6">
            <Store className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium">Total Stock</p>
              <p className="text-2xl font-bold">{totalStock}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5">
          <CardContent className="flex items-center gap-4 pt-6">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium">Variants</p>
              <p className="text-2xl font-bold">{product.variants.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5">
          <CardContent className="flex items-center gap-4 pt-6">
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium">Suppliers</p>
              <p className="text-2xl font-bold">
                {new Set(product.variants.flatMap(v => v.suppliers.map(s => s.supplierId))).size}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Basic information about this product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="aspect-square md:aspect-[4/3] overflow-hidden rounded-lg bg-muted relative">
                  {product.imageUrl ? (
                    <Image 
                      src={product.imageUrl} 
                      alt={product.name} 
                      fill
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PackageOpen className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
                    <p className="mt-1">{product.description ||'No description provided.'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Barcode</h3>
                      <p className="mt-1">{product.barcode || 'None'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Default Location</h3>
                      <p className="mt-1">{product.defaultLocation?.name || 'None'}</p>
                    </div>
                  </div>
                  
                  {product.variants.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground">Price Range</h3>
                        <p className="mt-1 font-semibold">
                          {(() => {
                            const prices = product.variants
                              .map(v => v.retailPrice)
                              .filter(p => p !== null && p !== undefined);
                            if (prices.length === 0) return 'Not set';
                            
                            const min = Math.min(...prices);
                            const max = Math.max(...prices);
                            
                            return min === max 
                              ? formatCurrency(min) 
                              : `${formatCurrency(min)} - ${formatCurrency(max)}`;
                          })()}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground">Cost Range</h3>
                        <p className="mt-1 font-semibold">
                          {(() => {
                            const prices = product.variants
                              .map(v => v.buyingPrice)
                              .filter(p => p !== null && p !== undefined);
                            if (prices.length === 0) return 'Not set';
                            
                            const min = Math.min(...prices);
                            const max = Math.max(...prices);
                            
                            return min === max 
                              ? formatCurrency(min) 
                              : `${formatCurrency(min)} - ${formatCurrency(max)}`;
                          })()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Product Variants</h2>
            <Button onClick={handleAddVariant}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0 pt-6">
              <ProductVariantsList 
                variants={product.variants} 
                onEdit={handleEditVariant}
                productId={productId}
              />
            </CardContent>
          </Card>
          
          <AddEditVariantModal
            open={variantModalOpen}
            onOpenChange={setVariantModalOpen}
            variant={variantToEdit}
            productId={productId}
          />
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Suppliers</h2>
            <Button onClick={handleAddSupplier}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0 pt-6">
              <ProductSuppliersList 
                variants={product.variants}
                allSuppliers={suppliers}
                onEdit={handleEditSupplier}
                productId={productId}
              />
            </CardContent>
          </Card>
          
          <AddEditSupplierModal
            open={supplierModalOpen}
            onOpenChange={setSupplierModalOpen}
            productSupplier={supplierToEdit}
            productId={productId}
            variants={product.variants}
            suppliers={suppliers}
          />
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Inventory By Location</h2>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {locations.length === 0 ? (
                  <div className="text-center py-8">
                    <Store className="mx-auto h-10 w-10 text-muted-foreground/50 mb-4" />
                    <h3 className="font-medium text-lg">No Locations Available</h3>
                    <p className="text-muted-foreground mt-1">
                      Add inventory locations to track stock across your business.
                    </p>
                  </div>
                ) : (
                  locations.map(location => (
                    <div key={location.id} className="border rounded-lg p-4">
                      <h3 className="font-medium text-lg mb-3">{location.name}</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-2">Variant</th>
                              <th className="text-center py-2 px-2">Current Stock</th>
                              <th className="text-center py-2 px-2">Reorder Point</th>
                              <th className="text-center py-2 px-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.variants.map(variant => {
                              const stockRecord = variant.variantStocks.find(
                                stock => stock.location.id === location.id
                              ) || { currentStock: 0 };
                              
                              const stockLevel = stockRecord.currentStock || 0;
                              const isLowStock = variant.lowStockAlert && stockLevel <= variant.reorderPoint;
                              
                              return (
                                <tr key={variant.id} className="border-b last:border-0">
                                  <td className="py-2 px-2 font-medium">{variant.name}</td>
                                  <td className="py-2 px-2 text-center">{stockLevel}</td>
                                  <td className="py-2 px-2 text-center">{variant.reorderPoint}</td>
                                  <td className="py-2 px-2 text-center">
                                    <Badge variant={
                                      isLowStock 
                                        ? "destructive" 
                                        : stockLevel > 0 
                                          ? "default" 
                                          : "secondary"
                                    }>
                                      {isLowStock 
                                        ? "Low Stock" 
                                        : stockLevel > 0 
                                          ? "In Stock" 
                                          : "Out of Stock"}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
