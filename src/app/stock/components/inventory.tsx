'use client';

import { useState } from "react";
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
import { inventoryItems } from "../mock-data";


const InventoryTab = () => {
  const [restockQuantities, setRestockQuantities] = useState<
    Record<number, number>
  >({});
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = inventoryItems.reduce(
    (sum, item) => sum + item.totalValue,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <CardTitle>Inventory Valuation</CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Search products..."
              className="max-w-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button>Export Report</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Selling Unit</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Restock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    )}
                    {item.name}
                  </div>
                </TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>
                  <Badge variant="outline">{item.category}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {item.stock}
                    {restockQuantities[item.id] && (
                      <span className="text-muted-foreground">
                        → {item.stock + restockQuantities[item.id]}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.sellingUnit}</TableCell>
                <TableCell>
                  {item.purchasePrice
                    ? formatCurrency(item.purchasePrice)
                    : "N/A"}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(item.totalValue)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) =>
                        handleRestockChange(item.id, value)
                      }
                      value={restockQuantities[item.id]?.toString() || ""}
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
                    {restockQuantities[item.id] && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedProduct(item.id)}
                      >
                        Confirm
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
          product={inventoryItems.find((p) => p.id === selectedProduct)!}
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default InventoryTab;
