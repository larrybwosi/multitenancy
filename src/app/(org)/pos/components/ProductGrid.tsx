"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard } from "./ProductCard";
import { Search, Inbox } from "lucide-react";

export function ProductGrid({ products = [], onAddToCart }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerCaseSearch) ||
        p.sku.toLowerCase().includes(lowerCaseSearch) ||
        p.barcode?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [products, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border dark:border-neutral-800 shadow-sm">
      {/* Search Header */}
      <div className="p-4 border-b border-border dark:border-neutral-800 sticky top-0 bg-background z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products by name, SKU, barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full" // Added w-full
          />
        </div>
      </div>

      {/* Product Grid Area */}
      <ScrollArea className="flex-grow p-4">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100%-80px)] text-muted-foreground">
            {" "}
            {/* Adjust height if header changes */}
            <Inbox size={48} className="mb-4" />
            <p>No products found matching your search.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
