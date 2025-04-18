"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQueryState, parseAsArrayOf, parseAsString } from "nuqs";
import { ProductGrid } from "./ProductGrid";
import { Cart } from "./Cart";
import { Customer, Prisma, Product } from "@prisma/client";
import { processSale } from "@/actions/pos.actions";



interface CartItem {
  id: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
  variantId: string | null;
}

interface PosClientWrapperProps {
  products?: Product[];
  customers?: Customer[];
}

const safeDecimal = (value: unknown): Prisma.Decimal => {
  try {
    if (value instanceof Prisma.Decimal) return value;
    if (typeof value === "string" || typeof value === "number") {
      return new Prisma.Decimal(value);
    }
    return new Prisma.Decimal(0);
  } catch {
    return new Prisma.Decimal(0);
  }
};

export function PosClientWrapper({
  products = [],
  customers = [],
}: PosClientWrapperProps) {
  const [cartProductIds, setCartProductIds] = useQueryState(
    "cartItems",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>(
    {}
  );

  const cartItems = useMemo(() => {
    const productsWithDecimal = products.map((p) => ({
      ...p,
      basePrice: safeDecimal(p.basePrice),
    }));

    return cartProductIds
      .map((productId) => {
        const product = productsWithDecimal.find((p) => p.id === productId);
        if (!product) return null;

        const quantity = cartQuantities[productId] || 0;
        const unitPrice = safeDecimal(product.basePrice);
        const totalPrice = unitPrice.mul(quantity);

        return {
          ...product,
          quantity,
          unitPrice,
          totalPrice,
          variantId: null,
        };
      })
      .filter((item): item is CartItem => item !== null && item.quantity > 0);
  }, [cartProductIds, cartQuantities, products]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum.add(item.totalPrice);
    }, new Prisma.Decimal(0));
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
    (productId: string, newQuantity: number) => {
      const quantity = Math.max(0, newQuantity);
      setCartQuantities((prevQtys) => {
        if (quantity === 0) {
          //eslint-disable-next-line
          const { [productId]: _, ...rest } = prevQtys;
          setCartProductIds((prevIds) =>
            prevIds.filter((id) => id !== productId)
          );
          return rest;
        } else {
          return { ...prevQtys, [productId]: quantity };
        }
      });
    },
    [setCartProductIds]
  );

  const removeProductFromCart = useCallback(
    (productId: string) => {
      setCartProductIds((prevIds) => prevIds.filter((id) => id !== productId));
      setCartQuantities((prevQtys) => {
        //eslint-disable-next-line
        const { [productId]: _, ...rest } = prevQtys;
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
    async (saleData: {
      customerId?: string;
      paymentMethod: string;
      notes?: string;
      items: CartItem[];
    }) => {
      const formData = new FormData();
      formData.append("customerId", saleData.customerId || "");
      formData.append("paymentMethod", saleData.paymentMethod);
      formData.append("notes", saleData.notes || "");

      const actionItems = saleData.items
      
      formData.append("items", JSON.stringify(actionItems));
      return await processSale(formData);
    },
    []
  );

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20 dark:bg-neutral-900/50">
      {/* Product Grid Area */}
      <div className="flex-grow h-full overflow-auto p-4 md:p-6">
        <ProductGrid products={products} onAddToCart={addProductToCart} />
      </div>

      {/* Cart Area */}
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
