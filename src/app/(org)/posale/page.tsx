'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

// Sample product data (unchanged)
const sampleProducts = [
  {
    id: 1,
    name: 'Premium Wireless Headphones',
    images: [
      'https://media.istockphoto.com/id/1412240771/photo/headphones-on-white-background.jpg?b=1&s=612x612&w=0&k=20&c=nh6m1Og0JhZgMvz5IY73WKgC9nCt8ZVvgY1Uk2PPL4M=',
      'https://media.istockphoto.com/id/1412240771/photo/headphones-on-white-background.jpg?b=1&s=612x612&w=0&k=20&c=nh6m1Og0JhZgMvz5IY73WKgC9nCt8ZVvgY1Uk2PPL4M=',
    ],
    sellingUnit: 'piece',
    rating: 4.8,
    inStock: true,
    variants: [
      { id: 'black', name: 'Black', retailPrice: 299.99, wholesalePrice: 199.99, stock: 15 },
      { id: 'white', name: 'White', retailPrice: 309.99, wholesalePrice: 209.99, stock: 8 },
      { id: 'silver', name: 'Silver', retailPrice: 319.99, wholesalePrice: 219.99, stock: 12 },
    ],
  },
  {
    id: 2,
    name: 'Smart Fitness Watch',
    images: [
      'https://media.istockphoto.com/id/1372077120/photo/over-the-shoulder-view-of-young-asian-sports-woman-checks-her-fitness-statistics-on.jpg?b=1&s=612x612&w=0&k=20&c=GOxaGngzz1g2TVi_BmkfjhaNLCKkvRq8__69tKcZpk0=',
    ],
    sellingUnit: 'unit',
    rating: 4.6,
    inStock: true,
    variants: [
      { id: 'sport', name: 'Sport Band', retailPrice: 249.99, wholesalePrice: 179.99, stock: 20 },
      { id: 'leather', name: 'Leather Band', retailPrice: 279.99, wholesalePrice: 199.99, stock: 5 },
      { id: 'metal', name: 'Metal Band', retailPrice: 329.99, wholesalePrice: 239.99, stock: 10 },
    ],
  },
  {
    id: 3,
    name: 'Organic Coffee Beans',
    images: [
      'https://images.pexels.com/photos/27993239/pexels-photo-27993239/free-photo-of-a-person-is-holding-a-cup-of-coffee-on-top-of-a-newspaper.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://media.istockphoto.com/id/466732980/photo/coffee-bean.jpg?b=1&s=612x612&w=0&k=20&c=fXU5Rpa_THImhd6N3_8X6BdV0adQZldHe_30dvHSu2c=',
      'https://images.pexels.com/photos/29179913/pexels-photo-29179913/free-photo-of-aromatic-black-coffee-decorated-with-orange-zest.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    sellingUnit: 'kg',
    rating: 4.9,
    inStock: true,
    variants: [
      { id: 'dark', name: 'Dark Roast', retailPrice: 24.99, wholesalePrice: 18.99, stock: 0 },
      { id: 'medium', name: 'Medium Roast', retailPrice: 22.99, wholesalePrice: 16.99, stock: 25 },
      { id: 'light', name: 'Light Roast', retailPrice: 21.99, wholesalePrice: 15.99, stock: 18 },
    ],
  },
  {
    id: 4,
    name: 'Bluetooth Speaker',
    images: [
      'https://media.istockphoto.com/id/1059154330/photo/boombox.jpg?b=1&s=612x612&w=0&k=20&c=ZOjf8dze9q9YvlYZAxSxKoX8ND53G0HUIQtcwzUgZeI=',
      'https://media.istockphoto.com/id/1345322275/photo/close-up-on-hand-using-phone-connecting-speaker-bluetooth.jpg?b=1&s=612x612&w=0&k=20&c=uaYlH6mN2D4eiFCfqWNQMnpjKam6DACUTNLHO02vhK4=',
    ],
    sellingUnit: 'piece',
    rating: 4.4,
    inStock: true,
    variants: [
      { id: 'red', name: 'Red', retailPrice: 89.99, wholesalePrice: 64.99, stock: 12 },
      { id: 'blue', name: 'Blue', retailPrice: 89.99, wholesalePrice: 64.99, stock: 8 },
      { id: 'green', name: 'Green', retailPrice: 94.99, wholesalePrice: 69.99, stock: 6 },
      { id: 'black', name: 'Black', retailPrice: 99.99, wholesalePrice: 74.99, stock: 15 },
    ],
  },
  {
    id: 5,
    name: 'Wireless Charging Pad',
    sellingUnit: 'unit',
    rating: 4.2,
    inStock: true,
    variants: [
      { id: 'fast', name: 'Fast Charge', retailPrice: 49.99, wholesalePrice: 39.99, stock: 20 },
      { id: 'standard', name: 'Standard', retailPrice: 29.99, wholesalePrice: 19.99, stock: 30 },
    ],
  },
  {
    id: 6,
    name: 'Gaming Mouse',
    images: [
      'https://images.pexels.com/photos/2106216/pexels-photo-2106216.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://media.istockphoto.com/id/1461453147/photo/gamer-playing-videogame.jpg?b=1&s=612x612&w=0&k=20&c=TfsB6cqu5T3Mm45drX-V58urO97chCilorRChnRZk34=',
    ],
    sellingUnit: 'piece',
    rating: 4.7,
    inStock: true,
    variants: [
      { id: 'rgb', name: 'RGB', retailPrice: 89.99, wholesalePrice: 69.99, stock: 15 },
      { id: 'wireless', name: 'Wireless', retailPrice: 109.99, wholesalePrice: 79.99, stock: 8 },
      { id: 'wired', name: 'Wired', retailPrice: 69.99, wholesalePrice: 49.99, stock: 25 },
    ],
  },
];

const ProductCard = ({ product, onAddToCart, isWholesaleMode }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);

  const handleImageChange = index => {
    setCurrentImageIndex(index);
  };

  const handleVariantSelect = variant => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = () => {
    onAddToCart({
      ...product,
      selectedVariant,
      currentPrice: isWholesaleMode ? selectedVariant.wholesalePrice : selectedVariant.retailPrice,
      priceMode: isWholesaleMode ? 'wholesale' : 'retail',
    });
  };

  const currentPrice = isWholesaleMode ? selectedVariant.wholesalePrice : selectedVariant.retailPrice;
  const isVariantInStock = selectedVariant.stock > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-[400px]" // Standard height for all cards
    >
      <Card className="h-full overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
        <div className="relative">
          {/* Product Image */}
          <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            {product.images && product.images.length > 0 ? (
              <>
                <Image
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  fill
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {product.images.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {product.images.map((_, index) => (
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

            {/* Stock Status Badge */}
            <div className="absolute top-2 left-2">
              {!isVariantInStock ? (
                <Badge variant="destructive" className="text-xs font-semibold">
                  Out of Stock
                </Badge>
              ) : selectedVariant.stock <= 5 ? (
                <Badge
                  variant="outline"
                  className="text-xs font-semibold bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  Low Stock ({selectedVariant.stock})
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs font-semibold bg-green-50 text-green-700">
                  In Stock ({selectedVariant.stock})
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-3 space-y-2">

            {/* Selectable Variants */}
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
                    } ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => variant.stock > 0 && handleVariantSelect(variant)}
                  >
                    {variant.name}
                    {variant.stock === 0 && ' (Out)'}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-bold text-gray-900">${currentPrice.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">/{product.sellingUnit}</span>
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

            {/* Add to Cart Button */}
            <motion.div whileTap={{ scale: 0.95 }} className="pt-1">
              <Button
                onClick={handleAddToCart}
                disabled={!isVariantInStock}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-1.5 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={14} className="mr-1" />
                {isVariantInStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </motion.div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};

const ProductGrid = ({ products = sampleProducts, onAddToCart }) => {
  const [isWholesaleMode, setIsWholesaleMode] = useState(false);

  const handleAddToCart = productWithVariant => {
    if (onAddToCart) {
      onAddToCart(productWithVariant);
    } else {
      console.log('Added to cart:', productWithVariant);
    }
  };

  const togglePriceMode = () => {
    setIsWholesaleMode(!isWholesaleMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-6 px-4 w-full">
      <div className="w-full">
        {/* Header with Price Mode Toggle */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
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
        </motion.div>

        {/* Product Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full"
            >
              <ProductCard product={product} onAddToCart={handleAddToCart} isWholesaleMode={isWholesaleMode} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default ProductGrid;
