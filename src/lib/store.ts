import { observable, computed, batch } from "@legendapp/state";
import { persistObservable } from "@legendapp/state/persist";
import { syncObservable } from "@legendapp/state/sync";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

// --- Types (Derived from your Prisma Schema) ---

// Basic types matching Prisma schema for frontend use
// In a real app, you might generate these or fetch from an API that returns typed data
type Product = {
  id: string;
  name: string;
  description?: string | null;
  sku: string;
  basePrice: number; // Use number for frontend, Prisma handles Decimal
  imageUrls: string[];
  variants: ProductVariant[];
  category: { id: string; name: string };
  // Add other relevant fields if needed
};

type ProductVariant = {
  id: string;
  productId: string;
  name: string; // e.g., "Red, Large"
  sku: string;
  priceModifier: number;
  attributes: Record<string, string>; // e.g., { "color": "Red", "size": "Large" }
};

type CartItem = {
  id: string; // Unique ID for the cart item instance (productId + variantId)
  productId: string;
  variantId?: string;
  name: string; // Combined product/variant name
  sku: string;
  quantity: number;
  unitPrice: number;
  image?: string; // Optional image for cart display
};

type PaymentMethod =
  | "CASH"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "MOBILE_PAYMENT"
  | "OTHER"; // Match Prisma Enum

type SaleRecord = {
  // Simplified Sale for offline sync example
  id: string; // Temporary client ID, replaced by server ID on sync
  localId: string; // Persistent client ID
  saleNumber?: string; // Assigned by backend later
  userId: string; // Logged in user
  items: Omit<CartItem, "image">[];
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "PENDING" | "COMPLETED"; // Simplified
  saleDate: string; // ISO string
  status: "pending" | "synced" | "error";
  createdAt: string; // ISO string
  // customerId?: string; // Add if needed
};

// --- Legendstate Store ---

export const store = observable({
  products: [] as Product[],
  categories: [] as { id: string; name: string }[],
  cart: {
    items: [] as CartItem[],
    customer: null as { id: string; name: string } | null, // Optional customer
  },
  ui: {
    selectedProductForDetails: null as Product | null,
    isProductSheetOpen: false,
    isPaymentModalOpen: false,
    isLoadingProducts: true,
    filterCategory: "all" as string, // 'all' or category ID
    searchTerm: "",
    // Add other UI states like loading indicators, errors, etc.
  },
  offline: {
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    pendingSales: [] as SaleRecord[], // Sales waiting to be synced
    // Add other offline-related states if needed (e.g., last sync time)
  },
  // --- Computed Values ---
  computed: {
    // Filtered products based on category and search term
    filteredProducts: computed((): Product[] => {
      const products = store.products.get();
      const categoryId = store.ui.filterCategory.get();
      const searchTerm = store.ui.searchTerm.get().toLowerCase();

      return products
        .filter((p) => categoryId === "all" || p.category.id === categoryId)
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.sku.toLowerCase().includes(searchTerm) ||
            p.variants.some((v) => v.sku.toLowerCase().includes(searchTerm))
        );
    }),

    // Cart calculations
    cartSubtotal: computed((): number => {
      return store.cart.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );
    }),
    cartTax: computed((): number => {
      // Implement your tax logic here (e.g., fixed rate, per item rate)
      const subtotal = store.computed.cartSubtotal.get();
      return subtotal * 0.05; // Example: 5% tax
    }),
    cartTotal: computed((): number => {
      const subtotal = store.computed.cartSubtotal.get();
      const tax = store.computed.cartTax.get();
      // Add discounts later if needed
      return subtotal + tax;
    }),
    cartItemCount: computed((): number => {
      return store.cart.items.reduce((sum, item) => sum + item.quantity, 0);
    }),
  },
});

// --- Actions ---

