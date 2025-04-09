import { create } from "zustand";
import { Product, Customer, Prisma } from "@prisma/client";

// Define types used in the store
interface ProductWithVariants extends Product {
  variants: {
    id: string;
    name: string;
    sku: string;
    priceModifier: Prisma.Decimal;
  }[];
}

interface CartItem {
  id: string; // Unique ID for the cart item (e.g., productId_variantId or just cuid)
  productId: string;
  variantId?: string | null;
  name: string; // Combined product/variant name
  sku: string;
  quantity: number;
  unitPrice: Prisma.Decimal; // Price per unit
  totalPrice: Prisma.Decimal; // quantity * unitPrice
}

interface PosState {
  cart: CartItem[];
  selectedCustomer: Pick<
    Customer,
    "id" | "name" | "email" | "loyaltyPoints"
  > | null;
  discount: Prisma.Decimal; // Overall discount amount
  taxRate: Prisma.Decimal; // Example tax rate (e.g., 0.08 for 8%) - fetch from settings later
  addItemToCart: (
    product: ProductWithVariants,
    variant?: ProductWithVariants["variants"][0],
    quantity?: number
  ) => void;
  removeItemFromCart: (cartItemId: string) => void;
  updateCartItemQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  setCustomer: (
    customer: Pick<Customer, "id" | "name" | "email" | "loyaltyPoints"> | null
  ) => void;
  setDiscount: (amount: number) => void;
  subtotal: Prisma.Decimal;
  totalDiscount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  total: Prisma.Decimal;
  _updateTotals: () => void; // Made this part of the public interface since it's used in the store
}

// Helper to calculate totals
const calculateTotals = (
  cart: CartItem[],
  discount: Prisma.Decimal,
  taxRate: Prisma.Decimal
) => {
  const subtotal = cart.reduce(
    (sum, item) => sum.add(item.totalPrice),
    new Prisma.Decimal(0)
  );
  const totalDiscount = Prisma.Decimal.min(discount, subtotal);
  const taxableAmount = subtotal.sub(totalDiscount);
  const taxAmount = taxableAmount.mul(taxRate).toDecimalPlaces(2);
  const total = taxableAmount.add(taxAmount);

  return { subtotal, totalDiscount, taxAmount, total };
};

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  selectedCustomer: null,
  discount: new Prisma.Decimal(0),
  taxRate: new Prisma.Decimal(0.0),
  subtotal: new Prisma.Decimal(0),
  totalDiscount: new Prisma.Decimal(0),
  taxAmount: new Prisma.Decimal(0),
  total: new Prisma.Decimal(0),

  // Updated _updateTotals to avoid unnecessary state updates
  _updateTotals: () => {
    const {
      cart,
      discount,
      taxRate,
      subtotal: currentSubtotal,
      totalDiscount: currentTotalDiscount,
      taxAmount: currentTaxAmount,
      total: currentTotal,
    } = get();
    const { subtotal, totalDiscount, taxAmount, total } = calculateTotals(
      cart,
      discount,
      taxRate
    );

    // Only update state if values actually changed
    if (
      !subtotal.equals(currentSubtotal) ||
      !totalDiscount.equals(currentTotalDiscount) ||
      !taxAmount.equals(currentTaxAmount) ||
      !total.equals(currentTotal)
    ) {
      set({ subtotal, totalDiscount, taxAmount, total });
    }
  },

  addItemToCart: (product, variant, quantity = 1) => {
    const cartItemId = variant ? `${product.id}_${variant.id}` : product.id;
    const existingItem = get().cart.find((item) => item.id === cartItemId);
    const unitPrice = variant
      ? product.basePrice.add(variant.priceModifier)
      : product.basePrice;

    let newCart: CartItem[];
    if (existingItem) {
      newCart = get().cart.map((item) =>
        item.id === cartItemId
          ? {
              ...item,
              quantity: item.quantity + quantity,
              totalPrice: unitPrice.mul(item.quantity + quantity),
            }
          : item
      );
    } else {
      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        variantId: variant?.id,
        name: variant ? `${product.name} (${variant.name})` : product.name,
        sku: variant?.sku || product.sku,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: unitPrice.mul(quantity),
      };
      newCart = [...get().cart, newItem];
    }
    set({ cart: newCart });
    get()._updateTotals(); // Recalculate totals
  },

  removeItemFromCart: (cartItemId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== cartItemId),
    }));
    get()._updateTotals();
  },

  updateCartItemQuantity: (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      get().removeItemFromCart(cartItemId);
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === cartItemId
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: item.unitPrice.mul(newQuantity),
            }
          : item
      ),
    }));
    get()._updateTotals();
  },

  clearCart: () => {
    set({ cart: [], selectedCustomer: null, discount: new Prisma.Decimal(0) });
    get()._updateTotals();
  },

  setCustomer: (customer) => {
    set({ selectedCustomer: customer });
  },

  setDiscount: (amount) => {
    if (amount < 0) return; // Ignore negative discount
    set({ discount: new Prisma.Decimal(amount) });
    get()._updateTotals();
  },
}));
