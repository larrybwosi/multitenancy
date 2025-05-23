'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductCard } from './ProductCard';
import { Search, ShoppingBag, Plus, PackageOpen, X, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ExtendedProduct } from '../types';
import { MotionDiv } from '@/components/motion';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AnimatePresence } from 'framer-motion';

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
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'name' | 'price-low' | 'price-high'>('name');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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

    // Sort products
    return [...result].sort((a, b) => {
      switch (sortOrder) {
        case 'price-low':
          return parseFloat(a.sellingPrice.toString()) - parseFloat(b.sellingPrice.toString());
        case 'price-high':
          return parseFloat(b.sellingPrice.toString()) - parseFloat(a.sellingPrice.toString());
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [products, searchTerm, selectedCategory, sortOrder]);

  // Check if screen size is small
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navigateToAddProduct = () => {
    router.push('/products?modal=true');
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const totalResults = filteredProducts.length;

  const toggleShowFilters = () => {
    setShowFilters(prev => !prev);
  };

  const toggleMobileFilters = () => {
    setMobileFiltersOpen(prev => !prev);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl  overflow-hidden border border-gray-200 dark:border-neutral-800">
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="p-4 md:p-5">
          <div className="flex flex-wrap gap-4">
            <div className={`relative flex-1 min-w-[200px] transition-all duration-200 ${isSearchFocused ? 'ring-2 ring-blue-500/20 dark:ring-blue-500/30 rounded-xl' : ''}`}>
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${isSearchFocused ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
              />
              <Input
                type="text"
                placeholder="Search products by name, SKU or barcode..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="pl-10 w-full bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 rounded-xl h-12 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full flex items-center justify-center bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            {/* Small screen filter toggle */}
            {isSmallScreen && (
              <button
                onClick={toggleMobileFilters}
                className="flex items-center justify-center h-12 px-4 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-xl text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 transition-colors"
              >
                <Filter className="h-5 w-5 mr-2" />
                <span>Filters</span>
              </button>
            )}
            
            {/* Desktop actions */}
            {!isSmallScreen && (
              <>
                <Button
                  onClick={toggleShowFilters}
                  variant="outline"
                  className="h-12 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl"
                >
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  Filters
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl"
                    >
                      Sort By <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      onClick={() => setSortOrder('name')}
                      className={sortOrder === 'name' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}
                    >
                      Name (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSortOrder('price-low')}
                      className={sortOrder === 'price-low' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}
                    >
                      Price (Low to High)
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSortOrder('price-high')}
                      className={sortOrder === 'price-high' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}
                    >
                      Price (High to Low)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  onClick={navigateToAddProduct}
                  className="h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-xl "
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Product
                </Button>
              </>
            )}
          </div>
        </div>
          
        {/* Mobile filters panel */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden px-4 pb-4 border-t border-gray-200 dark:border-neutral-800"
            >
              <div className="flex flex-col space-y-4 pt-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge
                      variant={selectedCategory === null ? 'default' : 'outline'}
                      className={`cursor-pointer hover:bg-blue-600 transition-colors rounded-full ${
                        selectedCategory === null 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:text-white'
                      }`}
                      onClick={() => setSelectedCategory(null)}
                    >
                      All Products
                    </Badge>
                    {categories.map(category => (
                      <Badge
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        className={`cursor-pointer hover:bg-blue-600 transition-colors rounded-full ${
                          selectedCategory === category 
                            ? 'bg-blue-600 text-white' 
                            : 'hover:text-white'
                        }`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={sortOrder === 'name' ? 'default' : 'outline'}
                      className={`cursor-pointer hover:bg-blue-600 transition-colors rounded-full ${
                        sortOrder === 'name' 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:text-white'
                      }`}
                      onClick={() => setSortOrder('name')}
                    >
                      Name (A-Z)
                    </Badge>
                    <Badge
                      variant={sortOrder === 'price-low' ? 'default' : 'outline'}
                      className={`cursor-pointer hover:bg-blue-600 transition-colors rounded-full ${
                        sortOrder === 'price-low' 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:text-white'
                      }`}
                      onClick={() => setSortOrder('price-low')}
                    >
                      Price (Low to High)
                    </Badge>
                    <Badge
                      variant={sortOrder === 'price-high' ? 'default' : 'outline'}
                      className={`cursor-pointer hover:bg-blue-600 transition-colors rounded-full ${
                        sortOrder === 'price-high' 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:text-white'
                      }`}
                      onClick={() => setSortOrder('price-high')}
                    >
                      Price (High to Low)
                    </Badge>
                  </div>
                </div>
                
                <Button
                  onClick={navigateToAddProduct}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-xl "
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Product
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Desktop filters panel */}
        <AnimatePresence>
          {showFilters && !isSmallScreen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden px-5 pb-5 border-t border-gray-200 dark:border-neutral-800"
            >
              <div className="pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    className={`cursor-pointer hover:bg-blue-600 transition-colors rounded-full ${
                      selectedCategory === null 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:text-white'
                    }`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    All Products
                  </Badge>
                  {categories.map(category => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      className={`cursor-pointer hover:bg-blue-600 transition-colors rounded-full ${
                        selectedCategory === category 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:text-white'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Results count */}
        {products.length > 0 && (
          <div className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-neutral-800">
            Showing {totalResults} {totalResults === 1 ? 'product' : 'products'}
            {searchTerm && ` matching "${searchTerm}"`}
            {selectedCategory && ` in ${selectedCategory}`}
          </div>
        )}
      </div>

      {/* Product Grid Area */}
      <ScrollArea className="flex-grow">
        {products.length === 0 ? (
          <EmptyProductState onAddProduct={navigateToAddProduct} />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 p-5">
            {filteredProducts.map((product, index) => (
              <MotionDiv
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
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
      <div className="bg-blue-100 dark:bg-blue-900/30 p-8 rounded-full mb-6 ">
        <ShoppingBag size={64} className="text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-2xl font-bold mb-2 text-center text-gray-800 dark:text-gray-100">Your Product Catalog Is Empty</h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
        Start building your inventory by adding your first product. It only takes a minute to get started.
      </p>
      <Button
        onClick={onAddProduct}
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl  hover: transition-all dark:bg-blue-700 dark:hover:bg-blue-800 h-12 px-6"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Your First Product
      </Button>
    </div>
  );
}

function EmptySearchState({ clearSearch }: { clearSearch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6">
      <div className="bg-gray-100 dark:bg-neutral-800 p-8 rounded-full mb-6">
        <PackageOpen size={48} className="text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-bold mb-2 text-center text-gray-800 dark:text-gray-100">No Products Found</h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        We couldn&apos;t find any products matching your current search or filters. Try adjusting your criteria.
      </p>
      <Button
        variant="outline"
        onClick={clearSearch}
        className="rounded-xl border-blue-200 dark:border-blue-900/30 hover:border-blue-600 dark:hover:border-blue-700 text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 h-11 px-6"
      >
        Clear Search
      </Button>
    </div>
  );
}
