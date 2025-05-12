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
  AlertTriangle,
  Star,
  StarOff
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
import { useDeleteProductSupplier } from '@/lib/hooks/use-product-detail';

interface ProductSupplier {
  id: string;
  supplierId: string;
  supplierSku?: string | null;
  costPrice: number | string;
  minimumOrderQuantity?: number | null;
  packagingUnit?: string | null;
  isPreferred: boolean;
  supplier: {
    id: string;
    name: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

interface ProductVariant {
  id: string;
  name: string;
  suppliers: ProductSupplier[];
}

interface Supplier {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface ProductSuppliersListProps {
  variants: ProductVariant[];
  allSuppliers: Supplier[];
  onEdit: (supplier: ProductSupplier) => void;
  productId: string;
}

export default function ProductSuppliersList({ 
  variants, 
  allSuppliers, 
  onEdit, 
  productId 
}: ProductSuppliersListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<ProductSupplier | null>(null);
  
  const deleteSupplierMutation = useDeleteProductSupplier();

  const handleDeleteClick = (supplier: ProductSupplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (supplierToDelete) {
      deleteSupplierMutation.mutate({ 
        id: supplierToDelete.id, 
        productId 
      });
    }
    setDeleteDialogOpen(false);
  };

  // Flatten all suppliers from all variants for display
  const allVariantSuppliers = variants.flatMap(variant => 
    variant.suppliers?.map(supplier => ({
      ...supplier,
      variantName: variant.name,
      variantId: variant.id
    })) || []
  );

  if (allVariantSuppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertTriangle className="h-10 w-10 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No Suppliers Found</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          This product doesn&apos;t have any suppliers added yet.
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
              <TableHead>Supplier</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>Supplier SKU</TableHead>
              <TableHead>Cost Price</TableHead>
              <TableHead>Min. Order Qty</TableHead>
              <TableHead>Packaging</TableHead>
              <TableHead>Preferred</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allVariantSuppliers.map((supplierData) => (
              <TableRow key={supplierData.id}>
                <TableCell className="font-medium">{supplierData.supplier.name}</TableCell>
                <TableCell>{supplierData.variantName}</TableCell>
                <TableCell>{supplierData.supplierSku || 'N/A'}</TableCell>
                <TableCell>
                  ${typeof supplierData.costPrice === 'string' ? 
                    parseFloat(supplierData.costPrice).toFixed(2) : 
                    supplierData.costPrice.toFixed(2)
                  }
                </TableCell>
                <TableCell>{supplierData.minimumOrderQuantity || 'None'}</TableCell>
                <TableCell>{supplierData.packagingUnit || 'N/A'}</TableCell>
                <TableCell>
                  {supplierData.isPreferred ? (
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="h-5 w-5 text-gray-300" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => onEdit(supplierData)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDeleteClick(supplierData)}
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
              This will permanently remove the supplier &quot;{supplierToDelete?.supplier.name}&quot; from this product variant.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 