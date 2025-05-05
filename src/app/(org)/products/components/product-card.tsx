"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Category } from "@/prisma/client";
import { ProductWithCategory } from "../schema";
import { deleteProduct } from "../actions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit } from "lucide-react";
import { ProductForm } from "./product-form"; // Import the form

interface ProductCardProps {
  product: ProductWithCategory; // Use the combined type
  categories: Category[];
}

// Basic currency formatter
const formatCurrency = (amount: string | number | null | undefined) => {
  const num = Number(amount);
  if (isNaN(num)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num); // Adjust currency as needed
};

export function ProductCard({ product, categories }: ProductCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleEditSuccess = () => {
    setIsEditOpen(false); // Close edit dialog on success
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      startDeleteTransition(async () => {
        const result = await deleteProduct(product.id);
        if (result.success) {
          // toast({
          //   title: "Success",
          //   description: result.message,
          // });
          // Revalidation happens server-side via revalidatePath
        } else {
          // toast({
          //   title: "Error",
          //   description: result.message || "Failed to delete product.",
          //   variant: "destructive",
          // });
        }
      });
    }
  };

  const firstImageUrl = product.imageUrls?.[0];
  const placeholderImage = "/placeholder-image.png"; // Add a placeholder in /public

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between space-x-2">
          {/* Image Area */}
          <div className="relative h-16 w-16 flex-shrink-0">
            <Image
              src={firstImageUrl || placeholderImage}
              alt={product.name}
              fill // Use fill for responsive sizing within the container
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes
              style={{ objectFit: "contain" }} // Or 'cover'
              className="rounded-md"
              onError={(e) => {
                e.currentTarget.src = placeholderImage;
              }} // Fallback on error
            />
          </div>

          {/* Title, SKU, Status */}
          <div className="flex-grow">
            <CardTitle className="text-base font-semibold leading-tight mb-1">
              {product.name}
            </CardTitle>
            <CardDescription className="text-xs">
              SKU: {product.sku}
            </CardDescription>
            <Badge
              variant={product.isActive ? "default" : "outline"}
              className="mt-1"
            >
              {product.isActive ? "Active" : "Draft"}
            </Badge>
          </div>

          {/* Actions Dropdown */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Edit Trigger */}
                <DialogTrigger asChild>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                </DialogTrigger>
                {/* Delete Trigger */}
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog Content */}
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update the details for {product.name}.
                </DialogDescription>
              </DialogHeader>
              <ProductForm
                product={product}
                categories={categories}
                onSuccess={handleEditSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="py-2 text-sm">
        {/* Mimic UI: Display Category */}
        <div className="mb-2">
          <span className="text-muted-foreground">Category: </span>
          <span>{product.category?.name || "N/A"}</span>
        </div>
        {/* Mimic UI: Pricing - simplified to base price */}
        <div>
          <span className="text-muted-foreground">Price: </span>
          <span className="font-medium">
            {formatCurrency(product.basePrice)}
          </span>
        </div>
        {/* Add Description if available */}
        {product.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {product.description}
          </p>
        )}
      </CardContent>
      {/* Card Footer - Could show stock status later */}
      {/* <CardFooter className="pt-2">
        <span className="text-xs text-muted-foreground">Stock: Placeholder</span>
      </CardFooter> */}
    </Card>
  );
}
