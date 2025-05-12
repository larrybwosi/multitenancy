import { useState } from 'react';
import { ShoppingCart, ChevronLeft, ChevronRight, ImageIcon, Plus } from 'lucide-react';
import Image from 'next/image';
import { ExtendedProduct } from '../types';
import { formatCurrency, getLocalCurrencyValues } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface ProductCardProps {
  product: ExtendedProduct;
  onAddToCart: (productId: string) => void;
  productUrl?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, productUrl }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const { id, name, sku, sellingPrice, imageUrls = [], stock = 0 } = product;

  const hasMultipleImages = imageUrls.length > 1;
  const isInStock = stock > 0;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev + 1) % imageUrls.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const handleAddToCart = () => {
    // if (isInStock) {
      onAddToCart(id);
    // }
  };

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' }}
      transition={{ duration: 0.2 }}
      className="relative w-full h-full rounded-2xl overflow-hidden bg-white dark:bg-neutral-800 shadow-md border border-gray-100 dark:border-neutral-700/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div 
        className="relative aspect-square bg-gray-50 dark:bg-neutral-700 overflow-hidden cursor-pointer"
        onClick={handleAddToCart}
      >
        {imageUrls.length > 0 ? (
          <Image 
            src={imageUrls[currentImageIndex]} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
            width={300}
            height={300}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <ImageIcon size={48} />
          </div>
        )}

        {/* Image Navigation */}
        {hasMultipleImages && isHovered && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 rounded-full p-2 shadow-md hover:bg-white dark:hover:bg-black/70 transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} className="text-gray-700 dark:text-gray-200" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 rounded-full p-2 shadow-md hover:bg-white dark:hover:bg-black/70 transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight size={20} className="text-gray-700 dark:text-gray-200" />
            </button>
          </>
        )}

        {/* Image Indicator Dots */}
        {hasMultipleImages && imageUrls.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
            {imageUrls.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentImageIndex 
                    ? 'w-3 bg-white dark:bg-gray-200' 
                    : 'bg-white/60 dark:bg-gray-400/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Quick Add Button - Visible on hover */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center bg-black/30 dark:bg-black/50 z-10"
        >
          <button
            onClick={handleAddToCart}
            className="bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-700 font-medium px-4 py-2 rounded-full flex items-center transition-all duration-200 transform hover:scale-105"
          >
            <Plus size={18} className="mr-1" />
            Add to Cart
          </button>
        </motion.div>

        {/* Stock Badge */}
        {!isInStock && (
          <div className="absolute top-3 right-3 bg-red-500 dark:bg-red-600 text-white text-xs px-3 py-1.5 rounded-full shadow-md font-medium z-20">
            Out of Stock
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-lg line-clamp-1 mb-1">{name}</h3>

        {sku && <p className="text-gray-500 dark:text-gray-400 text-xs">SKU: {productUrl || sku}</p>}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              {formatCurrency(sellingPrice, 'KSH', 'en-KE')}
            </span>
            {isInStock && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {stock} {stock === 1 ? 'unit' : 'units'} available
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className={`flex items-center justify-center p-2 rounded-full ${
              isInStock 
                ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800' 
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            } transition-colors duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            disabled={!isInStock}
            aria-label="Add to cart"
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
