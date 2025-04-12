import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  PackageOpen,
  Tag,
  ShoppingCart,
} from "lucide-react";
import { Product } from "@prisma/client";
import { cn } from "@/lib/utils";

// Extend Product type to include relations and calculated fields from getProducts
type ProductWithDetails = Product & {
  category?: { name: string };
  variants: any[]; // Define variant type properly
  totalStock: number;
  basePrice: string; 
  imageUrls?: string[];
};

interface ProductCardProps {
  product: ProductWithDetails;
  onEdit: (product: ProductWithDetails) => void;
  onRestock: (product: ProductWithDetails) => void;
  onDelete: (productId: string) => void;
  onView?: (product: ProductWithDetails) => void;
  onAddToCart?: (product: ProductWithDetails) => void;
}

// Placeholder image
const DEFAULT_IMAGE = "/placeholder-image.png";

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onRestock,
  onView,
  onAddToCart,
}: ProductCardProps) {
  const displayImage = product.imageUrls?.[0] || DEFAULT_IMAGE;
  const hasVariants = product.variants && product.variants.length > 0;

  // Determine stock status for styling
  const isLowStock = product.totalStock <= (product.reorderPoint ?? 5);
  const isOutOfStock = product.totalStock === 0;

  return (
    <Card className="group flex flex-col h-full overflow-hidden border-border/40 hover:border-primary/30 transition-all duration-300 bg-card rounded-xl">
      <CardHeader className="relative p-0">
        {/* Status badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {product.category?.name && (
            <Badge
              variant="secondary"
              className="bg-background/80 backdrop-blur-sm text-xs font-medium"
            >
              {product.category.name}
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="destructive" className="text-xs font-medium">
              Out of Stock
            </Badge>
          )}
          {isLowStock && !isOutOfStock && (
            <Badge
              variant="outline"
              className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs font-medium"
            >
              Low Stock
            </Badge>
          )}
        </div>

        {/* Actions dropdown */}
        <div className="absolute top-3 right-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onView && (
                <DropdownMenuItem onClick={() => onView(product)}>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Product
              </DropdownMenuItem>
              {hasVariants && (
                <DropdownMenuItem>
                  <PackageOpen className="mr-2 h-4 w-4" /> Manage Variants
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(product.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Product image with hover effect */}
        <div className="aspect-square w-full overflow-hidden">
          <div className="relative h-full w-full transform transition-transform duration-500 group-hover:scale-110">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_IMAGE;
              }}
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-grow">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs text-muted-foreground font-mono tracking-tight">
            {product.sku}
          </p>
          {hasVariants && (
            <Badge
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400 text-[10px] px-1.5 py-0 h-4"
            >
              {product.variants.length} Variants
            </Badge>
          )}
        </div>

        <h3 className="text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {product.name}
        </h3>

        <div className="mt-2">
          <div className="flex gap-1 items-baseline">
            <span className="text-primary font-bold text-lg">
              ${parseFloat(product.basePrice).toFixed(2)}
            </span>
            {hasVariants && (
              <span className="text-xs text-muted-foreground font-normal">
                {" "}
                (base)
              </span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 flex justify-between items-center border-t gap-2">
        <div className="flex items-center gap-1">
          <div
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              isOutOfStock
                ? "bg-red-500"
                : isLowStock
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            )}
          />
          <span
            className={cn(
              "text-sm font-medium",
              isOutOfStock
                ? "text-red-700 dark:text-red-400"
                : isLowStock
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-emerald-700 dark:text-emerald-400"
            )}
          >
            {product.totalStock} in stock
          </span>
        </div>

        {onAddToCart && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className="h-8 gap-1 group/btn"
          >
            <ShoppingCart className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
            <span className="sr-md:hidden">Add</span>
          </Button>
        )}

        {!onAddToCart && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRestock(product)}
            className="h-8 gap-1"
          >
            <Tag className="h-4 w-4" />
            <span className="sr-md:hidden">Manage</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
