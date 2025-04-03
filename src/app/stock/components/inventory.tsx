'use client';

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import RestockDialog from "./restock-modal";
import { getInventoryProducts } from "@/actions/stock";
import { formatCurrency } from "@/lib/utils";
import { InventoryValuationItem } from "../types";
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Edit2,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ProductWithInventory } from "@/lib/types";

interface InventoryTabProps {
  organizationId: string;
}

const InventoryTab = ({ organizationId }: InventoryTabProps) => {
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [restockQuantities, setRestockQuantities] = useState<
    Record<number, number>
  >({});
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Load products from the server
        const response = await getInventoryProducts(organizationId, {
          page: currentPage,
          limit: 10,
          sortBy,
          sortOrder,
          search: searchQuery.length > 2 ? searchQuery : undefined,
        });

        if (response.success && response.data) {
          setProducts(response.data);
          setTotalPages(response.meta?.totalPages || 1);
        } else {
          console.error("Failed to fetch products:", response.error);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, sortBy, sortOrder, searchQuery, organizationId]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Handle pagination
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const handleRestockChange = (productId: number, value: string) => {
    const quantity = parseInt(value) || 0;
    setRestockQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const handleRestock = (productId: number) => {
    // In a real app, you would call an API here
    console.log(
      `Restocking ${restockQuantities[productId]} units of product ${productId}`
    );
    setRestockQuantities((prev) => {
      const newQuantities = { ...prev };
      delete newQuantities[productId];
      return newQuantities;
    });
  };

  const totalValue = products.reduce(
    (sum, item) => sum + item.totalValue,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <CardTitle>Inventory Valuation</CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <Button>Export Report</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[300px] cursor-pointer"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Product
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort("sku")}
              >
                <div className="flex items-center gap-1">
                  SKU
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead 
                className="text-right cursor-pointer"
                onClick={() => handleSort("stock")}
              >
                <div className="flex items-center justify-end gap-1">
                  In Stock
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="text-right cursor-pointer"
                onClick={() => handleSort("price")}
              >
                <div className="flex items-center justify-end gap-1">
                  Price
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Restock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const totalStock = product.stock;
                const isLowStock = product.min_stock_level && totalStock < product.min_stock_level;
                const isOutOfStock = totalStock === 0;
                const value = totalStock * (product.purchase_price || 0);

                return (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {product.image_url && (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        )}
                        <div>
                          <div>{product.name}</div>
                          {(isLowStock || isOutOfStock) && (
                            <Badge variant={isOutOfStock ? "destructive" : "outline"} className="mt-1">
                              {isOutOfStock ? "Out of stock" : "Low stock"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.sku || "-"}</TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="flex justify-end items-center gap-1">
                        {totalStock}
                        {isLowStock && !isOutOfStock && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                        {isOutOfStock && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(value)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) =>
                            handleRestockChange(product.id, value)
                          }
                          value={restockQuantities[product.id]?.toString() || ""}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Qty" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 5, 10, 20, 50, 100].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {restockQuantities[product.id] && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedProduct(product.id)}
                          >
                            Confirm
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="bg-muted/50">
        <div className="flex justify-between w-full">
          <span className="font-medium">Total Inventory Value:</span>
          <span className="font-bold">{formatCurrency(totalValue)}</span>
        </div>
      </CardFooter>

      {selectedProduct && (
        <RestockDialog
          product={products.find((p) => p.id === selectedProduct)!}
          quantity={restockQuantities[selectedProduct] || 0}
          onClose={() => setSelectedProduct(null)}
          onConfirm={() => {
            handleRestock(selectedProduct);
            setSelectedProduct(null);
          }}
        />
      )}
    </Card>
  );
};

export default InventoryTab;
