// app/pos/_components/ProductDetailDialog.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
// Use updated types
import { ProductWithCalculatedStock, VariantWithCalculatedStock } from '../../types';
import { X, Plus, Minus, Package, ImageOff, ShoppingCart, Info } from 'lucide-react';

// Shadcn Components
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ProductDetailDialogProps {
  // Use updated product type
  product: ProductWithCalculatedStock | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  // Handler expects updated product type
  onAddToCart: (product: ProductWithCalculatedStock, variant: VariantWithCalculatedStock | null, quantity: number) => void;
  locationId: string; // Keep locationId if needed for other logic, but stock comes pre-calculated
}

export default function ProductDetailDialog({
  product,
  isOpen,
  onClose,
  onAddToCart,
  locationId, // May not be needed for stock now
}: ProductDetailDialogProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && product) {
      setSelectedVariantId(null);
      setQuantity(1);
    } else if (!isOpen) {
        setSelectedVariantId(null);
        setQuantity(1);
    }
  }, [isOpen, product]);

  const selectedVariant = useMemo(() => {
    if (!product || !selectedVariantId) return null;
    return product.variants.find(v => v.id === selectedVariantId) ?? null;
  }, [product, selectedVariantId]);

  // Calculate effective price using parseFloat
  const effectivePrice = useMemo(() => {
      if (!product) return 0;
      const base = parseFloat(product.basePrice || '0');
      const modifier = selectedVariant ? parseFloat(selectedVariant.priceModifier || '0') : 0;
      return base + modifier;
  }, [product, selectedVariant]);

  const handleAddToCartClick = () => {
    if (!product || quantity < 1) return;
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
        alert("Please select an option.");
        return;
    }
    onAddToCart(product, selectedVariant, quantity);
  };

  const increaseQuantity = () => setQuantity(q => q + 1);
  const decreaseQuantity = () => setQuantity(q => Math.max(1, q - 1));

  const requiresVariantSelection = product?.variants && product.variants.length > 0;

  // Use pre-calculated totalStock from the selected variant
  const displayStock = selectedVariant?.totalStock; // Directly use totalStock

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-lg font-semibold">{product.name}</DialogTitle>
           <DialogClose asChild>
             <Button variant="ghost" size="icon" className="absolute right-4 top-3"> <X className="h-5 w-5" /> </Button>
           </DialogClose>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image */}
                <div className="flex items-center justify-center bg-muted rounded-lg aspect-square overflow-hidden border">
                     {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <ImageOff className="w-16 h-16 text-gray-400" />}
                </div>

                <div className="space-y-4">
                    {/* Price */}
                    <p className="text-2xl font-bold text-primary">
                        ${effectivePrice.toFixed(2)}
                    </p>
                    {/* SKU / Category */}
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                         {product.sku && <span>SKU: {product.sku}</span>}
                         {product.sku && product.category && <Separator orientation="vertical" className="h-3"/>}
                         {product.category && <span>Category: {product.category.name}</span>}
                    </div>
                    {/* Description */}
                    {product.description && (
                        <div>
                            <h4 className="font-medium mb-1 text-sm">Description</h4>
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                        </div>
                    )}
                     {/* Variants Selection */}
                     {product.variants && product.variants.length > 0 && (
                        <div>
                        <h4 className="font-medium mb-2 text-sm">Options</h4>
                        <RadioGroup value={selectedVariantId ?? undefined} onValueChange={setSelectedVariantId} className="space-y-1">
                            {product.variants.map(variant => {
                                // Parse variant price modifier for display
                                const modifierValue = parseFloat(variant.priceModifier || '0');
                                return (
                                    <Label key={variant.id} htmlFor={`variant-${variant.id}`} className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer transition-colors ${selectedVariantId === variant.id ? 'border-primary bg-primary/10' : 'border-muted hover:bg-muted/50'}`}>
                                        <RadioGroupItem value={variant.id} id={`variant-${variant.id}`} />
                                        <span className="flex-1 text-sm font-medium">{variant.name}</span>
                                        {/* Display price modifier */}
                                        {modifierValue !== 0 && (
                                            <span className={`text-xs ${modifierValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ({modifierValue > 0 ? '+' : ''}${modifierValue.toFixed(2)})
                                            </span>
                                        )}
                                        {/* Display totalStock for the variant */}
                                         <Badge variant={variant.totalStock > 0 ? "outline" : "destructive"} className="text-xs">
                                            {variant.totalStock > 0 ? `${variant.totalStock} in stock` : "Out of stock"}
                                        </Badge>
                                    </Label>
                                );
                            })}
                        </RadioGroup>
                        </div>
                    )}
                    {/* Quantity */}
                     <div>
                        <h4 className="font-medium mb-2 text-sm">Quantity</h4>
                        <div className="flex items-center space-x-2 border border-input rounded-md p-1 max-w-min bg-background">
                            <Button variant="outline" size="icon" className="w-7 h-7" onClick={decreaseQuantity} disabled={quantity <= 1}> <Minus size={16} /> </Button>
                            <span className="text-base font-medium w-8 text-center">{quantity}</span>
                            <Button variant="outline" size="icon" className="w-7 h-7" onClick={increaseQuantity}> <Plus size={16} /> </Button>
                        </div>
                    </div>
                </div>
            </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-muted/40 flex-row justify-between items-center sm:justify-between">
           <div className="text-sm text-muted-foreground">
                 {/* Stock/Selection Info */}
                 {selectedVariant && displayStock !== undefined && (
                    <Badge variant={displayStock >= quantity ? (displayStock > 0 ? 'default' : 'secondary') : 'destructive'}>
                        {displayStock >= quantity ? `${displayStock} in stock` : `Only ${displayStock} left`}
                    </Badge>
                 )}
                 {!selectedVariant && requiresVariantSelection && (
                     <span className="text-amber-600 ml-2 flex items-center"><Info className="w-3 h-3 mr-1"/> Select an option</span>
                 )}
           </div>
          <Button size="lg" onClick={handleAddToCartClick}
             disabled={
                 (requiresVariantSelection && !selectedVariantId) ||
                 (displayStock !== undefined && quantity > displayStock) // Check against selected variant stock
             }
             className="min-w-[150px]">
             <ShoppingCart className="w-4 h-4 mr-2" />
             Add to Cart (${(effectivePrice * quantity).toFixed(2)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}