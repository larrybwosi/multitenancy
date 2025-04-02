import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InventoryValuationItem } from "../types";
import { Label } from "@/components/ui/label";

const RestockDialog = ({
  product,
  quantity,
  onClose,
  onConfirm,
}: {
  product: InventoryValuationItem;
  quantity: number;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Restock</DialogTitle>
          <DialogDescription>
            You are about to restock {quantity} units of {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Current Stock</Label>
              <p>{product.stock}</p>
            </div>
            <div>
              <Label>After Restock</Label>
              <p className="font-bold">{product.stock + quantity}</p>
            </div>
          </div>

          <div>
            <Label>Selling Unit</Label>
            <p>{product.sellingUnit}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Confirm Restock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RestockDialog;
