import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Product, ProductVariant } from "@prisma/client";

// Same extended type as in ProductCard
type ProductWithDetails = Product & {
  category?: { name: string };
  variants: ProductVariant[]; // Define variant type properly
  totalStock: number;
  basePrice: string;
  imageUrls?: string[];
};

interface ProductListItemProps {
  product: ProductWithDetails;
  onEdit: (product: ProductWithDetails) => void;
  onDelete: (productId: string) => void;
}

const DEFAULT_IMAGE = "/placeholder-image.png";

export function ProductListItem({
  product,
  onEdit,
  onDelete,
}: ProductListItemProps) {
  const displayImage = product.imageUrls?.[0] || DEFAULT_IMAGE;
  const hasVariants = product.variants && product.variants.length > 0;

  return (
    <div className="flex items-center space-x-4 p-3 hover:bg-muted/50 rounded-md transition-colors duration-150 border-b last:border-b-0">
      <Image
        src={displayImage}
        alt={product.name}
        width={50}
        height={50}
        className="rounded object-cover aspect-square border"
        onError={(e) => {
          e.currentTarget.src = DEFAULT_IMAGE;
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate mb-0.5">{product.name}</p>
        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
        {product.category?.name && (
          <Badge variant="secondary" className="mt-1 text-xs">
            {product.category.name}
          </Badge>
        )}
        {hasVariants && (
          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
            ({product.variants.length} Variant(s))
          </span>
        )}
      </div>
      <div className="hidden md:block w-24 text-right">
        <p className="text-sm font-semibold">
          ${parseFloat(product.basePrice).toFixed(2)}
        </p>
        {hasVariants && (
          <p className="text-xs text-muted-foreground"> (base)</p>
        )}
      </div>
      <div
        className={`hidden md:block w-20 text-right font-medium text-sm ${product.totalStock <= (product.reorderPoint ?? 5) ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
      >
        {product.totalStock} units
      </div>
      <div className="w-12 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(product.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
            {/* Add other actions */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
