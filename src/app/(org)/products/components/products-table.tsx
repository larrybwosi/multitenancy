import { useState, useRef, useEffect } from "react";
import {
  Edit,
  Package,
  Trash2,
  MoreHorizontal,
  Grid,
  List,
  Plus,
  Info,
} from "lucide-react";
import Image from "next/image";
import { FilterControls, FilterControlsProps } from "@/components/file-controls";
import { Pagination, PaginationProps } from "@/components/pagination";
import ProductModal from "./product-details-modal";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Variant {
  id: string;
  name: string;
  price: number;
  cost: number;
  sku: string;
  barcode: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  basePrice: string | number;
  baseCost: number | null;
  category: Category;
  categoryId: string;
  imageUrls: string[];
  totalStock: number;
  reorderPoint: number;
  isActive: boolean;
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
  variants?: Variant[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProductTableProps {
  products: Product[];
  paginationProps: PaginationProps;
  onEdit: (product: Product) => void;
  onRestock: (product: Product) => void;
  onDelete: (product: Product) => void;
  filterControlsProps: FilterControlsProps;
}



export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  paginationProps,
  onEdit,
  onRestock,
  onDelete,
  filterControlsProps,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (productId: string) => {
    setActiveDropdown(activeDropdown === productId ? null : productId);
  };

  const getStatusClass = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  const enhancedFilterProps = {
    searchPlaceholder: "Search products...",
    showSearch: true,
    showFilterButton: true,
    ...filterControlsProps,
    exportActions: [
      ...(filterControlsProps.exportActions || []),
      {
        label: viewMode === "list" ? "Grid View" : "List View",
        icon: viewMode === "list" 
          ? <Grid className="w-4 h-4" /> 
          : <List className="w-4 h-4" />,
        onClick: () => setViewMode(viewMode === "list" ? "grid" : "list"),
      },
    ],
  };

  const ProductRow: React.FC<{ product: Product }> = ({ product }) => (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            {product.imageUrls.length > 0 ? (
              <div 
                className="h-10 w-10 rounded-md border border-gray-200 overflow-hidden relative cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <Image
                  src={product.imageUrls[0]}
                  alt={product.name}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                <Package className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {product.name}
            </div>
            <button 
              onClick={() => setSelectedProduct(product)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center mt-1 transition-colors"
            >
              <Info className="h-3 w-3 mr-1" /> View details
            </button>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {product.sku}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {product.category.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
        ${typeof product.basePrice === 'string' 
          ? parseFloat(product.basePrice).toFixed(2)
          : product.basePrice.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {product.totalStock}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {product.reorderPoint}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(product.isActive)}`}
        >
          {product.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
        <button
          className="text-gray-400 hover:text-gray-600 focus:outline-none p-2 rounded-full hover:bg-gray-100 transition-colors"
          onClick={() => toggleDropdown(product.id)}
          aria-label="More options"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {activeDropdown === product.id && (
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-10 border border-gray-200"
          >
            <div className="py-1" role="menu">
              <button
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                onClick={() => {
                  onEdit(product);
                  setActiveDropdown(null);
                }}
              >
                <Edit className="mr-3 h-4 w-4 text-gray-500" /> Edit Product
              </button>
              <button
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                onClick={() => {
                  onRestock(product);
                  setActiveDropdown(null);
                }}
              >
                <Plus className="mr-3 h-4 w-4 text-gray-500" /> Restock Inventory
              </button>
              <div className="border-t border-gray-200"></div>
              <button
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full text-left transition-colors"
                onClick={() => {
                  onDelete(product);
                  setActiveDropdown(null);
                }}
              >
                <Trash2 className="mr-3 h-4 w-4 text-red-500" /> Delete Product
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-100">
      <div 
        className="h-48 w-full bg-gray-100 relative cursor-pointer group"
        onClick={() => setSelectedProduct(product)}
      >
        {product.imageUrls.length > 0 ? (
          <Image
            src={product.imageUrls[0]}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {product.name}
          </h3>
          <div className="relative">
            <button
              className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => toggleDropdown(product.id)}
              aria-label="More options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {activeDropdown === product.id && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-10 border border-gray-200"
              >
                <div className="py-1" role="menu">
                  <button
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                    onClick={() => {
                      onEdit(product);
                      setActiveDropdown(null);
                    }}
                  >
                    <Edit className="mr-3 h-4 w-4 text-gray-500" /> Edit Product
                  </button>
                  <button
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                    onClick={() => {
                      onRestock(product);
                      setActiveDropdown(null);
                    }}
                  >
                    <Plus className="mr-3 h-4 w-4 text-gray-500" /> Restock Inventory
                  </button>
                  <div className="border-t border-gray-200"></div>
                  <button
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full text-left transition-colors"
                    onClick={() => {
                      onDelete(product);
                      setActiveDropdown(null);
                    }}
                  >
                    <Trash2 className="mr-3 h-4 w-4 text-red-500" /> Delete Product
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center">
          <span
            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(product.isActive)}`}
          >
            {product.isActive ? "Active" : "Inactive"}
          </span>
          <span className="ml-2 text-sm text-gray-500 truncate">
            {product.category.name}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">
            ${typeof product.basePrice === 'string' 
              ? parseFloat(product.basePrice).toFixed(2)
              : product.basePrice.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
            SKU: {product.sku}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="text-sm bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Stock: </span>
            <span className="font-medium">{product.totalStock}</span>
          </div>
          <div className="text-sm bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Reorder: </span>
            <span className="font-medium">{product.reorderPoint}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <FilterControls {...enhancedFilterProps} />

      {viewMode === "list" ? (
        <div className="mt-4 bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Point
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <div className="mt-6">
        <Pagination 
          currentPage={paginationProps.currentPage}
          totalPages={paginationProps.totalPages}
          pageSize={paginationProps.pageSize}
          totalItems={paginationProps.totalItems}
          onPageChange={paginationProps.onPageChange}
          onPageSizeChange={paginationProps.onPageSizeChange}
          className="border-t border-gray-200 pt-4"
        />
      </div>

      {selectedProduct && (
        <ProductModal
          open
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </div>
  );
};