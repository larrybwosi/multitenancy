"use client"; // Keep this if client-side interactivity (useState, useEffect) is needed

import React, { useState, useEffect, useMemo } from "react";
// Import the actual data fetching function (adjust path as needed)
// If using API routes: You'd fetch from '/api/products' instead.
// If using Server Actions: You'd import and call the server action.
// Assuming direct import for simplicity here, requires framework support (like Next.js App Router)
// For non-Next.js or Pages Router, you'd fetch from an API endpoint created in Step 2.
import {
  ShoppingCart,
  Search,
  Filter,
  Loader,
  Star,
  Heart,
} from "lucide-react";
import { Product, ProductVariant } from "./api";
import { getDbProducts } from "./actions";

// --- UI Components (Badge, VariantSelector, ProductCard) ---

// Badge Component (Type Safe)
interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, className = "" }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
    {children}
  </span>
);

// Helper to convert color names to Tailwind classes
const getColorClass = (color: string): string => {
  const colorMap: Record<string, string> = {
    black: "bg-gray-900 border-gray-900", // Add border for light colors
    white: "bg-white border-gray-300",
    gray: "bg-gray-400 border-gray-400",
    red: "bg-red-500 border-red-500",
    blue: "bg-blue-500 border-blue-500",
    green: "bg-green-500 border-green-500",
    yellow: "bg-yellow-400 border-yellow-400",
    purple: "bg-purple-500 border-purple-500",
    pink: "bg-pink-500 border-pink-500",
    gold: "bg-yellow-500 border-yellow-500",
    silver: "bg-gray-300 border-gray-300",
    bronze: "bg-yellow-700 border-yellow-700",
    brown: "bg-yellow-800 border-yellow-800", // Consider specific brown like bg-amber-800
    navy: "bg-blue-900 border-blue-900",
    teal: "bg-teal-500 border-teal-500",
    "rose gold": "bg-pink-300 border-pink-300", // Often a gradient, approximate here
    sage: "bg-green-300 border-green-300", // Approximate, maybe bg-emerald-300
  };
  // Default with a visible border
  return colorMap[color.toLowerCase()] || "bg-gray-200 border-gray-300";
};

// Helper function to find the best matching *active* variant based on selected attributes
const findBestMatchingVariant = (
  variants: ProductVariant[],
  targetAttributes: Record<string, string>
): ProductVariant | null => {
  const activeVariants = variants.filter((v) => v.isActive);
  if (activeVariants.length === 0) return null;

  const targetKeys = Object.keys(targetAttributes);

  // Filter variants that have *at least* all the target attribute keys
  const potentialMatches = activeVariants.filter((variant) =>
    targetKeys.every((key) => key in variant.attributes)
  );

  if (potentialMatches.length === 0) {
    // Fallback: Find the first active variant if no potential match based on keys
    // Or, could try partial matching logic if needed
    return activeVariants[0] ?? null;
  }

  // Try to find an exact match among potential candidates
  const exactMatch = potentialMatches.find((variant) =>
    targetKeys.every((key) => variant.attributes[key] === targetAttributes[key])
  );

  if (exactMatch) return exactMatch;

  // If no exact match, find the one with the *most* matching attribute values
  // among those that have all the required keys.
  let bestMatch = potentialMatches[0]; // Start with the first potential match
  let maxMatchCount = -1; // Use -1 to ensure the first candidate is always considered

  potentialMatches.forEach((variant) => {
    let currentMatchCount = 0;
    targetKeys.forEach((key) => {
      if (variant.attributes[key] === targetAttributes[key]) {
        currentMatchCount++;
      }
    });

    if (currentMatchCount > maxMatchCount) {
      maxMatchCount = currentMatchCount;
      bestMatch = variant;
    }
  });

  // Return the best match found (could still be the first one if no better match exists)
  return bestMatch ?? activeVariants[0] ?? null; // Final fallback
};

