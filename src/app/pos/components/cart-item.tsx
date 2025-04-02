"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onRemoveItem: (productId: number) => void;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemoveItem,
}: CartItemProps) {
  const canIncrease = item.quantity < item.stock;

  const handleIncrease = () => {
    if (canIncrease) {
      onUpdateQuantity(item.productId, item.quantity + 1);
    }
  };

  const handleDecrease = () => {
    onUpdateQuantity(item.productId, item.quantity - 1);
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-12 w-12 rounded">
          <AvatarImage src={item.image_url ?? undefined} alt={item.name} />
          <AvatarFallback className="text-xs bg-secondary">
            {item.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-md font-medium truncate max-w-[150px]">
            {item.name}
          </p>
          <p className="text-sm text-muted-foreground">
            KES {item.price.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleDecrease}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium w-6 text-center">
          {item.quantity}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleIncrease}
          disabled={!canIncrease}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemoveItem(item.productId)}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
