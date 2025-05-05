'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  useQueryState,
  parseAsString,
  // parseAsStringEnum, // Not needed now for category
} from 'nuqs';
import { toast } from 'sonner';

// Import Actions
import { getProducts } from '@/actions/products'; // *** Use the new product action ***

// Import Components
import ProductGrid from './ProductGrid';
import OrderPanel from './OrderPanel';
import ProductDetailDialog from './ProductDetailDialog';

// Import Types
import type {
    ProductWithCalculatedStock, // *** Use updated product type ***
    VariantWithCalculatedStock, // *** Use updated variant type ***
    CategoryInfo, // *** Use updated category type ***
    CartItem,
    CustomerSearchResult,
} from '../types'; // Adjust path
import { processSale, searchCustomersForPOS } from '@/actions/pos.actions';
import { PaymentMethod } from '@/prisma/client';


interface PosClientPageProps {
  categories: CategoryInfo[];
  locationId: string;
}

// Define default fetch limit
const PRODUCT_FETCH_LIMIT = 48; // Fetch more items per "page"

export default function PosClientPage({ categories, locationId }: PosClientPageProps) {
  const [isPending, startTransition] = useTransition();

  // nuqs for active category ID state synced with URL (?category=...)
  // Default to the ID of the first category ('all')
  const [activeCategoryId, setActiveCategoryId] = useQueryState(
    'category',
    parseAsString.withDefault(categories[0]?.id ?? 'all')
  );

  const [selectedProductId, setSelectedProductId] = useQueryState(
    'productId',
    parseAsString // Use string for Prisma IDs
  );

  // Products state using the new type
  const [products, setProducts] = useState<ProductWithCalculatedStock[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productMeta, setProductMeta] = useState<{ totalPages: number; currentPage: number } | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Customer State remains the same
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);

  // === Derived State ===
  const selectedProduct = products.find(p => p.id === selectedProductId);

  // === Data Fetching Effects ===

  // Updated function to use getProducts
  const fetchProducts = useCallback((query: string, categoryId: string | null, page: number = 1) => {
    setIsLoadingProducts(true);
    startTransition(async () => {
      try {
        const options = {
          search: query || undefined,
          categoryId: categoryId === 'all' ? undefined : categoryId, // Use undefined for 'all'
          limit: PRODUCT_FETCH_LIMIT,
          page: page,
          includeVariants: true,
          includeCategory: true, // Fetch category info if needed for display
          // We don't fetch stock info here as getProducts calculates it
          // sortBy: 'name', // Default sort
          // sortOrder: 'asc',
        };
        console.log(`Fetching products with options:`, options);

        const result = await getProducts(options); // Call the new action

        if (result.error) {
            throw new Error(result.error);
        }

        if (result.data && result.meta) {
            console.log(`Fetched ${result.data.length} products. Meta:`, result.meta);
            setProducts(result.data); // Set fetched products
            setProductMeta({ totalPages: result.meta.totalPages, currentPage: result.meta.currentPage }); // Store pagination info
        } else {
             console.warn("No data or meta received from getProducts");
             setProducts([]);
             setProductMeta(null);
        }

      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load products.");
        setProducts([]);
        setProductMeta(null);
      } finally {
        setIsLoadingProducts(false);
      }
    });
  }, [locationId]); // locationId might be needed if stock calculation moves back here, but not currently used by getProducts directly

  // Effect to fetch products when search query or category changes
  useEffect(() => {
    const handler = setTimeout(() => {
      // Fetch page 1 whenever query or category changes
      fetchProducts(searchQuery, activeCategoryId, 1);
    }, 300); // Debounce search

    return () => clearTimeout(handler);
  }, [searchQuery, activeCategoryId, fetchProducts]);


   // --- Customer search effect remains the same ---
   const fetchCustomers = useCallback((query: string) => {
     // ... (customer search logic as before) ...
     if (query.length < 2) {
       setCustomerSearchResults([]);
       return;
     }
     setIsSearchingCustomers(true);
     startTransition(async () => {
       try {
         const results = await searchCustomersForPOS(query);
         setCustomerSearchResults(results);
       } catch (error) {
         console.error("Failed to search customers:", error);
         toast.error("Failed to search customers.");
         setCustomerSearchResults([]);
       } finally {
         setIsSearchingCustomers(false);
       }
     });
   }, []);

   useEffect(() => {
      const handler = setTimeout(() => {
        fetchCustomers(customerSearchQuery);
      }, 300);
      return () => clearTimeout(handler);
   }, [customerSearchQuery, fetchCustomers]);

  // === Event Handlers ===

  // Updated AddToCart to handle string prices
  const handleAddToCart = useCallback((product: ProductWithCalculatedStock, variant: VariantWithCalculatedStock | null, quantity: number) => {
    setCart((prevCart) => {
        const variantId = variant?.id ?? null;
        const cartItemId = `${product.id}-${variantId || 'base'}`;

        // *** Calculate price from string inputs ***
        const basePrice = parseFloat(product.basePrice || '0'); // Safely parse base price
        const modifier = variant ? parseFloat(variant.priceModifier || '0') : 0; // Safely parse modifier
        const unitPrice = basePrice + modifier;

        if (isNaN(unitPrice)) {
            console.error("Error calculating unit price for", product.name, variant?.name);
            toast.error("Could not determine item price.");
            return prevCart; // Don't add item if price is invalid
        }

        const existingItemIndex = prevCart.findIndex(item => item.id === cartItemId);
        let newCart = [...prevCart];

        if (existingItemIndex > -1) {
            newCart[existingItemIndex] = {
            ...newCart[existingItemIndex],
            quantity: newCart[existingItemIndex].quantity + quantity,
            };
        } else {
            newCart.push({
            id: cartItemId,
            productId: product.id,
            variantId: variantId,
            name: variant ? `${product.name} (${variant.name})` : product.name,
            productName: product.name,
            variantName: variant?.name,
            price: unitPrice, // Use calculated numeric price
            quantity: quantity,
            image: product.image || variant?.image,
            sku: variant?.sku || product.sku,
            });
        }
        toast.success(`${variant ? variant.name : product.name} added to cart.`);
        return newCart;
        });
     setSelectedProductId(null);
  }, [setSelectedProductId]);


  // --- Other handlers remain largely the same ---
  // handleQuantityChange, handleRemoveItem, handleResetOrder, handleSelectCustomer, handleClearCustomer,
  // handleOpenProductDetail, handleCloseProductDetail, handleProcessSale

   const handleQuantityChange = (cartItemId: string, change: number) => {
       setCart((prevCart) =>
         prevCart
           .map((item) => {
             if (item.id === cartItemId) {
               const newQuantity = item.quantity + change;
               return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
             }
             return item;
           })
           .filter((item): item is CartItem => item !== null)
       );
   };

   const handleRemoveItem = (cartItemId: string) => {
      setCart((prevCart) => {
          const itemToRemove = prevCart.find(item => item.id === cartItemId);
          if (itemToRemove) {
             toast.info(`${itemToRemove.name} removed from cart.`);
          }
          return prevCart.filter((item) => item.id !== cartItemId)
      });
   };

   const handleResetOrder = () => {
       if (cart.length > 0) {
          setCart([]);
          setSelectedCustomer(null);
          setCustomerSearchQuery('');
          toast.success("Order reset.");
       }
   };

   const handleSelectCustomer = (customer: CustomerSearchResult) => {
       setSelectedCustomer(customer);
       setCustomerSearchResults([]);
       setCustomerSearchQuery(customer.name);
       toast.info(`Customer selected: ${customer.name}`);
   };

   const handleClearCustomer = () => {
       setSelectedCustomer(null);
       setCustomerSearchQuery('');
       setCustomerSearchResults([]);
   };

   const handleOpenProductDetail = (productId: string) => {
       setSelectedProductId(productId);
   };

   const handleCloseProductDetail = () => {
       // ... (same as before) ...
       setSelectedProductId(null);
   };

   const handleProcessSale = async (paymentMethod: PaymentMethod) => {
       // ... (sale processing logic remains the same, relying on CartItem structure) ...
        if (cart.length === 0) {
           toast.warning("Cart is empty. Cannot process sale.");
           return;
       }
       toast.loading("Processing sale...");
       const saleData = {
           cartItems: cart.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
           })),
           customerId: selectedCustomer?.id,
           paymentMethod: paymentMethod,
           discountAmount: 0, // Placeholder for discount logic
       };
       startTransition(async () => {
          try {
            const result = await processSale(saleData);
            toast.dismiss();
            if (result.success) {
              toast.success(`Sale Successful! ID: ${result.saleId}`);
              setCart([]);
              setSelectedCustomer(null);
              setCustomerSearchQuery('');
            } else {
              toast.error(`Sale Failed: ${result.message}`);
              console.error("Sale failed details:", result.error);
            }
          } catch (error) {
            toast.dismiss();
            console.error("Error calling processSale:", error);
            toast.error("An unexpected error occurred.");
          }
       });
   };

  return (
    <>
      <ProductGrid
        products={products}
        categories={categories} // Pass categories with IDs
        activeCategoryId={activeCategoryId} // Pass category ID
        setActiveCategoryId={setActiveCategoryId} // Function expects ID
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenProductDetail={handleOpenProductDetail}
        isLoading={isLoadingProducts || isPending}
        // Pass pagination info and handler if implementing pagination controls
        // currentPage={productMeta?.currentPage}
        // totalPages={productMeta?.totalPages}
        // onPageChange={(newPage) => fetchProducts(searchQuery, activeCategoryId, newPage)}
      />

      <OrderPanel
        cart={cart}
        // Customer props remain the same
        customerSearchQuery={customerSearchQuery}
        setCustomerSearchQuery={setCustomerSearchQuery}
        customerSearchResults={customerSearchResults}
        selectedCustomer={selectedCustomer}
        isSearchingCustomers={isSearchingCustomers || isPending}
        onSelectCustomer={handleSelectCustomer}
        onClearCustomer={handleClearCustomer}
        // Cart handlers remain the same
        onQuantityChange={handleQuantityChange}
        onRemoveItem={handleRemoveItem}
        onResetOrder={handleResetOrder}
        onProcessSale={handleProcessSale}
        isProcessing={isPending}
      />

      <ProductDetailDialog
        product={selectedProduct} // Type is now ProductWithCalculatedStock | null
        isOpen={!!selectedProductId && !!selectedProduct}
        onClose={handleCloseProductDetail}
        onAddToCart={handleAddToCart} // Handler now expects ProductWithCalculatedStock
        locationId={locationId}
      />
      
    </>
  );
}