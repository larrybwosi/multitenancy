import { Package, X } from "lucide-react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Product } from "@prisma/client";


const ProductModal: React.FC<{
  product: Product;
  onClose: () => void;
  open: boolean;
}> = ({ product, onClose, open }) => {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex justify-between items-center">
            <SheetTitle className="text-xl font-bold text-gray-800">
              {product.name}
            </SheetTitle>
            <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none">
              <X className="h-6 w-6" />
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="p-6 grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative h-64 w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              {product.imageUrls.length > 0 ? (
                <Image
                  src={product.imageUrls[0]}
                  alt={product.name}
                  layout="fill"
                  objectFit="contain"
                  className="hover:scale-105 transition-transform"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </h3>
                <Badge
                  variant={product.isActive ? "default" : "destructive"}
                  className="mt-1"
                >
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {product.category.name}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Description
              </h3>
              <Separator className="my-2" />
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {product.description || "No description available"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {product.sku}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barcode
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {product.barcode || "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  $
                  {typeof product.basePrice === "string"
                    ? parseFloat(product.basePrice).toFixed(2)
                    : product.basePrice.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {product.totalStock}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reorder Point
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {product.reorderPoint}
                </p>
              </div>
              {product.weight && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {product.weight}g
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProductModal;
