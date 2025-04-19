'use client';

import { useState } from 'react';
import { ProductWithCalculatedStock, CategoryInfo } from '../types';
import { Search, Package, ImageOff, ShoppingBag, ChevronRight, Filter, X } from 'lucide-react';

// Import Shadcn Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from 'next/image';

interface ProductGridProps {
  products: ProductWithCalculatedStock[];
  categories: CategoryInfo[];
  activeCategoryId: string;
  setActiveCategoryId: (categoryId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenProductDetail: (productId: string) => void;
  isLoading: boolean;
  // Add pagination props if needed
  // currentPage?: number;
  // totalPages?: number;
  // onPageChange?: (page: number) => void;
}

export default function ProductGrid({
  products,
  categories,
  activeCategoryId,
  setActiveCategoryId,
  searchQuery,
  setSearchQuery,
  onOpenProductDetail,
  isLoading,
}: ProductGridProps) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const activeCategoryName = categories.find(c => c.id === activeCategoryId)?.name ?? 'All Products';

  // Get first image from imageUrls array or fallback to image property
  const getProductImage = (product: ProductWithCalculatedStock) => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls[0];
    }
    return product.image || null;
  };

  return (
    <div className="w-full md:w-2/3 bg-gray-50 flex flex-col h-full border-r">
      {/* Header with Search and Filter Button */}
      <div className="p-4 border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{activeCategoryName}</h2>
          
          <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[80%]">
              <div className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Categories</h3>
                <div className="flex flex-col space-y-1">
                  <Button
                    variant={activeCategoryId === 'all' ? 'secondary' : 'ghost'}
                    className="justify-start"
                    onClick={() => {
                      setActiveCategoryId('all');
                      setIsMobileFilterOpen(false);
                    }}
                  >
                    All Products
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={activeCategoryId === category.id ? 'secondary' : 'ghost'}
                      className="justify-start"
                      onClick={() => {
                        setActiveCategoryId(category.id);
                        setIsMobileFilterOpen(false);
                      }}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full rounded-lg bg-background pl-8 pr-4 border-muted-foreground/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-2 h-5 w-5 text-muted-foreground"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Category Tabs - Desktop Only */}
      <div className="border-b bg-white px-2 hidden md:block">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-1 py-2">
            <Button
              key="all-categories"
              variant={activeCategoryId === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-full px-4"
              onClick={() => setActiveCategoryId('all')}
            >
              All Products
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategoryId === category.id ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-full px-4"
                onClick={() => setActiveCategoryId(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Product Results Count */}
      <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/30">
        {!isLoading && (
          <span>
            Showing {products.length} {products.length === 1 ? 'product' : 'products'}
            {searchQuery && ` for "${searchQuery}"`}
            {activeCategoryId !== 'all' && ` in ${activeCategoryName}`}
          </span>
        )}
      </div>

      {/* Product Grid - Scrollable */}
      <ScrollArea className="flex-1 p-4">
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={`skeleton-${index}`} className="overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                  <div className="h-5 bg-muted rounded w-1/2 animate-pulse"></div>
                  <div className="h-6 bg-muted rounded w-1/3 animate-pulse mt-2"></div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {!isLoading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mb-2 text-muted" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">
              {searchQuery ? `No results for "${searchQuery}"` : ''}
              {activeCategoryId !== 'all' ? ` in ${activeCategoryName}` : ''}
            </p>
            {(searchQuery || activeCategoryId !== 'all') && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategoryId('all');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
        
        {!isLoading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const productImage = getProductImage(product);
              const hasVariants = product.variants && product.variants.length > 0;
              const basePrice = parseFloat(product.basePrice || '0');
              const minPrice = basePrice;
              const maxPrice = hasVariants ? 
                basePrice + Math.max(...product.variants.map(v => parseFloat(v.priceModifier || '0'))) : 
                basePrice;
              
              return (
                <Card
                  key={product.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 border border-muted-foreground/10 group"
                  onClick={() => onOpenProductDetail(product.id)}
                >
                  <div className="relative">
                    {/* Badge for out of stock or low stock */}
                    {product.totalStock <= 0 && (
                      <Badge variant="destructive" className="absolute top-2 right-2 z-10">
                        Out of stock
                      </Badge>
                    )}
                    {product.totalStock > 0 && product.totalStock <= 5 && (
                      <Badge variant="secondary" className="absolute top-2 right-2 z-10">
                        Low stock
                      </Badge>
                    )}
                    
                    {/* Product image */}
                    <div className="aspect-square bg-muted overflow-hidden">
                      {productImage ? (
                        <Image 
                          src={productImage} 
                          alt={product.name} 
                          width={300}
                          height={300}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageOff className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    
                    {/* Quick view button that appears on hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button variant="secondary" size="sm" className="font-medium">
                        Quick View
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-3">
                    {/* Category tag if available */}
                    {product.category && (
                      <div className="mb-1">
                        <Badge variant="outline" className="text-xs font-normal bg-muted/50">
                          {product.category.name}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Product name */}
                    <p className="font-medium text-sm leading-tight line-clamp-2 h-10" title={product.name}>
                      {product.name}
                    </p>
                    
                    {/* Price display */}
                    <div className="mt-2 flex items-baseline space-x-1">
                      {minPrice === maxPrice ? (
                        <p className="font-semibold text-base">${minPrice.toFixed(2)}</p>
                      ) : (
                        <p className="font-semibold text-base">${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}</p>
                      )}
                      
                      {hasVariants && (
                        <span className="text-xs text-muted-foreground">
                          ({product.variants.length} options)
                        </span>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-0">
                    <Button 
                      variant="ghost" 
                      className="w-full rounded-none h-9 text-xs font-medium text-primary flex items-center justify-center"
                    >
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
        <ScrollBar />
      </ScrollArea>
    </div>
  );
}