"use client";

import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartItem, MockCategory, MockProduct } from "../lib/mock-data";
import SearchBar from "./search";
import CategoryFilters from "./category-filter";
import ProductCard from "./product-card";

interface ProductGridProps {
  products: MockProduct[];
  categories: MockCategory[];
  cartItems: CartItem[];
  onAddToCart: (product: MockProduct) => void;
}

export default function ProductGrid({
  products,
  categories,
  cartItems,
  onAddToCart,
}: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [selectedCategoryId, setSelectedCategoryId] = useQueryState(
    "category",
    parseAsInteger.withDefault(0)
  );

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategoryId === 0 || product.category_id === selectedCategoryId;
    const matchesSearch =
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-2/3 flex flex-col p-6 border-r border-gray-200 bg-white shadow-md">
      <div className="flex items-center space-x-4 mb-6">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        {/* CustomerSelector would go here if needed */}
      </div>

      <CategoryFilters
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      <ScrollArea className="flex-grow pr-4">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredProducts.map((product) => {
              const cartItem = cartItems.find(
                (item) => item.productId === product.id
              );
              const isOutOfStock = product.stock <= (cartItem?.quantity ?? 0);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  isOutOfStock={isOutOfStock || product.stock <= 0}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No products found matching your criteria.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
