"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, AlertCircle } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { MockProduct } from "../lib/mock-data";

interface ProductCardProps {
  product: MockProduct;
  onAddToCart: (product: MockProduct) => void;
  isOutOfStock: boolean;
}

export default function ProductCard({
  product,
  onAddToCart,
  isOutOfStock,
}: ProductCardProps) {
  return (
    <Card
      className={`overflow-hidden transition-all duration-300 hover:shadow-xl rounded-lg ${
        isOutOfStock ? "opacity-70 grayscale" : ""
      } group hover:translate-y-[-4px] bg-gradient-to-b from-white to-gray-50 border border-gray-100`}
    >
      <div className="relative">
        <CardHeader className="p-0 overflow-hidden">
          <AspectRatio ratio={1 / 1}>
            <div className="w-full h-full overflow-hidden">
              <Avatar className="w-full h-full rounded-none">
                <AvatarImage
                  src={product.image_url ?? undefined}
                  alt={product.name}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                />
                <AvatarFallback className="rounded-none bg-gradient-to-br from-purple-100 to-blue-200 text-indigo-700 text-2xl font-bold">
                  {product.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </AspectRatio>
        </CardHeader>

        {/* Category badge that floats on top of the image */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="bg-indigo-600 text-white backdrop-blur-sm font-medium px-2 py-1 shadow-lg"
          >
            {product.category.name}
          </Badge>
        </div>

        {/* Price tag floating on bottom right corner of image */}
        <div className="absolute bottom-3 right-3">
          <Badge
            variant="default"
            className="bg-emerald-500 text-white px-3 py-1 text-sm font-bold shadow-md"
          >
            KES {product.price.toFixed(2)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-4 bg-white/90">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg leading-tight text-gray-800 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium ml-1 text-gray-700">4.8</span>
          </div>
        </div>

        {/* Stock indicators */}
        <div className="flex flex-col gap-2">
          {product.stock <= (product.min_stock_level ?? 5) && !isOutOfStock && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">
                Low Stock ({product.stock} left)
              </span>
            </div>
          )}

          {isOutOfStock && (
            <Badge
              variant="outline"
              className="w-fit bg-gray-100 border-gray-200 text-gray-600 px-2"
            >
              Out of Stock
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 bg-white">
        <Button
          size="default"
          className={`w-full transition-all flex items-center justify-center gap-2 ${
            isOutOfStock
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-sm hover:shadow"
          }`}
          onClick={() => !isOutOfStock && onAddToCart(product)}
          disabled={isOutOfStock}
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  );
}
