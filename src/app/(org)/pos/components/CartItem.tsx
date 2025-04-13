"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PlusCircle, MinusCircle, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CartItemProps } from "../types";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function CartItem({
  item,
  onUpdateQuantity,
  onRemoveItem,
}: CartItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [inputValue, setInputValue] = useState(item.quantity.toString());
  const [isAnimating, setIsAnimating] = useState(false);

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
      onRemoveItem(item.id);
    }
  }, [item.id, item.quantity, onUpdateQuantity, onRemoveItem]);

  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);

      if (value === "") return;

      const newQuantity = parseInt(value, 10);
      if (!isNaN(newQuantity) && newQuantity >= 0) {
        if (newQuantity === 0) {
          onRemoveItem(item.id);
        } else {
          onUpdateQuantity(item.id, newQuantity);
          triggerAnimation();
        }
      }
    },
    [item.id, onUpdateQuantity, onRemoveItem]
  );

  const handleRemove = useCallback(() => {
    onRemoveItem(item.id);
  }, [item.id, onRemoveItem]);

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <TableRow
      className={cn(
        "hover:bg-muted/20 transition-colors relative",
        isHovered && "bg-muted/10",
        isAnimating && "bg-blue-50/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TableCell className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <p className="font-medium text-sm truncate text-gray-800">
              {item.name}
            </p>
            {item.sku && (
              <Badge
                variant="outline"
                className="mt-1 text-xs font-normal bg-gray-100 border-gray-200"
              >
                {item.sku}
              </Badge>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="py-4 px-2 text-center w-[140px]">
        <div className="flex items-center justify-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  "text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200",
                  "focus-visible:ring-2 focus-visible:ring-blue-200"
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
              "border-gray-300 focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-200",
              "hover:border-gray-400"
            )}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  "text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200",
                  "focus-visible:ring-2 focus-visible:ring-blue-200"
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

      <TableCell className="py-4 px-4 text-right text-sm w-[100px]">
        <span className="text-gray-600 font-medium">
          {formatCurrency(item.unitPrice)}
        </span>
      </TableCell>

      <TableCell className="py-4 px-4 text-right text-sm w-[120px]">
        <span className="font-semibold text-gray-800">
          {formatCurrency(item.totalPrice)}
        </span>
      </TableCell>

      <TableCell className="py-4 pl-2 pr-4 text-right w-[50px]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                "text-gray-400 hover:text-red-600 hover:bg-red-50",
                isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                "focus-visible:ring-2 focus-visible:ring-red-200"
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
