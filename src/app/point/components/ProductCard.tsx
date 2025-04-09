"use client";

import { useCallback } from "react";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ImageIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils"; 

interface Product {
  id: string;
  name: string;
  sku?: string;
  basePrice: number | string;
  imageUrls?: string[];
  stock?: number;
  // Add other product properties as needed
}

export function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (productId: string) => void }) {
  const handleAdd = useCallback(() => {
    onAddToCart(product.id);
  }, [product.id, onAddToCart]);

  // Basic check for image URL - adapt if structure is different
  const imageUrl =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls[0]
      : null;

  return (
    <Card
      className="overflow-hidden flex flex-col group border-neutral-200 dark:border-neutral-700/60 hover:border-primary/40 transition-colors duration-200 shadow-sm hover:shadow-md"
      role="button"
      tabIndex={0}
      onClick={handleAdd}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleAdd()}
    >
      {/* Product Image Area */}
      <div className="aspect-square bg-muted/50 dark:bg-muted/30 flex items-center justify-center overflow-hidden relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ease-in-out"
          />
        ) : (
          <ImageIcon className="w-1/3 h-1/3 text-muted-foreground/50" />
        )}
        {/* Add to cart button overlay (optional) */}
        {/* <Button size="sm" className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleAdd(); }}>Add</Button> */}
      </div>

      <CardHeader className="p-3 flex-grow">
        <CardTitle className="text-sm font-medium leading-snug line-clamp-2">
          {product.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground pt-0.5">{product.sku}</p>
      </CardHeader>
      <CardFooter className="p-3 flex justify-between items-center bg-muted/30 dark:bg-muted/20">
        <p className="text-sm font-semibold text-primary">
          {formatCurrency(product.basePrice)}
        </p>
        {/* Simple add button can go here too if overlay isn't desired */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-primary/80 hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            handleAdd();
          }}
        >
          <ShoppingCart size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
}
