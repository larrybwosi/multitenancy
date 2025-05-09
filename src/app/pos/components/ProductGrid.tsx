'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductCard } from './ProductCard';
import { Search, ShoppingBag, Plus, PackageOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ExtendedProduct } from '../types';
import { MotionDiv } from '@/components/motion';
import { Badge } from '@/components/ui/badge';

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();

  const categories = useMemo(() => {
    const allCategories = products.map(p => p.category.name).filter(Boolean);
    return [...new Set(allCategories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by category if selected
    if (selectedCategory) {
      result = result.filter(p => p.category.name === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(lowerCaseSearch) ||
          p.sku.toLowerCase().includes(lowerCaseSearch) ||
          p.barcode?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    return result;
  }, [products, searchTerm, selectedCategory]);

  const navigateToAddProduct = () => {
    router.push('/products/add');
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const totalResults = filteredProducts.length;

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border border-border/40 dark:border-neutral-800/60 shadow-lg overflow-hidden">
      {/* Search Header */}
      <div className="p-5 border-b border-border/40 dark:border-neutral-800/60 sticky top-0 bg-background/95 backdrop-blur-md z-10 transition-all duration-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`relative flex-1 transition-all duration-200 ${isSearchFocused ? 'ring-2 ring-primary/20 rounded-lg' : ''}`}
            >
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isSearchFocused ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <Input
                type="text"
                placeholder="Search products by name, SKU, barcode..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="pl-10 w-full bg-background/50 focus-visible:ring-primary border-border/60 rounded-lg h-11"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <Button
              onClick={navigateToAddProduct}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Category filters */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <Badge
                variant={selectedCategory === null ? 'default' : 'outline'}
                className={`cursor-pointer hover:bg-primary/90 transition-colors ${selectedCategory === null ? 'bg-primary text-primary-foreground' : 'hover:text-primary-foreground'}`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Badge>
              {categories.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className={`cursor-pointer hover:bg-primary/90 transition-colors ${selectedCategory === category ? 'bg-primary text-primary-foreground' : 'hover:text-primary-foreground'}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          )}

          {/* Results count */}
          {products.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {totalResults} {totalResults === 1 ? 'product' : 'products'}
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedCategory && ` in ${selectedCategory}`}
            </div>
          )}
        </div>
      </div>

      {/* Product Grid Area */}
      <ScrollArea className="flex-grow">
        {products.length === 0 ? (
          <EmptyProductState onAddProduct={navigateToAddProduct} />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
            {filteredProducts.map((product, index) => (
              <MotionDiv
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
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
          <EmptySearchState clearSearch={clearSearch} />
        )}
      </ScrollArea>
    </div>
  );
}

function EmptyProductState({ onAddProduct }: { onAddProduct: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6">
      <div className="bg-primary/10 p-8 rounded-full mb-6 shadow-inner">
        <ShoppingBag size={64} className="text-primary" />
      </div>
      <h3 className="text-2xl font-bold mb-2 text-center">Your Product Catalog Is Empty</h3>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Start building your inventory by adding your first product. It only takes a minute to get started.
      </p>
      <Button
        onClick={onAddProduct}
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Your First Product
      </Button>
    </div>
  );
}

function EmptySearchState({ clearSearch }: { clearSearch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-muted-foreground p-6">
      <div className="bg-muted/50 p-6 rounded-full mb-6">
        <PackageOpen size={48} className="text-muted-foreground" />
      </div>
      <p className="text-lg font-medium mb-2 text-foreground">No matching products found</p>
      <p className="text-sm text-center max-w-md mb-6">
        We couldn&apos;t find any products matching your current filters. Try adjusting your search criteria or
        categories.
      </p>
      <Button
        variant="outline"
        onClick={clearSearch}
        className="rounded-lg border-primary/30 hover:border-primary text-primary hover:text-primary-foreground hover:bg-primary transition-all duration-200"
      >
        Clear Search
      </Button>
    </div>
  );
}
