"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQueryState, parseAsArrayOf, parseAsString } from "nuqs";
import { ProductGrid } from "./ProductGrid";
import { Customer, PaymentMethod } from "@/prisma/client";
import { CartItem as ProjectCartItem } from "@/app/point-of-sale/types";
import { useAppStore } from "@/store/app";
import Cart, { SaleData as CartSaleData, SaleResult } from "./cart-test";
import { ExtendedProduct } from "../types";
import { toast } from "sonner";
import { useSubmitSale } from "@/hooks/use-sales";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
// Use the project's CartItem interface with additional required fields
type CartItem = Omit<ProjectCartItem, "sku"> & {
  unitPrice: string | number;
  totalPrice: number;
  sku: string; // Make SKU non-nullable
};

// Our component's internal SaleData interface 
interface SaleData extends CartSaleData {
  items: CartItem[]; // Add items that our component needs internally
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
  enableStockTracking: boolean;
}

interface PosClientWrapperProps {
  products?: ExtendedProduct[];
  customers?: Customer[];
}

export function PosClientWrapper({
  products = [],
  customers = [],
}: PosClientWrapperProps) {
  const [cartProductIds, setCartProductIds] = useQueryState('cartItems', parseAsArrayOf(parseAsString).withDefault([]));

  const warehouse = useAppStore(state => state.currentWarehouse);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync } = useSubmitSale();

  const cartItems = useMemo(() => {
    return cartProductIds
      .map(productId => {
        const product = products.find(p => p.id === productId);
        if (!product) return null;
        // Get default variant id
        // TODO: Use selected variant
        const defaultVariantId = product.variants[0].id;

        const quantity = cartQuantities[productId] || 0;
        // Convert string price to number for display
        const price = parseFloat(product.sellingPrice.toString());
        if (isNaN(price)) return null;

        return {
          id: product.id,
          productId: product.id,
          name: product.name,
          productName: product.name,
          sku: product.sku,
          quantity,
          price,
          unitPrice: price, // Add unit price
          variantId: defaultVariantId,
          imageUrls: product.imageUrls || null,
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

    cartProductIds.forEach(id => {
      if (cartQuantities[id] === undefined) {
        initialQuantities[id] = 1;
        updateNeeded = true;
      } else {
        initialQuantities[id] = cartQuantities[id];
      }
    });

    Object.keys(cartQuantities).forEach(id => {
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
      setCartProductIds(prevIds => {
        if (prevIds.includes(productId)) {
          setCartQuantities(prevQtys => ({
            ...prevQtys,
            [productId]: (prevQtys[productId] || 0) + 1,
          }));
          return prevIds;
        } else {
          setCartQuantities(prevQtys => ({ ...prevQtys, [productId]: 1 }));
          return [...prevIds, productId];
        }
      });
    },
    [setCartProductIds]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      const newQuantity = Math.max(0, quantity);
      setCartQuantities(prevQtys => {
        if (newQuantity === 0) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [productId]: omitted, ...rest } = prevQtys;
          setCartProductIds(prevIds => prevIds.filter(id => id !== productId));
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
      setCartProductIds(prevIds => prevIds.filter(id => id !== productId));
      setCartQuantities(prevQtys => {
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
    async (cartSaleData: CartSaleData): Promise<SaleResult> => {
      if (!warehouse?.id) {
        toast.error('No warehouse selected');
        throw new Error('No warehouse selected');
      }

      setIsSubmitting(true);
      try {
        // Create our internal SaleData with items
        const saleData: SaleData = {
          ...cartSaleData,
          items: cartItems,
        };

        const processData: ProcessSaleInput = {
          cartItems: cartItems.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          locationId: warehouse?.id,
          customerId: saleData.customerId || undefined,
          paymentMethod: saleData.paymentMethod as PaymentMethod,
          notes: saleData.notes,
          discountAmount: 0,
          enableStockTracking: false,
        };

        const result = await mutateAsync(processData);

        // Clear cart on successful sale
        clearCart();
        toast.success('Sale completed successfully');

        return result.data;
      } catch (error) {
        console.error('Error processing sale:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to process sale');
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [cartItems, warehouse?.id, clearCart]
  );

  const handlePrint = async () => {

  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20 dark:bg-neutral-900/50">
      <Button className="fixed top-4 right-4 z-50" onClick={() => handlePrint()}>
        <Printer className="h-5 w-5 mr-2" />
        Test Receipt
      </Button>
      <div className="flex-grow h-full overflow-auto p-4 md:p-6">
        <ProductGrid
          products={products}
          onAddToCart={addProductToCart}
          getProductUrl={product => (product.sku ? product.sku.toLowerCase() : '')}
        />
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
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
