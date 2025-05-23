"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQueryState, parseAsArrayOf, parseAsString } from "nuqs";
import { ProductGrid } from "./ProductGrid";
import { Customer, PaymentMethod } from "@/prisma/client";
import { useAppStore } from "@/store/app";
import { SaleData, SaleResult } from "../types";
import { toast } from "sonner";
import { useSubmitSale } from "@/hooks/use-sales";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MotionDiv } from "@/components/motion";
import Cart from "./cart";

interface ProjectCartItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  productName: string;
  variantName?: string;
  price: number; // This will be calculated from string basePrice + string priceModifier
  quantity: number;
  imageUrls?: string[] | null;
  sku?: string | null;
}

type CartItem = Omit<ProjectCartItem, "sku"> & {
  unitPrice: string | number;
  totalPrice: number;
  sku: string; // Make SKU non-nullable
};


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
  const [cartVisible, setCartVisible] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);

  const warehouse = useAppStore(state => state.currentWarehouse);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync } = useSubmitSale();

  // Check viewport size on mount and window resize
  useEffect(() => {
    const checkViewport = () => {
      setIsMobileView(window.innerWidth < 1024);
      // Auto-hide cart on mobile view initially
      if (window.innerWidth < 1024) {
        setCartVisible(false);
      } else {
        setCartVisible(true);
      }
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const cartItems = useMemo(() => {
    return cartProductIds
      .map(productId => {
        const product = products.find(p => p.id === productId);
        if (!product) return null;
        // Get default variant id
        // TODO: Use selected variant
        const defaultVariantId = product?.variants[0]?.id;

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
      // Auto show cart when adding first item on mobile
      if (isMobileView && cartProductIds.length === 0) {
        setCartVisible(true);
      }
      
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
    [setCartProductIds, isMobileView, cartProductIds.length]
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
    [cartItems, warehouse?.id, clearCart, mutateAsync]
  );

  const toggleCart = () => {
    setCartVisible(prev => !prev);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-neutral-950 dark:to-neutral-900">
      {/* Cart toggle button for mobile/tablet */}
      {isMobileView && (
        <button 
          onClick={toggleCart}
          className="fixed z-50 bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-all duration-300 flex items-center justify-center"
          aria-label={cartVisible ? "Hide cart" : "Show cart"}
        >
          {cartVisible ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
        </button>
      )}
      
      <MotionDiv 
        className="flex-grow h-full overflow-auto p-4 md:p-6 transition-all duration-300"
        animate={{ 
          width: isMobileView && cartVisible ? "0%" : "100%",
          opacity: isMobileView && cartVisible ? 0 : 1,
          display: isMobileView && cartVisible ? "none" : "block"
        }}
      >
        <div className="max-w-[2000px] mx-auto">
          <ProductGrid
            products={products}
            onAddToCart={addProductToCart}
            getProductUrl={product => (product.sku ? product.sku.toLowerCase() : '')}
          />
        </div>
      </MotionDiv>

      <AnimatePresence>
        {(cartVisible || !isMobileView) && (
          <MotionDiv 
            className="h-full flex-shrink-0 bg-white dark:bg-neutral-900"
            initial={isMobileView ? { x: "100%" } : { x: 0 }}
            animate={{ x: 0 }}
            exit={isMobileView ? { x: "100%" } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ 
              width: isMobileView ? "100%" : "clamp(400px, 30vw, 500px)",
              position: isMobileView ? "fixed" : "relative",
              top: 0,
              right: 0,
              zIndex: 40
            }}
          >
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
                onClose={isMobileView ? toggleCart : undefined}
              />
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
