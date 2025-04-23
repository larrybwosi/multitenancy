"use client";

import { useCallback, useState } from "react";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ImageIcon, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  sku?: string;
  basePrice: number | string;
  imageUrls?: string[];
  stock?: number;
  // Add other product properties as needed
}

export function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (productId: string) => void;
}) {
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = useCallback(() => {
    onAddToCart(product.id);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  }, [product.id, onAddToCart]);

  // Basic check for image URL - adapt if structure is different
  const imageUrl =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls[0]
      : null;

  const lowStock =
    product.stock !== undefined && product.stock <= 5 && product.stock > 0;

  return (
    <Card
      className="overflow-x-auto flex flex-col group border border-neutral-200 dark:border-neutral-800 hover:border-primary/60 transition-all duration-300 shadow-sm hover:shadow-lg mx-auto w-64 rounded-xl"
      aria-label={`Product: ${product.name}`}
    >
      {/* Product Image Area with gradient overlay */}
      <div
        className="aspect-square bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 flex items-center justify-center overflow-hidden relative cursor-pointer"
        onClick={() => {
          /* Navigate to product detail */
        }}
        tabIndex={0}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") &&
          {
            /* Navigate to product detail */
          }
        }
        role="button"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            width={350}
            height={350}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500 ease-in-out"
          />
        ) : (
          <ImageIcon className="w-1/3 h-1/3 text-neutral-300 dark:text-neutral-700" />
        )}

        {/* Overlay for add to cart */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            className="bg-white text-black hover:bg-white/90 font-medium transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              handleAdd();
            }}
          >
            {isAdded ? (
              <>
                <CheckCircle size={16} className="mr-2" /> Added
              </>
            ) : (
              <>
                <ShoppingCart size={16} className="mr-2" /> Add to Cart
              </>
            )}
          </Button>
        </div>

        {/* Stock indicator */}
        {lowStock && (
          <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            Only {product.stock} left
          </div>
        )}
      </div>

      <CardHeader className="p-2 flex-grow">
        <CardTitle className="text-base font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {product.name}
        </CardTitle>
        {product.sku && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-1">
            SKU: {product.sku}
          </p>
        )}
      </CardHeader>

      <CardFooter className="p-2 pt-2 flex justify-between items-center">
        <p className="text-base font-bold text-primary">
          {formatCurrency(product.basePrice)}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full h-9 w-9 flex items-center justify-center border-neutral-200 dark:border-neutral-800 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
          onClick={(e) => {
            e.stopPropagation();
            handleAdd();
          }}
        >
          {isAdded ? (
            <CheckCircle size={18} className="text-primary" />
          ) : (
            <ShoppingCart size={18} />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
