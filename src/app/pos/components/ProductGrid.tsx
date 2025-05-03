'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductCard } from './ProductCard';
import { Search, ShoppingBag, Plus, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ExtendedProduct } from '../types';
import { MotionDiv } from '@/components/motion';

export function ProductGrid({
  products = [],
  onAddToCart,
  getProductUrl,
}: {
  products: ExtendedProduct[];
  onAddToCart: (productId: string) => void;
  getProductUrl?: (product: ExtendedProduct) => string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return products.filter(
      p =>
        p.name.toLowerCase().includes(lowerCaseSearch) ||
        p.sku.toLowerCase().includes(lowerCaseSearch) ||
        p.barcode?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [products, searchTerm]);

  const navigateToAddProduct = () => {
    router.push('/products/add');
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border dark:border-neutral-800 shadow-sm overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-border dark:border-neutral-800 sticky top-0 bg-background z-10">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products by name, SKU, barcode..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-background/50 focus-visible:ring-primary"
            />
          </div>
          <Button onClick={navigateToAddProduct} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Product Grid Area */}
      <ScrollArea className="flex-grow">
        {products.length === 0 ? (
          <EmptyProductState onAddProduct={navigateToAddProduct} />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
            {filteredProducts.map(product => (
              <MotionDiv
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard 
                  product={product} 
                  onAddToCart={onAddToCart}
                  productUrl={getProductUrl ? getProductUrl(product) : undefined}
                />
              </MotionDiv>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-muted-foreground p-6">
            <PackageOpen size={48} className="mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No products found</p>
            <p className="text-sm text-center max-w-md mb-6">
              We couldn&apos;t find any products matching your search criteria. Try adjusting your search terms.
            </p>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Clear Search
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function EmptyProductState({ onAddProduct }: { onAddProduct: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6">
      <div className="bg-primary/5 p-6 rounded-full mb-6">
        <ShoppingBag size={64} className="text-primary" />
      </div>
      <h3 className="text-2xl font-bold mb-2">No products yet</h3>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        You haven&apos;t added any products to your inventory. Add your first product to get started.
      </p>
      <Button onClick={onAddProduct} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
        <Plus className="h-5 w-5 mr-2" />
        Add Your First Product
      </Button>
    </div>
  );
}
