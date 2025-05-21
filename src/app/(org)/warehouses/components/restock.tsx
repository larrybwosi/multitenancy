import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  currentStock: number;
}

interface Location {
  id: string;
  name: string;
}

interface RestockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  location: Location;
  onRestock: (productId: string, quantity: number) => Promise<void>;
}

export function RestockModal({ open, onOpenChange, products, location, onRestock }: RestockModalProps) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSubmit = async () => {
    if (!selectedProductId || !quantity) {
      toast({
        title: 'Missing information',
        description: 'Please select a product and enter a quantity',
        variant: 'destructive',
      });
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: 'Invalid quantity',
        description: 'Please enter a positive number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await onRestock(selectedProductId, quantityNum);
      toast.success('Restock successful',{
        description: `Added ${quantityNum} units of ${selectedProduct?.name} to ${location.name}`,
      });
      setSelectedProductId('');
      setQuantity('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Restock failed',{
        description: 'There was an error processing your request',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Restock Inventory</DialogTitle>
          <DialogDescription>
            Add inventory items to {location.name}. Select a product and enter the quantity to restock.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product" className="text-right">
              Product
            </Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} (Current: {product.currentStock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="col-span-3"
              placeholder="Enter number of units to add"
            />
          </div>

          {selectedProduct && (
            <div className="text-sm text-muted-foreground">
              <p>
                Current stock: <span className="font-medium">{selectedProduct.currentStock}</span>
              </p>
              <p>
                After restock:{' '}
                <span className="font-medium">{selectedProduct.currentStock + (parseInt(quantity) || 0)}</span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading || !selectedProductId || !quantity}>
            {isLoading ? 'Processing...' : 'Confirm Restock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
