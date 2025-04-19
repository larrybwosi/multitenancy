"use client";

import { useState, useEffect, useMemo } from "react";
// Use updated types
import {
  ProductWithCalculatedStock,
  VariantWithCalculatedStock,
} from "../types";
import {
  X,
  Plus,
  Minus,
  ImageOff,
  ShoppingCart,
  Info,
  ChevronLeft,
  ChevronRight,
  Heart,
  Check,
} from "lucide-react";

// Shadcn Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatCurrency } from "@/lib/utils";
import Image from "next/image";

interface ProductDetailDialogProps {
  // Use updated product type
  product: ProductWithCalculatedStock | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  // Handler expects updated product type
  onAddToCart: (
    product: ProductWithCalculatedStock,
    variant: VariantWithCalculatedStock | null,
    quantity: number
  ) => void;
  locationId: string;
}

export default function ProductDetailDialog({
  product,
  isOpen,
  onClose,
  onAddToCart,
  locationId,
}: ProductDetailDialogProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlist, setIsWishlist] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Prepare images array from product using imageUrls
  const images = useMemo(() => {
    if (!product) return [];
    // Use imageUrls which is an array of strings
    if (Array.isArray(product.imageUrls)) return product.imageUrls;
    return [];
  }, [product]);

  useEffect(() => {
    if (isOpen && product) {
      setSelectedVariantId(null);
      setQuantity(1);
      setCurrentImageIndex(0);
      setIsImageZoomed(false);
    } else if (!isOpen) {
      setSelectedVariantId(null);
      setQuantity(1);
      setCurrentImageIndex(0);
      setIsImageZoomed(false);
    }
  }, [isOpen, product]);

  const selectedVariant = useMemo(() => {
    if (!product || !selectedVariantId) return null;
    return product.variants.find((v) => v.id === selectedVariantId) ?? null;
  }, [product, selectedVariantId]);

  // Calculate effective price using parseFloat
  const effectivePrice = useMemo(() => {
    if (!product) return 0;
    const base = parseFloat(product.basePrice || "0");
    const modifier = selectedVariant
      ? parseFloat(selectedVariant.priceModifier || "0")
      : 0;
    return base + modifier;
  }, [product, selectedVariant]);

  const handleAddToCartClick = () => {
    if (!product || quantity < 1) return;
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      alert("Please select an option.");
      return;
    }
    onAddToCart(product, selectedVariant, quantity);
    // Optional: close dialog after adding to cart
    // onClose();
  };

  const increaseQuantity = () => setQuantity((q) => q + 1);
  const decreaseQuantity = () => setQuantity((q) => Math.max(1, q - 1));

  const requiresVariantSelection =
    product?.variants && product.variants.length > 0;

  // Use pre-calculated totalStock from the selected variant
  const displayStock = selectedVariant?.totalStock;

  // Image navigation
  const nextImage = () => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const toggleImageZoom = () => {
    setIsImageZoomed(!isImageZoomed);
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold text-primary/90">
              {product.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div
                className={cn(
                  "relative group overflow-hidden rounded-xl bg-gradient-to-br from-muted/30 to-muted/80 border aspect-square flex items-center justify-center cursor-pointer",
                  isImageZoomed ? "z-10" : ""
                )}
                onClick={toggleImageZoom}
              >
                {images.length > 0 ? (
                  <>
                    <Image
                      src={images[currentImageIndex]}
                      width={500}
                      height={500}
                      alt={`${product.name} - image ${currentImageIndex + 1}`}
                      className={cn(
                        "w-full h-full object-cover transition-all duration-300",
                        isImageZoomed ? "scale-150" : "group-hover:scale-110"
                      )}
                    />

                    {/* Image Navigation Controls */}
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg bg-white/90 hover:bg-white h-9 w-9 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                          }}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>

                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg bg-white/90 hover:bg-white h-9 w-9 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                          }}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>

                        {/* Image counter badge */}
                        <div className="absolute bottom-3 right-3 bg-background/80 text-foreground px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm shadow-sm">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground">
                    <ImageOff className="w-16 h-16 mb-2 opacity-50" />
                    <p className="text-sm">No image available</p>
                  </div>
                )}

                {/* Wishlist button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm border-none hover:bg-background/60 h-8 w-8 rounded-full shadow-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsWishlist(!isWishlist);
                  }}
                >
                  <Heart
                    className={`h-4 w-4 ${isWishlist ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                  />
                </Button>

                {/* Zoom indicator */}
                <div className="absolute bottom-3 left-3 bg-background/80 text-xs text-muted-foreground px-2.5 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  Click to {isImageZoomed ? "zoom out" : "zoom in"}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 px-1">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={cn(
                        "relative h-16 w-16 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all shadow-sm hover:shadow",
                        currentImageIndex === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-muted hover:border-primary/50"
                      )}
                      onClick={() => goToImage(index)}
                    >
                      <Image
                        src={image}
                        width={64}
                        height={64}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {currentImageIndex === index && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <div className="h-5 w-5 rounded-full bg-primary/80 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5 md:pl-2">
              {/* Price and Badge Section */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(effectivePrice.toFixed(2))}
                  </p>
                  {product.basePrice &&
                    parseFloat(product.basePrice) > effectivePrice && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm line-through text-muted-foreground">
                          {formatCurrency(parseFloat(product.basePrice).toFixed(2))}
                        </p>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                          Save 
                          {formatCurrency((
                            parseFloat(product.basePrice) - effectivePrice
                          ).toFixed(2))}
                        </Badge>
                      </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  {product.sku && (
                    <Badge variant="outline" className="text-xs">
                      SKU: {product.sku}
                    </Badge>
                  )}
                  {product.isActive && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-green-100 text-green-700 hover:bg-green-200"
                    >
                      <Check className="h-3 w-3 mr-1" /> In Stock
                    </Badge>
                  )}
                </div>
              </div>

              {/* Category */}
              {product.category && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="bg-muted px-2.5 py-1 rounded-full font-medium text-muted-foreground">
                    {product.category.name}
                  </span>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="bg-muted/20 p-4 rounded-lg border border-muted/50">
                  <h4 className="font-medium mb-2 text-sm text-primary/90">
                    Product Details
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Variants Selection */}
              {product.variants && product.variants.length > 0 && (
                <div className="bg-muted/20 p-4 rounded-lg border border-muted/50">
                  <h4 className="font-medium mb-3 text-sm text-primary/90">
                    Available Options
                  </h4>
                  <RadioGroup
                    value={selectedVariantId ?? undefined}
                    onValueChange={setSelectedVariantId}
                    className="space-y-2.5"
                  >
                    {product.variants.map((variant) => {
                      // Parse variant price modifier for display
                      const modifierValue = parseFloat(
                        variant.priceModifier || "0"
                      );
                      const isOutOfStock = variant.totalStock <= 0;

                      return (
                        <Label
                          key={variant.id}
                          htmlFor={`variant-${variant.id}`}
                          className={cn(
                            "flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all",
                            selectedVariantId === variant.id
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-muted/70 hover:bg-muted/30",
                            isOutOfStock ? "opacity-60" : "opacity-100"
                          )}
                        >
                          <RadioGroupItem
                            value={variant.id}
                            id={`variant-${variant.id}`}
                            disabled={isOutOfStock}
                            className={
                              selectedVariantId === variant.id
                                ? "border-primary text-primary"
                                : ""
                            }
                          />
                          <span className="flex-1 text-sm font-medium">
                            {variant.name}
                          </span>

                          {/* Display price modifier */}
                          {modifierValue !== 0 && (
                            <span
                              className={cn(
                                "text-xs font-medium px-2 py-1 rounded-full",
                                modifierValue > 0
                                  ? "bg-green-50 text-green-700 border border-green-100"
                                  : "bg-blue-50 text-blue-700 border border-blue-100"
                              )}
                            >
                              {modifierValue > 0 ? "+" : ""}$
                              {Math.abs(modifierValue).toFixed(2)}
                            </span>
                          )}

                          {/* Display totalStock for the variant */}
                          <Badge
                            variant={
                              variant.totalStock > 5
                                ? "outline"
                                : variant.totalStock > 0
                                  ? "secondary"
                                  : "destructive"
                            }
                            className={cn(
                              "text-xs whitespace-nowrap",
                              variant.totalStock > 5
                                ? "bg-transparent"
                                : variant.totalStock > 0
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : ""
                            )}
                          >
                            {variant.totalStock > 5
                              ? `${variant.totalStock} in stock`
                              : variant.totalStock > 0
                                ? `Only ${variant.totalStock} left`
                                : "Out of stock"}
                          </Badge>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                </div>
              )}

              {/* Quantity */}
              <div className="bg-muted/20 p-4 rounded-lg border border-muted/50">
                <h4 className="font-medium mb-3 text-sm text-primary/90">
                  Quantity
                </h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-input rounded-md overflow-hidden bg-background shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-none h-10 w-10 hover:bg-muted/30"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="text-base font-medium w-12 text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-none h-10 w-10 hover:bg-muted/30"
                      onClick={increaseQuantity}
                      disabled={
                        selectedVariant &&
                        !!displayStock &&
                        quantity >= displayStock
                      }
                    >
                      <Plus size={14} />
                    </Button>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm">
                          {selectedVariant && displayStock !== undefined && (
                            <Badge
                              variant={
                                displayStock > 10
                                  ? "outline"
                                  : displayStock > 0
                                    ? "secondary"
                                    : "destructive"
                              }
                              className={cn(
                                "font-normal",
                                displayStock > 10
                                  ? ""
                                  : displayStock > 0
                                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    : ""
                              )}
                            >
                              {displayStock > 10
                                ? "In stock"
                                : displayStock > 0
                                  ? `Only ${displayStock} left`
                                  : "Out of stock"}
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {displayStock} items available at this location
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-gradient-to-r from-primary/5 to-primary/10 flex-row justify-between items-center sm:justify-between gap-4">
          <div className="text-sm text-muted-foreground flex items-center">
            {/* Selection Info */}
            {!selectedVariant && requiresVariantSelection && (
              <span className="text-amber-600 flex items-center bg-amber-50 px-2 py-1 rounded-full text-xs">
                <Info className="w-3 h-3 mr-1" /> Please select an option
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-sm text-muted-foreground block">
                Total:
              </span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency((effectivePrice * quantity).toFixed(2))}
              </span>
            </div>

            <Button
              size="lg"
              onClick={handleAddToCartClick}
              disabled={
                (requiresVariantSelection && !selectedVariantId) ||
                (displayStock !== undefined && displayStock <= 0) ||
                (displayStock !== undefined && quantity > displayStock)
              }
              className={cn(
                "min-w-[180px] rounded-full bg-primary hover:bg-primary/90 text-white shadow-md transition-all",
                !(requiresVariantSelection && !selectedVariantId) &&
                  !(displayStock !== undefined && displayStock <= 0) &&
                  !(displayStock !== undefined && quantity > displayStock)
                  ? "hover:shadow-lg hover:scale-105"
                  : ""
              )}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
