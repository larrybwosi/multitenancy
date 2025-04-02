"use client";

import { useState, useMemo } from "react";
import { MockProduct, MockCustomer } from "./mock-data";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  stock: number;
}

const DEFAULT_TAX_RATE = 8;
const LOYALTY_POINTS_PER_AMOUNT = 10;
const POINTS_TO_KES_RATE = 100;

interface UseCartProps {
  products: MockProduct[];
  selectedCustomer?: MockCustomer;
}

export default function useCart({ products, selectedCustomer }: UseCartProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [pointsToRedeem, setPointsToRedeemState] = useState(0);

  const availableLoyaltyPoints = selectedCustomer?.loyalty_points ?? 0;

  const setPointsToRedeem = (points: number) => {
    setPointsToRedeemState(Math.min(points, availableLoyaltyPoints));
  };

  const redeemMaxPoints = () => {
    setPointsToRedeem(availableLoyaltyPoints);
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const taxAmount = useMemo(
    () => subtotal * (DEFAULT_TAX_RATE / 100),
    [subtotal]
  );

  const redeemedAmount = useMemo(
    () => (pointsToRedeem > 0 ? pointsToRedeem / POINTS_TO_KES_RATE : 0),
    [pointsToRedeem]
  );

  const total = useMemo(
    () => Math.max(0, subtotal + taxAmount - redeemedAmount),
    [subtotal, taxAmount, redeemedAmount]
  );

  const pointsEarned = useMemo(
    () => Math.floor(subtotal / LOYALTY_POINTS_PER_AMOUNT),
    [subtotal]
  );

  const addItem = (product: MockProduct) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const currentStock = product.stock - (existing?.quantity || 0);

      if (existing) {
        return currentStock > 0
          ? prev.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : prev;
      } else {
        return currentStock > 0
          ? [
              ...prev,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image_url: product.image_url,
                stock: product.stock,
              },
            ]
          : prev;
      }
    });
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    setItems((prev) => {
      if (newQuantity <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }
      return prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(newQuantity, item.stock) }
          : item
      );
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setPointsToRedeem(0);
  };

  const getProductStock = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    const cartItem = items.find((item) => item.productId === productId);
    return (product?.stock ?? 0) - (cartItem?.quantity ?? 0);
  };

  return {
    items,
    subtotal,
    taxAmount,
    total,
    redeemedAmount,
    pointsToRedeem,
    pointsEarned,
    availableLoyaltyPoints,
    pointsToKesRate: POINTS_TO_KES_RATE,
    setPointsToRedeem,
    redeemMaxPoints,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getProductStock,
  };
}
