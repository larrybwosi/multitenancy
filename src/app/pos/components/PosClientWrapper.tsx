"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQueryState, parseAsArrayOf, parseAsString } from "nuqs";
import { ProductGrid } from "./ProductGrid";
import { Cart } from "./Cart";
import { Customer, PaymentMethod } from "@prisma/client";
import { CartItem as ProjectCartItem } from "@/app/point-of-sale/types";
import { processSale } from "@/actions/pos.actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/app";

// Update BaseProduct to include missing required fields with non-nullable SKU
type BaseProduct = {
  id: string;
  name: string;
  sku: string; // Make SKU non-nullable
  basePrice: string;
  image?: string | null;
  barcode: string | null;
  imageUrls?: string[] | null;
};

// Use the project's CartItem interface with additional required fields
type CartItem = Omit<ProjectCartItem, "sku"> & {
  unitPrice: string | number;
  totalPrice: number;
  sku: string; // Make SKU non-nullable
};

// Use the shared PaymentMethod enum from lib/types
interface SaleData {
  customerId: string | null;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: CartItem[];
}

interface ProcessSaleInput {
  cartItems: Array<{
    productId: string;
    variantId: string | null;
    quantity: number;
  }>;
  locationId: string;
  customerId?: string;
  paymentMethod: PaymentMethod;
  discountAmount?: number;
  notes?: string;
}

interface PosClientWrapperProps {
  products?: BaseProduct[];
  customers?: Customer[];
}

export function PosClientWrapper({
  products = [],
  customers = [],
}: PosClientWrapperProps) {
  const [cartProductIds, setCartProductIds] = useQueryState(
    "cartItems",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const warehouse = useAppStore((state) => state.currentWarehouse);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  const cartItems = useMemo(() => {
    return cartProductIds
      .map((productId) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return null;

        const quantity = cartQuantities[productId] || 0;
        // Convert string price to number for display
        const price = parseFloat(product.basePrice);
        if (isNaN(price)) return null;

        return {
          id: product.id,
          productId: product.id,
          name: product.name,
          productName: product.name,
          sku: product.sku, // SKU is non-nullable
          quantity,
          price,
          unitPrice: price, // Add unit price
          variantId: null,
          imageUrls: product.image ? [product.image] : null,
          totalPrice: price * quantity, // Add total price
        } as CartItem;
      })
      .filter((item): item is CartItem => item !== null);
  }, [cartProductIds, cartQuantities, products]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  }, [cartItems]);

  useEffect(() => {
    const initialQuantities: Record<string, number> = {};
    let updateNeeded = false;

    cartProductIds.forEach((id) => {
      if (cartQuantities[id] === undefined) {
        initialQuantities[id] = 1;
        updateNeeded = true;
      } else {
        initialQuantities[id] = cartQuantities[id];
      }
    });

    Object.keys(cartQuantities).forEach((id) => {
      if (!cartProductIds.includes(id)) {
        updateNeeded = true;
      }
    });

    if (updateNeeded) {
      setCartQuantities(initialQuantities);
    }
  }, [cartProductIds, cartQuantities]);

  const addProductToCart = useCallback(
    (productId: string) => {
      setCartProductIds((prevIds) => {
        if (prevIds.includes(productId)) {
          setCartQuantities((prevQtys) => ({
            ...prevQtys,
            [productId]: (prevQtys[productId] || 0) + 1,
          }));
          return prevIds;
        } else {
          setCartQuantities((prevQtys) => ({ ...prevQtys, [productId]: 1 }));
          return [...prevIds, productId];
        }
      });
    },
    [setCartProductIds]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      const newQuantity = Math.max(0, quantity);
      setCartQuantities((prevQtys) => {
        if (newQuantity === 0) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [productId]: omitted, ...rest } = prevQtys;
          setCartProductIds((prevIds) =>
            prevIds.filter((id) => id !== productId)
          );
          return rest;
        } else {
          return { ...prevQtys, [productId]: newQuantity };
        }
      });
    },
    [setCartProductIds]
  );

  const removeProductFromCart = useCallback(
    (productId: string) => {
      setCartProductIds((prevIds) => prevIds.filter((id) => id !== productId));
      setCartQuantities((prevQtys) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [productId]: omitted, ...rest } = prevQtys;
        return rest;
      });
    },
    [setCartProductIds]
  );

  const clearCart = useCallback(() => {
    setCartProductIds([]);
    setCartQuantities({});
  }, [setCartProductIds]);

  const handleSaleSubmit = useCallback(
    async (saleData: SaleData) => {
      const processData: ProcessSaleInput = {
        cartItems: saleData.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        locationId:  'cm9e4ynql0000bkacheb1jxcd',
        customerId: saleData.customerId || undefined,
        paymentMethod: saleData.paymentMethod,
        notes: saleData.notes,
        discountAmount: 0,
      };

      const result = await processSale(processData);

      if (!result.success) {
        throw new Error(result.error || result.message);
      }

      return result;
    },
    []
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20 dark:bg-neutral-900/50">
      <Link href="/api/test-email" className="absolute top-4 left-4">
        <ArrowLeft className="w-4 h-4" />
      </Link>
      <div className="flex-grow h-full overflow-auto p-4 md:p-6">
        <ProductGrid products={products} onAddToCart={addProductToCart} />
      </div>

      <div className="w-full md:w-[400px] lg:w-[500px] h-full flex-shrink-0 bg-background border-l dark:bg-neutral-900 dark:border-neutral-800">
        <div className="h-full flex flex-col">
          <Cart
            cartItems={cartItems}
            cartTotal={cartTotal.toString()}
            customers={customers}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeProductFromCart}
            onClearCart={clearCart}
            onSubmitSale={handleSaleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
