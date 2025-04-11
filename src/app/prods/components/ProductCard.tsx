import React from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Product } from "@prisma/client"; // Assuming types

// Extend Product type to include relations and calculated fields from getProducts
type ProductWithDetails = Product & {
  category?: { name: string };
  variants: any[]; // Define variant type properly
  totalStock: number;
  basePrice: string; // Already string from getProducts
  imageUrls?: string[];
};

interface ProductCardProps {
  product: ProductWithDetails;
  onEdit: (product: ProductWithDetails) => void;
  onDelete: (productId: string) => void; // Or trigger a confirmation dialog
}

// Placeholder image
const DEFAULT_IMAGE = "/placeholder-image.png"; // Add a placeholder image to your public folder

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const displayImage = product.imageUrls?.[0] || DEFAULT_IMAGE;
  const hasVariants = product.variants && product.variants.length > 0;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 bg-card">
      <CardHeader className="relative p-0">
        <div className="absolute top-2 right-2 z-10">
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
              {/* Add other actions like 'View Details', 'Restock' */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="aspect-square w-full overflow-hidden rounded-t-lg">
          <Image
            src={displayImage}
            alt={product.name}
            width={300}
            height={300}
            className="object-cover w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-105" // Added group-hover for potential parent styling
            onError={(e) => {
              e.currentTarget.src = DEFAULT_IMAGE;
            }} // Fallback
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        {product.category?.name && (
          <Badge variant="outline" className="mb-2">
            {product.category.name}
          </Badge>
        )}
        <h3 className="text-lg font-semibold mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">SKU: {product.sku}</p>
        {hasVariants && (
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {product.variants.length} Variant(s)
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center border-t bg-muted/30">
        <div className="text-lg font-bold text-primary">
          ${parseFloat(product.basePrice).toFixed(2)}
          {hasVariants && (
            <span className="text-xs text-muted-foreground font-normal">
              {" "}
              (base)
            </span>
          )}
        </div>
        <div
          className={`text-sm font-medium ${product.totalStock <= (product.reorderPoint ?? 5) ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
        >
          Stock: {product.totalStock}
        </div>
      </CardFooter>
    </Card>
  );
}
