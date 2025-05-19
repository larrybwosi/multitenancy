'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchOrderQueues, fetchProducts } from './lib/api';
import Sidebar from './components/sidebar';
import { OrderQueues } from './components/order-queues';
import { ProductLists } from './components/product-lists';
import { CartDetails } from './components/cart-details';
import { PaymentModal } from './components/payment-modal';
import { ProductListsSkeleton } from './components/skeletons/product-lists-skeleton';
import { OrderQueuesSkeleton } from './components/skeletons/order-queues-skeleton';

//0718826097 VInny

export function PointOfSale() {
  const [activeCategory, setActiveCategory] = useState('Appetizers');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Shrimp fried spicy sauce',
      price: 170000,
      quantity: 2,
      variant: 'Medium',
      image: '/placeholder.svg?height=80&width=80',
    },
    {
      id: 2,
      name: 'Spicy shrimp with rice',
      price: 210000,
      quantity: 3,
      variant: 'Original',
      image: '/placeholder.svg?height=80&width=80',
    },
  ]);

  const {
    data: orderQueues,
    isLoading: isLoadingQueues,
    error: queuesError,
  } = useQuery({
    queryKey: ['orderQueues'],
    queryFn: fetchOrderQueues,
  });

  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ['products', activeCategory],
    queryFn: () => fetchProducts(activeCategory),
  });

  const handleAddToCart = (product, quantity, variant) => {
    const existingItemIndex = cartItems.findIndex(item => item.id === product.id && item.variant === variant);

    if (existingItemIndex !== -1) {
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setCartItems(updatedItems);
    } else {
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          variant,
          image: product.image,
        },
      ]);
    }

    toast.success(`Added ${quantity} ${product.name} to cart`);
  };

  const handleUpdateCartItem = (id, variant, quantity) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => !(item.id === id && item.variant === variant)));
    } else {
      setCartItems(cartItems.map(item => (item.id === id && item.variant === variant ? { ...item, quantity } : item)));
    }
  };

  const handleRemoveCartItem = (id, variant) => {
    setCartItems(cartItems.filter(item => !(item.id === id && item.variant === variant)));
    toast.success('Item removed from cart');
  };

  const handleClearCart = () => {
    setCartItems([]);
    toast.success('Cart cleared');
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = paymentDetails => {
    toast.success('Payment successful!');
    setCartItems([]);
    setShowPaymentModal(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* <Sidebar /> */}

      <main className="flex-1 overflow-auto">
        <div className="grid grid-cols-[1fr_350px] h-full">
          <div className="p-6 overflow-auto">
            {isLoadingQueues ? (
              <OrderQueuesSkeleton />
            ) : queuesError ? (
              <div>Error loading order queues</div>
            ) : (
              <OrderQueues data={orderQueues} />
            )}

            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Product Lists</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search for food"
                      className="w-[200px] pl-8"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {isLoadingProducts ? (
                <ProductListsSkeleton />
              ) : productsError ? (
                <div>Error loading products</div>
              ) : (
                <ProductLists
                  products={products}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  searchQuery={searchQuery}
                  onAddToCart={handleAddToCart}
                />
              )}
            </div>
          </div>

          <div className="border-l">
            <CartDetails
              cartItems={cartItems}
              onUpdateItem={handleUpdateCartItem}
              onRemoveItem={handleRemoveCartItem}
              onClearCart={handleClearCart}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </main>

      {showPaymentModal && (
        <PaymentModal
          cartItems={cartItems}
          onClose={() => setShowPaymentModal(false)}
          onComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
export default PointOfSale