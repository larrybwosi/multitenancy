import { useState } from 'react';
import { ShoppingCart, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { ExtendedProduct } from '../types';

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
  const formattedPrice = typeof sellingPrice === 'number' ? `$${sellingPrice.toFixed(2)}` : `$${sellingPrice}`;

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const handleAddToCart = () => {
    // if (isInStock) {
      onAddToCart(id);
    // }
  };

  return (
    <div
      className="relative w-64 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative h-64 bg-gray-100">
        {imageUrls.length > 0 ? (
          <Image src={imageUrls[currentImageIndex]} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ImageIcon size={48} onClick={handleAddToCart} />
          </div>
        )}

        {/* Image Navigation */}
        {hasMultipleImages && isHovered && (
          <>
            <button
              onClick={e => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow-md hover:bg-white transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow-md hover:bg-white transition-colors"
            >
              <ChevronRight size={20} className="text-gray-700" />
            </button>
          </>
        )}

        {/* Image Indicator Dots */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {imageUrls.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}

        {/* Stock Badge */}
        {!isInStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md">Out of Stock</div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 text-lg truncate">{name}</h3>

        {sku && <p className="text-gray-500 text-xs mt-1">SKU: {productUrl || sku}</p>}

        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-lg">{formattedPrice}</span>

          <button
            onClick={handleAddToCart}
            className={`flex items-center justify-center p-2 rounded-lg w-40 h-10 ${
              isInStock ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 '
            } transition-colors duration-200`}
          >
            <ShoppingCart size={18} />
          </button>
        </div>

        {isInStock && (
          <p className="text-xs text-gray-500 mt-1">
            {stock} {stock === 1 ? 'item' : 'items'} in stock
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
