"use client";

import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PlusCircle, MinusCircle, X, ImageIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CartItemProps } from "../types";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function CartItem({
  item,
  onUpdateQuantity,
  onRemoveItem,
}: CartItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [inputValue, setInputValue] = useState(item.quantity.toString());
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Update local input value when item quantity changes externally
  useEffect(() => {
    setInputValue(item.quantity.toString());
  }, [item.quantity]);

  const handleIncrement = useCallback(() => {
    const newQuantity = item.quantity + 1;
    onUpdateQuantity(item.id, newQuantity);
    setInputValue(newQuantity.toString());
    triggerAnimation();
  }, [item.id, item.quantity, onUpdateQuantity]);

  const handleDecrement = useCallback(() => {
    if (item.quantity > 1) {
      const newQuantity = item.quantity - 1;
      onUpdateQuantity(item.id, newQuantity);
      setInputValue(newQuantity.toString());
      triggerAnimation();
    } else {
      handleRemove();
    }
  }, [item.id, item.quantity, onUpdateQuantity]);

  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);

      if (value === "") return;

      const newQuantity = parseInt(value, 10);
      if (!isNaN(newQuantity) && newQuantity >= 0) {
        if (newQuantity === 0) {
          handleRemove();
        } else {
          onUpdateQuantity(item.id, newQuantity);
          triggerAnimation();
        }
      }
    },
    [item.id, onUpdateQuantity]
  );

  const handleRemove = useCallback(() => {
    setIsRemoving(true);
    // Add small delay for animation
    setTimeout(() => {
      onRemoveItem(item.id);
    }, 300);
  }, [item.id, onRemoveItem]);

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const hasImages = item.imageUrls?.length!== undefined;
  
  return (
    <TableRow
      className={cn(
        "hover:bg-muted/20 transition-all duration-300 relative",
        isHovered && "bg-muted/10",
        isAnimating && "bg-blue-50/50 dark:bg-blue-900/10",
        isRemoving && "opacity-50 scale-98 pointer-events-none"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TableCell className="py-3 px-4">
        <div className="flex items-center gap-3">
          {hasImages && item.imageUrls ?(
            <div className="h-12 w-12 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-900">
              <Image
                src={item?.imageUrls[0]}
                width={48}
                height={48}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          ):(
            <div className="h-12 w-12 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-900">
              <ImageIcon className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative flex-1 min-w-0">
            <p className="font-medium text-sm truncate text-gray-800 dark:text-gray-200">
              {item.name}
            </p>
            {item.sku && (
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="text-xs font-normal bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  {item.sku}
                </Badge>
                {item.inStock === false && (
                  <Badge variant="destructive" className="text-xs">
                    Out of stock
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="py-3 px-2 text-center w-[140px]">
        <div className="flex items-center justify-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700",
                  "focus-visible:ring-2 focus-visible:ring-blue-200 dark:focus-visible:ring-blue-800"
                )}
                onClick={handleDecrement}
              >
                <MinusCircle size={16} className="stroke-[2.5]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Decrease quantity
            </TooltipContent>
          </Tooltip>

          <Input
            type="number"
            min="1"
            value={inputValue}
            onChange={handleQuantityChange}
            onBlur={() => setInputValue(item.quantity.toString())}
            className={cn(
              "h-8 w-14 text-center px-1 transition-all",
              "border-gray-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-200 dark:focus-visible:ring-blue-800",
              "hover:border-gray-400 dark:hover:border-gray-600"
            )}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700",
                  "focus-visible:ring-2 focus-visible:ring-blue-200 dark:focus-visible:ring-blue-800"
                )}
                onClick={handleIncrement}
              >
                <PlusCircle size={16} className="stroke-[2.5]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Increase quantity
            </TooltipContent>
          </Tooltip>
        </div>
      </TableCell>

      <TableCell className="py-3 px-4 text-right text-sm w-[100px]">
        <span className="text-gray-600 dark:text-gray-400 font-medium">
          {formatCurrency(item.unitPrice)}
        </span>
      </TableCell>

      <TableCell className="py-3 px-4 text-right text-sm w-[120px]">
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {formatCurrency(item.totalPrice)}
        </span>
        {item.discounted && (
          <div className="text-xs mt-1 text-green-600 dark:text-green-400 font-medium">
            Discounted
          </div>
        )}
      </TableCell>

      <TableCell className="py-3 pl-2 pr-4 text-right w-[50px]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                "text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
                isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                "focus-visible:ring-2 focus-visible:ring-red-200 dark:focus-visible:ring-red-800"
              )}
              onClick={handleRemove}
            >
              <X size={16} className="stroke-[2.5]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Remove item
          </TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
