// app/pos/_components/ProductGrid.tsx
'use client';

import { ProductWithCalculatedStock, CategoryInfo } from '../../types'; // Use updated types
import { Search, Package, ImageOff } from 'lucide-react';

// Import Shadcn Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from '@/components/ui/badge';

interface ProductGridProps {
  products: ProductWithCalculatedStock[];
  categories: CategoryInfo[]; // Expect categories with IDs
  activeCategoryId: string; // State holds the ID
  setActiveCategoryId: (categoryId: string) => void; // Setter expects ID
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
  // currentPage,
  // totalPages,
  // onPageChange
}: ProductGridProps) {

  const activeCategoryName = categories.find(c => c.id === activeCategoryId)?.name ?? 'Unknown';

  return (
    <div className="w-2/3 bg-gray-50 flex flex-col h-full border-r">
      {/* Header & Search */}
      <div className="p-4 border-b bg-white">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full rounded-lg bg-background pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Tabs - Use Category IDs */}
      <div className="border-b bg-white px-2">
         <ScrollArea className="w-full whitespace-nowrap">
             <div className="flex space-x-1 py-2">
             {categories.map((category) => (
                 <Button
                    key={category.id} // Use ID as key
                    variant={activeCategoryId === category.id ? 'secondary' : 'ghost'} // Compare with ID
                    size="sm"
                    className="rounded-full px-4"
                    onClick={() => setActiveCategoryId(category.id)} // Set ID on click
                 >
                    {category.name} {/* Display Name */}
                    {/* Optional: Show product count */}
                    {/* {category._count?.products > 0 && ` (${category._count.products})`} */}
                 </Button>
             ))}
             </div>
             <ScrollBar orientation="horizontal" />
         </ScrollArea>
      </div>

      {/* Product Grid - Scrollable */}
      <ScrollArea className="flex-1 p-4">
         {isLoading && (
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                 {Array.from({ length: 12 }).map((_, index) => ( /* More skeletons */
                     <Card key={`skeleton-${index}`} className="animate-pulse">
                         <CardHeader className="p-0 aspect-square bg-muted rounded-t-lg"></CardHeader>
                         <CardContent className="p-2 space-y-1">
                             <div className="h-4 bg-muted rounded w-3/4"></div>
                             <div className="h-4 bg-muted rounded w-1/2"></div>
                         </CardContent>
                     </Card>
                 ))}
             </div>
         )}
        {!isLoading && products.length === 0 && (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <p>No products found matching &apos;{searchQuery}&apos;{activeCategoryId !== 'all' ? ` in category '${activeCategoryName}'` : ''}.</p>
            </div>
        )}
        {!isLoading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onOpenProductDetail(item.id)}
              >
                 <CardHeader className="p-0 border-b aspect-square flex items-center justify-center bg-muted">
                     {item.image ? (
                         <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                     ) : (
                         <Package className="w-12 h-12 text-gray-400" /> /* Use Package icon */
                     )}
                 </CardHeader>
                <CardContent className="p-3 text-sm">
                  <p className="font-medium leading-tight truncate mb-1" title={item.name}>{item.name}</p>
                  <p className="font-semibold text-base">
                    {/* Display parsed string price */}
                    ${parseFloat(item.basePrice || '0').toFixed(2)}
                    {item.variants && item.variants.length > 0 && '+'}
                  </p>
                   {/* Display stock (optional) */}
                   {/* <Badge variant={item.totalStock > 0 ? "outline" : "destructive"} className="mt-1 text-xs">
                      {item.totalStock > 0 ? `${item.totalStock} in stock` : "Out of stock"}
                  </Badge> */}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
         {/* TODO: Add Pagination controls here if implementing */}
         {/* {totalPages && totalPages > 1 && (...)} */}
        <ScrollBar />
      </ScrollArea>
    </div>
  );
}