export const actions = {
  // Product Fetching (Replace with actual API call)
  loadProducts: async () => {
    store.ui.isLoadingProducts.set(true);
    try {
      // --- MOCK DATA --- Replace with API call
      // Example: const response = await fetch('/api/products');
      // const data = await response.json();
      const mockProducts: Product[] = [
        // Add 2-3 mock products based on your schema, including one with variants
        {
          id: "prod_1",
          name: "Organic Cotton T-Shirt",
          sku: "TSHIRT001",
          basePrice: 25.0,
          imageUrls: ["/placeholder-image.png"],
          category: { id: "cat_1", name: "Apparel" },
          variants: [
            {
              id: "var_1a",
              productId: "prod_1",
              name: "Red, M",
              sku: "TSHIRT001-RED-M",
              priceModifier: 0,
              attributes: { color: "Red", size: "M" },
            },
            {
              id: "var_1b",
              productId: "prod_1",
              name: "Blue, L",
              sku: "TSHIRT001-BLUE-L",
              priceModifier: 2.5,
              attributes: { color: "Blue", size: "L" },
            },
          ],
        },
        {
          id: "prod_2",
          name: "Reusable Coffee Mug",
          sku: "MUG005",
          basePrice: 15.5,
          imageUrls: ["/placeholder-image.png"],
          category: { id: "cat_2", name: "Homeware" },
          variants: [],
        },
        {
          id: "prod_3",
          name: "Wireless Earbuds",
          sku: "EARBUD012",
          basePrice: 79.99,
          imageUrls: ["/placeholder-image.png"],
          category: { id: "cat_3", name: "Electronics" },
          variants: [],
        },
      ];
      const mockCategories = [
        { id: "cat_1", name: "Apparel" },
        { id: "cat_2", name: "Homeware" },
        { id: "cat_3", name: "Electronics" },
      ];
      // --- END MOCK DATA ---
      store.products.set(mockProducts); // Replace mockProducts with data.products
      store.categories.set(mockCategories); // Replace mockCategories with data.categories
    } catch (error) {
      console.error("Failed to load products:", error);
      // Handle error state in UI
    } finally {
      store.ui.isLoadingProducts.set(false);
    }
  },

  // Cart Management
  addToCart: (
    product: Product,
    variant?: ProductVariant,
    quantity: number = 1
  ) => {
    batch(() => {
      // Use batch for multiple state updates
      const cartItemId = variant ? `${product.id}_${variant.id}` : product.id;
      const existingItem = store.cart.items.find(
        (item) => item.id === cartItemId
      );
      const price = product.basePrice + (variant?.priceModifier ?? 0);
      const name = variant ? `${product.name} (${variant.name})` : product.name;
      const sku = variant ? variant.sku : product.sku;

      if (existingItem) {
        existingItem.quantity.set((current) => current + quantity);
      } else {
        store.cart.items.push({
          id: cartItemId,
          productId: product.id,
          variantId: variant?.id,
          name: name,
          sku: sku,
          quantity: quantity,
          unitPrice: price,
          image: product.imageUrls[0] || "/placeholder-image.png",
        });
      }
    });
    // Optional: Add toast notification
  },

  updateCartQuantity: (cartItemId: string, newQuantity: number) => {
    const item = store.cart.items.find((i) => i.id === cartItemId);
    if (item) {
      if (newQuantity > 0) {
        item.quantity.set(newQuantity);
      } else {
        actions.removeFromCart(cartItemId); // Remove if quantity is 0 or less
      }
    }
  },

  removeFromCart: (cartItemId: string) => {
    store.cart.items.set((items) =>
      items.filter((item) => item.id !== cartItemId)
    );
  },

  clearCart: () => {
    store.cart.items.set([]);
    store.cart.customer.set(null);
  },

  // UI Actions
  openProductDetails: (product: Product) => {
    store.ui.selectedProductForDetails.set(product);
    store.ui.isProductSheetOpen.set(true);
  },
  closeProductDetails: () => {
    store.ui.isProductSheetOpen.set(false);
    // Optionally delay clearing the product to avoid flicker during closing animation
    // setTimeout(() => store.ui.selectedProductForDetails.set(null), 300);
  },
  openPaymentModal: () => {
    if (store.cart.items.length === 0) return; // Don't open if cart is empty
    store.ui.isPaymentModalOpen.set(true);
  },
  closePaymentModal: () => {
    store.ui.isPaymentModalOpen.set(false);
  },
  setFilterCategory: (categoryId: string) => {
    store.ui.filterCategory.set(categoryId);
  },
  setSearchTerm: (term: string) => {
    store.ui.searchTerm.set(term);
  },

  // --- OFFLINE & SYNC ACTIONS ---
  initiateCheckout: (paymentMethod: PaymentMethod) => {
    batch(() => {
      // Use batch for efficiency
      const cartItems = store.cart.items.get();
      const total = store.computed.cartTotal.get();
      const subtotal = store.computed.cartSubtotal.get();
      const tax = store.computed.cartTax.get();
      const loggedInUserId = "user_placeholder_id"; // Get actual logged-in user ID

      if (cartItems.length === 0) return;

      const saleRecord: SaleRecord = {
        localId: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // Unique local ID
        id: "", // Server will assign this
        userId: loggedInUserId,
        items: cartItems.map((item) => ({
          // Map to structure needed for SaleItem
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          // Add other needed fields like unitCost (might need to fetch/calculate)
          sku: item.sku, // Keep sku for reference if needed, though not in SaleItem schema directly
          name: item.name, // Keep name for reference if needed
          id: item.id, // Keep cart item id for reference if needed
          // You'll need to determine stockBatchId logic here or on the backend
          discountAmount: 0, // Add discount logic if implemented
          taxRate: 0.05, // Example tax rate
          taxAmount: item.unitPrice * item.quantity * 0.05, // Example tax amount per item
          totalAmount: item.unitPrice * item.quantity * 1.05, // Example total per item
          // unitCost: number // Important for profit calculation - needs to be fetched/determined
        })),
        totalAmount: subtotal,
        discountAmount: 0, // Add discount logic
        taxAmount: tax,
        finalAmount: total,
        paymentMethod: paymentMethod,
        paymentStatus: "COMPLETED", // Assume immediate completion for this example
        saleDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: "pending",
      };

      // Add to pending sales queue (this part will be synced)
      store.offline.pendingSales.push(saleRecord);

      console.log("Checkout initiated (offline):", saleRecord);
      actions.closePaymentModal();
      actions.clearCart();
      // Trigger sync process explicitly if needed
      // syncManager.sync(); // Example if using a manual sync trigger
    });
  },
  updateOnlineStatus: () => {
    store.offline.isOnline.set(navigator.onLine);
  },
};