// Variant Selector Component (Type Safe)
interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onChange: (variant: ProductVariant) => void;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariant,
  onChange,
}) => {
  // Calculate attribute types and unique values only once using useMemo
  const attributeData = useMemo(() => {
    const types: string[] = [];
    const valuesMap: Record<string, Set<string>> = {};

    variants.forEach((variant) => {
      if (!variant.isActive) return; // Only consider active variants for selection options

      Object.entries(variant.attributes).forEach(([key, value]) => {
        if (!types.includes(key)) {
          types.push(key);
          valuesMap[key] = new Set();
        }
        if (value) {
          // Ensure value is not empty/null
          valuesMap[key].add(value);
        }
      });
    });

    // Convert Sets to sorted arrays for stable order
    const uniqueValues: Record<string, string[]> = {};
    types.forEach((key) => {
      uniqueValues[key] = Array.from(valuesMap[key]).sort();
    });

    // Sort attribute types alphabetically for consistent order
    types.sort();

    return { attributeTypes: types, uniqueValues };
  }, [variants]); // Recalculate only if variants array changes

  const { attributeTypes, uniqueValues } = attributeData;

  // Handler inside the component to manage attribute selection
  const handleAttributeClick = (attrType: string, value: string) => {
    const currentSelectedAttrs = selectedVariant?.attributes || {};
    const updatedAttributes = {
      ...currentSelectedAttrs,
      [attrType]: value,
    };

    // Find the best matching *active* variant based on the *newly selected* attributes
    const matchingVariant = findBestMatchingVariant(
      variants,
      updatedAttributes
    );

    // If a suitable variant is found, call the parent's onChange
    if (matchingVariant) {
      onChange(matchingVariant);
    }
    // Optional: Handle cases where no matching variant is found
    // (e.g., show a message, disable incompatible options - more complex UI)
  };

  if (attributeTypes.length === 0) {
    return null; // Don't render anything if no attributes/variants
  }

  return (
    <div className="space-y-3">
      {attributeTypes.map((attrType) => {
        const values = uniqueValues[attrType];
        // Don't render if no values for this attribute (e.g., only one variant had it)
        if (!values || values.length === 0) return null;

        const selectedValue = selectedVariant?.attributes[attrType];

        return (
          <div key={attrType} className="space-y-1">
            <div className="text-sm font-medium capitalize text-gray-700">
              {attrType.replace(/_/g, " ")}
            </div>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const isSelected = value === selectedValue;
                // Check if selecting this value would lead to a valid variant
                // (More complex: involves checking combinations, potentially disable options)

                // For color swatches
                if (attrType.toLowerCase() === "color") {
                  const colorClasses = getColorClass(value);
                  return (
                    <button
                      key={value}
                      type="button" // Explicitly type as button
                      className={`w-7 h-7 rounded-full border ${colorClasses} transition-all duration-150 ${
                        isSelected
                          ? "ring-2 ring-offset-1 ring-blue-500 scale-110"
                          : "ring-0 hover:scale-105"
                      }`}
                      onClick={() => handleAttributeClick(attrType, value)}
                      title={value}
                      aria-label={`Select color ${value}`}
                    />
                  );
                }

                // For other attributes like size, material, etc.
                return (
                  <button
                    key={value}
                    type="button"
                    className={`px-3 py-1 text-xs border rounded-md transition-colors duration-150 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 font-semibold"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                    }`}
                    onClick={() => handleAttributeClick(attrType, value)}
                    aria-pressed={isSelected} // Good for accessibility
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Individual Product Card Component (Type Safe)
interface ProductCardProps {
  product: Product;
  // onAddToCart: (variantId: string, quantity: number) => void; // Example prop for adding to cart
  // onToggleFavorite: (productId: string) => void; // Example prop for favorites
}

const ProductCard: React.FC<ProductCardProps> = ({
  product /*, onAddToCart, onToggleFavorite */,
}) => {
  // Initialize with the first *active* variant, or null if none exist/are active
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    () => product.variants.find((v) => v.isActive) || null
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false); // This state would likely come from user data/context

  // Update selected variant if the product prop changes (e.g., parent list updates)
  useEffect(() => {
    setSelectedVariant(product.variants.find((v) => v.isActive) || null);
  }, [product]);

  // Calculate price based on selected variant
  const price = useMemo(() => {
    const base = product.basePrice;
    const modifier = selectedVariant?.priceModifier ?? 0;
    return base + modifier;
  }, [product.basePrice, selectedVariant]);

  // Format price
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD", // Replace with your desired currency
    }).format(price);
  }, [price]);

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevent card click if needed
    if (selectedVariant) {
      console.log(
        `Adding variant ${selectedVariant.id} (${selectedVariant.name}) to cart`
      );
      // onAddToCart(selectedVariant.id, 1); // Call parent handler
    } else {
      console.warn(
        "Cannot add to cart: No variant selected or available for product",
        product.id
      );
      // Optionally show a user message
    }
  };

  const handleToggleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsFavorite((prev) => !prev);
    console.log(`Toggling favorite for product ${product.id}`);
    // onToggleFavorite(product.id); // Call parent handler
  };

  // Determine the image URL - use variant image if available, else product's first image
  const displayImageUrl = useMemo(() => {
    // Simplified: Use the first product image.
    // A real implementation might check selectedVariant.imageUrls if that existed.
    return product.imageUrls?.[0] || "/api/placeholder/400/400"; // Fallback placeholder
  }, [product.imageUrls]);

  return (
    <div
      className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out overflow-hidden flex flex-col border border-gray-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem" // Semantics
      aria-labelledby={`product-name-${product.id}`}
    >
      {/* Product image and actions */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {" "}
        {/* Fixed aspect ratio */}
        <img
          src={displayImageUrl}
          alt={`Image of ${product.name}`} // More descriptive alt text
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          loading="lazy" // Lazy load images below the fold
        />
        {/* Quick action buttons */}
        <div
          className={`absolute top-2 right-2 flex flex-col space-y-2 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          <button
            onClick={handleToggleFavorite}
            className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            title={isFavorite ? "Remove from favorites" : "Add to favorites"} // Tooltip
          >
            <Heart
              className={`w-5 h-5 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </button>
          {/* Add other quick actions here if needed (e.g., Quick View) */}
        </div>
        {/* Badges (Example: Sale) - Adjust logic as needed */}
        {/* This logic is arbitrary, replace with real sale conditions */}
        {price < product.basePrice && (
          <Badge className="absolute bottom-2 left-2 bg-red-500 text-white">
            SALE
          </Badge>
        )}
        {product.variants.length === 0 && ( // Example: Out of Stock badge if no active variants
          <Badge className="absolute bottom-2 right-2 bg-gray-500 text-white">
            Unavailable
          </Badge>
        )}
      </div>

      {/* Product details */}
      <div className="flex flex-col flex-grow p-4 space-y-3">
        <h3
          id={`product-name-${product.id}`}
          className="font-semibold text-gray-800 truncate"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Rating (Placeholder - replace with real data if available) */}
        <div className="flex items-center space-x-1 text-yellow-500">
          {[...Array(4)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-current" />
          ))}
          <Star className="w-4 h-4 text-gray-300 fill-current" />{" "}
          {/* Example empty star */}
          <span className="text-xs text-gray-500 ml-1">(24 reviews)</span>{" "}
          {/* Placeholder count */}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 flex-grow min-h-[40px]">
          {" "}
          {/* Ensure minimum height */}
          {product.description || "No description available."}
        </p>

        {/* Variant selector - Only show if there are variants to select */}
        {product.variants && product.variants.length > 0 && (
          <VariantSelector
            variants={product.variants}
            selectedVariant={selectedVariant}
            onChange={setSelectedVariant} // Update local state when variant changes
          />
        )}

        {/* Price and add to cart */}
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
          {" "}
          {/* mt-auto pushes to bottom */}
          <div className="flex flex-col items-start">
            <span className="font-bold text-lg text-gray-900">
              {formattedPrice}
            </span>
            {/* Optional: Show base price if variant selected */}
            {selectedVariant && selectedVariant.priceModifier !== 0 && (
              <span className="text-xs text-gray-500 line-through">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(product.basePrice)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant} // Disable if no variant is selected/available
            className={`px-3 py-2 rounded-lg transition-colors flex items-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
              selectedVariant
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            aria-label="Add product to cart"
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Products Grid Component ---

const ProductsGrid: React.FC = () => {
  // State with proper types
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch data from DB on component mount
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      setError(null); // Reset error before fetching
      try {
        // --- METHOD 1: Call Server Action (Example for Next.js App Router) ---
        const data = await getDbProducts(); // Assuming getDbProducts is a server action
        console.log(data)

        // --- METHOD 2: Fetch from API Route (Example for Pages Router or other setups) ---
        // const response = await fetch('/api/products'); // Your API endpoint
        // if (!response.ok) {
        //   throw new Error(`API Error: ${response.statusText}`);
        // }
        // const data: Product[] = await response.json();

        setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
        const message =
          err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`Failed to load products. ${message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Filter products based on search query using useMemo for optimization
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return products; // Return all products if query is empty
    }
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        (product.description &&
          product.description.toLowerCase().includes(query)) ||
        product.sku.toLowerCase().includes(query) // Also search SKU
      // Add more fields to search if needed (e.g., category name, variant names/skus)
    );
  }, [products, searchQuery]); // Recalculate only when products or searchQuery change

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        {" "}
        {/* Increased height */}
        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-lg text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10 my-10 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-semibold text-red-700 mb-2">
          Error Loading Products
        </h2>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()} // Simple retry: reload page
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header with Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Our Products
          </h1>
          <p className="text-gray-500 mt-1">
            {filteredProducts.length} of {products.length} products shown
          </p>
        </div>

        <div className="w-full md:w-auto flex items-center space-x-2">
          {/* Search Input */}
          <div className="relative flex-grow max-w-xs md:max-w-sm">
            <input
              type="search" // Use type="search" for better semantics/clearing
              placeholder="Search by name, description, SKU..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              aria-label="Search products"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Filter Button (Functionality not implemented in this example) */}
          <button
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter products"
            title="Filter products (coming soon)" // Indicate WIP
            disabled // Disable if filters aren't implemented
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Product Grid or No Results Message */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-6 border border-dashed border-gray-300 rounded-lg">
          <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Products Found
          </h3>
          <p className="text-gray-500 mb-4">
            No products matched your search &quot;{searchQuery}&quot;. Try searching for
            something else.
          </p>
          <button
            className="text-blue-600 hover:underline font-medium"
            onClick={() => setSearchQuery("")} // Clear search action
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsGrid;
