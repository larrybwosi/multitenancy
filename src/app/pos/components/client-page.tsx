"use client";

import { useState } from "react";
import { MockCategory, MockCustomer, MockProduct } from "../lib/mock-data";
import useCart from "../lib/use-cart";
import ProductGrid from "./product-grid";
import CartPanel from "./cart-pannel";

interface POSPageContentProps {
  initialProducts: MockProduct[];
  initialCategories: MockCategory[];
  initialCustomers: MockCustomer[];
}

export default function POSPageContent({
  initialProducts,
  initialCategories,
  initialCustomers,
}: POSPageContentProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<MockCustomer>(
    initialCustomers[0]
  );
  const cart = useCart(initialProducts);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100">
      <ProductGrid
        products={initialProducts}
        categories={initialCategories}
        onAddToCart={cart.addItem}
        cartItems={cart.items}
      />

      <CartPanel
        cart={cart}
        customers={initialCustomers}
        selectedCustomer={selectedCustomer}
        onCustomerChange={setSelectedCustomer}
      />
    </div>
  );
}