// --- Persistence & Sync Setup ---

// 1. Basic Persistence (Cart, potentially UI settings)
// Persist cart items to localStorage so they aren't lost on refresh
persistObservable(store.cart, {
  name: "posCart", // Unique name for storage
  plugin: ObservablePersistLocalStorage, // Use localStorage
});

// 2. Offline Sync (Pending Sales)
// This requires a more complex setup with a backend API
// Configure IndexedDB for robust offline storage
// Configure a remote plugin to talk to your API (e.g., /api/sync/sales)
// NOTE: Implementing the remote plugin and backend API is crucial and non-trivial.

// Placeholder for sync setup
/*
syncObservable(store.offline.pendingSales, {
    pluginLocal: ObservableSyncIndexedDB, // Use IndexedDB for offline storage
    pluginRemote: { // ** This needs to be implemented **
        // Example structure - replace with your actual sync logic/library
        load: async (params) => {
             // Fetch initial/delta data from backend (e.g., sales processed elsewhere)
             console.log("SYNC: Load remote data", params);
             // const response = await fetch('/api/sync/sales?lastSync=${params.lastSync}');
             // return await response.json(); // Should return { changes: [...], lastSync: ... }
             return { changes: [], lastSync: params.lastSync }; // Placeholder
        },
        save: async (changes) => {
            // Send local changes (pending sales) to the backend
            console.log("SYNC: Saving changes to remote", changes);
            // const response = await fetch('/api/sync/sales', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(changes),
            // });
            // if (!response.ok) throw new Error('Sync failed');
            // const results = await response.json(); // Backend should return results of each change (e.g., success/fail, assigned IDs)
            // Mark local items as 'synced' or 'error' based on results
            // Return the processed changes status
            return changes.map(change => ({ ...change, syncStatus: 'synced' })); // Placeholder
        },
        // Optional: Conflict resolution logic
    },
    // Configuration options
    syncBatchInterval: 5000, // Sync every 5 seconds when online
    autoSync: true, // Automatically sync when online and changes occur
    // TODO: Add conflict handling, error handling, etc.
});
*/

// Listen to online/offline events
if (typeof window !== "undefined") {
  window.addEventListener("online", actions.updateOnlineStatus);
  window.addEventListener("offline", actions.updateOnlineStatus);
}

// Initial data load (e.g., in your main App or Page component)
// actions.loadProducts(); // Call this when the component mounts
