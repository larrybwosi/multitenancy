'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductVariantInput } from '@/lib/validations/product';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VariantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variants?: ProductVariantInput[];
  onAddVariant: (variant: ProductVariantInput) => void;
  onRemoveVariant: (index: number) => void;
}

export function VariantModal({ 
  open, 
  onOpenChange, 
  variants, 
  onAddVariant, 
  onRemoveVariant 
}: VariantModalProps) {
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantReorderPoint, setNewVariantReorderPoint] = useState(5);
  const [newVariantReorderQty, setNewVariantReorderQty] = useState(10);
  const [newVariantActive, setNewVariantActive] = useState(true);
  const [newVariantLowStockAlert, setNewVariantLowStockAlert] = useState(true);

  const handleAddVariant = () => {
    if (!newVariantName.trim()) return;

    const variant: ProductVariantInput = {
      name: newVariantName,
      reorderPoint: newVariantReorderPoint,
      reorderQty: newVariantReorderQty,
      isActive: newVariantActive,
      lowStockAlert: newVariantLowStockAlert,
      priceModifier: 0,
      barcode: '',
    };

    onAddVariant(variant);
    setNewVariantName('');
    setNewVariantReorderPoint(5);
    setNewVariantReorderQty(10);
    setNewVariantActive(true);
    setNewVariantLowStockAlert(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Product Variants</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Existing Variants */}
            <div className="space-y-4">
              <Label>Existing Variants</Label>
              {variants?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No variants added yet</p>
              ) : (
                <div className="space-y-3">
                  {variants && variants?.map((variant, index) => (
                    <div key={index} className="p-4 border rounded-md relative bg-muted/20">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveVariant(index)}
                        aria-label="Remove variant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <h4 className="font-medium text-sm mb-3">{variant.name}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Reorder Point</Label>
                          <p className="text-sm">{variant.reorderPoint}</p>
                        </div>
                        <div>
                          <Label className="text-xs">Reorder Qty</Label>
                          <p className="text-sm">{variant.reorderQty}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={variant.isActive} 
                            disabled 
                            className="h-4 w-4"
                          />
                          <Label className="text-sm">Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={variant.lowStockAlert} 
                            disabled 
                            className="h-4 w-4"
                          />
                          <Label className="text-sm">Low Stock Alert</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Variant */}
            <div className="space-y-4">
              <Label>Add New Variant</Label>
              <div className="space-y-4 p-4 border rounded-md bg-muted/20">
                <div className="space-y-2">
                  <Label htmlFor="variantName">Variant Name *</Label>
                  <Input
                    id="variantName"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    placeholder="e.g., Large Black"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reorderPoint">Reorder Point</Label>
                    <Input
                      id="reorderPoint"
                      type="number"
                      min="0"
                      step="1"
                      value={newVariantReorderPoint}
                      onChange={(e) => setNewVariantReorderPoint(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reorderQty">Reorder Quantity</Label>
                    <Input
                      id="reorderQty"
                      type="number"
                      min="1"
                      step="1"
                      value={newVariantReorderQty}
                      onChange={(e) => setNewVariantReorderQty(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="variantActive"
                      checked={newVariantActive}
                      onCheckedChange={(checked) => setNewVariantActive(!!checked)}
                    />
                    <Label htmlFor="variantActive" className="text-sm font-medium">
                      Active
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lowStockAlert"
                      checked={newVariantLowStockAlert}
                      onCheckedChange={(checked) => setNewVariantLowStockAlert(!!checked)}
                    />
                    <Label htmlFor="lowStockAlert" className="text-sm font-medium">
                      Low Stock Alert
                    </Label>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddVariant}
                  className="w-full mt-4"
                  disabled={!newVariantName.trim()}
                >
                  Add Variant
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}