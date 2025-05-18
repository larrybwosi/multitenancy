'use client';

import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
} from '@/components/ui/card';
import { 
  AlertCircle, 
  Box, 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductDetail } from '@/lib/hooks/use-product-detail';
import Link from 'next/link';
import ProductDetailComponent from './components/client-page';
import { useLocations } from '@/hooks/use-warehouse';
import { useSuppliers } from '@/lib/hooks/use-supplier';
import { use } from 'react';


type Params = Promise<{ id: string }>;

export default function ProductDetailPage(props: { params: Params; }) {

  const params = use(props.params)
  const productId = typeof params?.id === 'string' ? params.id : '';

  // Fetch product data with the custom hook
  const { data, isLoading, isError, error } = useProductDetail({ id: productId });
  const { data: locations, isLoading: loadingLocations } = useLocations();
  const { data: suppliers, isLoading: loadingSuppliers } = useSuppliers();
  // State for modals
  // Loading state
  if (isLoading || loadingLocations || loadingSuppliers) {
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
          <Link href="/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

  const { product } = data || { product: null };

  if (!product) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[50vh] px-4 py-6">
        <Box className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <p className="text-muted-foreground text-center mt-2">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild className="mt-4">
          <Link href="/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <ProductDetailComponent
      product={product}
      locations={locations?.warehouses ?? []}
      suppliers={suppliers?.data.suppliers}
    />
  );
}
