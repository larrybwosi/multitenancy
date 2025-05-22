'use client';
import { useState } from 'react';
import { ShoppingCart, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useCustomers } from '@/lib/hooks/use-customers';
import { useProducts } from '@/lib/hooks/use-products';
import { MotionDiv } from '@/components/motion';
import CartComponent from './cart';
import { formatCurrency } from '@/lib/utils';

// TypeScript interfaces
interface Variant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode: string | null;
  attributes: Record<string, any>;
  isActive: boolean;
  reorderPoint: number;
  reorderQty: number;
  lowStockAlert: boolean;
  buyingPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  createdAt: string;
  updatedAt: string;
  sellingPrice: number;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  categoryId: string;
  isActive: boolean;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  width: number | null;
  height: number | null;
  length: number | null;
  dimensionUnit: string;
  weight: number | null;
  weightUnit: string;
  volumetricWeight: number | null;
  defaultLocationId: string | null;
  organizationId: string;
  category: Category;
  variants: Variant[];
  sellingPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  buyingPrice: number;
  reorderPoint: number;
  totalStock: number;
}

interface CartItem extends Product {
  selectedVariant: Variant;
  currentPrice: number;
  priceMode: 'wholesale' | 'retail';
  quantity: number;
}


const ProductCard: React.FC<{
  product: Product;
  onAddToCart: (item: CartItem) => void;
  isWholesaleMode: boolean;
}> = ({ product, onAddToCart, isWholesaleMode }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant>(product.variants[0]);

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = () => {
    onAddToCart({
      ...product,
      selectedVariant,
      currentPrice: isWholesaleMode ? selectedVariant.wholesalePrice : selectedVariant.retailPrice,
      priceMode: isWholesaleMode ? 'wholesale' : 'retail',
      quantity: 1,
    });
  };

  const currentPrice = isWholesaleMode ? selectedVariant?.wholesalePrice : selectedVariant?.retailPrice;
  const unit = selectedVariant?.sellingUnit?.name
  const isVariantInStock = product.totalStock > 0;
  
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8 }}
      className="h-[400px]"
    >
      <Card className="h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
        <div className="relative">
          <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <>
                <Image
                  src={product.imageUrls[currentImageIndex]}
                  alt={product.name}
                  fill
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {product.imageUrls.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {product.imageUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleImageChange(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          currentImageIndex === index ? 'bg-white shadow-lg' : 'bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Eye size={32} />
              </div>
            )}
            <div className="absolute top-2 left-2">
              {!isVariantInStock ? (
                <Badge variant="destructive" className="text-xs font-semibold">
                  Out of Stock
                </Badge>
              ) : product.totalStock <= 5 ? (
                <Badge
                  variant="outline"
                  className="text-xs font-semibold bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  Low Stock ({product.totalStock})
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs font-semibold bg-green-50 text-green-700">
                  In Stock ({product.totalStock})
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-3 space-y-2">
            <div className="text-sm font-semibold text-gray-900 truncate">{product.name}</div>
            <div className="text-xs text-gray-500">{product.category?.name || 'Uncategorized'}</div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700">Variants:</div>
              <div className="flex flex-wrap gap-1">
                {product.variants.map(variant => (
                  <Badge
                    key={variant.id}
                    variant={selectedVariant.id === variant.id ? 'default' : 'outline'}
                    className={`cursor-pointer text-xs px-2 py-0.5 transition-all duration-200 ${
                      selectedVariant.id === variant.id
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'hover:bg-gray-100 border-gray-300'
                    } ${product.totalStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => product.totalStock > 0 && handleVariantSelect(variant)}
                  >
                    {variant.name}
                    {product.totalStock === 0 && ' (Out)'}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(currentPrice?.toString() || '0')}
                    </span>
                    <span className="text-xs text-gray-500">/{unit}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {isWholesaleMode ? (
                      <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                        Wholesale
                      </span>
                    ) : (
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Retail</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <MotionDiv whileTap={{ scale: 0.95 }} className="pt-1">
              <Button
                onClick={handleAddToCart}
                disabled={!isVariantInStock}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-1.5 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={14} className="mr-1" />
                {isVariantInStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </MotionDiv>
          </CardContent>
        </div>
      </Card>
    </MotionDiv>
  );
};

const ProductGrid: React.FC = () => {
  const [isWholesaleMode, setIsWholesaleMode] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const { data: customers, isLoading: isLoadingCustomers } = useCustomers({});
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({
    includeCategory: true,
    includeVariants: true,
    limit: 50,
    page: 1,
    sortBy: 'createdAt',
  });
  const products = productsData?.data || [];
  const handleAddToCart = (productWithVariant: CartItem) => {
    setCartItems(prev => [...prev, { ...productWithVariant, quantity: 1 }]);
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    setCartItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleSubmitSale = () => {
    console.log('Sale submitted:', cartItems);
  };

  const togglePriceMode = () => {
    setIsWholesaleMode(!isWholesaleMode);
  };

  if (isLoadingProducts) {
    return <div className="min-h-screen flex items-center justify-center">Loading products...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-6 px-4">
      <div className=" mx-auto">
        <MotionDiv initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
            <div className="flex items-center space-x-2 bg-white rounded-full p-1.5 shadow-lg border">
              <span
                className={`text-sm font-medium transition-colors ${!isWholesaleMode ? 'text-blue-600' : 'text-gray-500'}`}
              >
                Retail
              </span>
              <Button variant="ghost" size="sm" onClick={togglePriceMode} className="p-1 hover:bg-transparent">
                {isWholesaleMode ? (
                  <ToggleRight size={28} className="text-orange-600" />
                ) : (
                  <ToggleLeft size={28} className="text-gray-400" />
                )}
              </Button>
              <span
                className={`text-sm font-medium transition-colors ${isWholesaleMode ? 'text-orange-600' : 'text-gray-500'}`}
              >
                Wholesale
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-base max-w-2xl mx-auto">
            {isWholesaleMode
              ? 'Wholesale pricing mode - Buy in bulk and save more'
              : 'Retail pricing mode - Individual purchase prices'}
          </p>
        </MotionDiv>

        <div className="flex flex-row gap-6">
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-3/4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {products &&
              products?.map((product, index) => (
                <MotionDiv
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="w-full"
                >
                  <ProductCard product={product} onAddToCart={handleAddToCart} isWholesaleMode={isWholesaleMode} />
                </MotionDiv>
              ))}
          </MotionDiv>
          <div className="w-1/4">
            <CartComponent
              cartItems={cartItems}
              cartTotal={cartItems.reduce((total, item) => total + item.currentPrice * item.quantity, 0).toFixed(2)}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onSubmitSale={handleSubmitSale}
              onUpdateQuantity={handleUpdateQuantity}
              customers={customers?.data.customers || []}
              isLoadingCustomers={isLoadingCustomers}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductGrid;
