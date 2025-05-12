'use client';

import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Edit, 
  Trash2,
  AlertTriangle 
} from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteVariant } from '@/lib/hooks/use-product-detail';

type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  buyingPrice: number | string;
  retailPrice?: number | string | null;
  wholesalePrice?: number | string | null;
  isActive: boolean;
  reorderPoint: number;
  reorderQty: number;
  lowStockAlert: boolean;
  attributes?: any;
  variantStocks?: any[];
};

interface ProductVariantsListProps {
  variants: ProductVariant[];
  onEdit: (variant: ProductVariant) => void;
  productId: string;
}

export default function ProductVariantsList({ variants, onEdit, productId }: ProductVariantsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<ProductVariant | null>(null);
  
  const deleteVariantMutation = useDeleteVariant();

  const handleDeleteClick = (variant: ProductVariant) => {
    setVariantToDelete(variant);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (variantToDelete) {
      deleteVariantMutation.mutate({ id: variantToDelete.id, productId });
    }
    setDeleteDialogOpen(false);
  };

  // Calculate total stock for each variant
  const getVariantTotalStock = (variant: ProductVariant) => {
    return variant.variantStocks?.reduce((total, stock) => total + (stock.currentStock || 0), 0) || 0;
  };

  if (variants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="h-10 w-10 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No Variants Found</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          This product doesn't have any variants yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variant Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Buying Price</TableHead>
              <TableHead>Retail Price</TableHead>
              <TableHead>Wholesale Price</TableHead>
              <TableHead>Total Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell className="font-medium">{variant.name}</TableCell>
                <TableCell>{variant.sku}</TableCell>
                <TableCell>${typeof variant.buyingPrice === 'string' ? 
                  parseFloat(variant.buyingPrice).toFixed(2) : 
                  variant.buyingPrice.toFixed(2)
                }</TableCell>
                <TableCell>
                  {variant.retailPrice ? 
                    `$${typeof variant.retailPrice === 'string' ? 
                      parseFloat(variant.retailPrice).toFixed(2) : 
                      variant.retailPrice.toFixed(2)
                    }` : 
                    'N/A'
                  }
                </TableCell>
                <TableCell>
                  {variant.wholesalePrice ? 
                    `$${typeof variant.wholesalePrice === 'string' ? 
                      parseFloat(variant.wholesalePrice).toFixed(2) : 
                      variant.wholesalePrice.toFixed(2)
                    }` : 
                    'N/A'
                  }
                </TableCell>
                <TableCell>
                  {getVariantTotalStock(variant)}
                </TableCell>
                <TableCell>
                  <Badge variant={variant.isActive ? "default" : "secondary"}>
                    {variant.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => onEdit(variant)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDeleteClick(variant)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the variant "{variantToDelete?.name}". 
              This action cannot be undone and may affect inventory records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 