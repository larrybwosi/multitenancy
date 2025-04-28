"use client"

import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ProductSuppliersProps {
  suppliers: any[]
  onRemove: (index: number) => void
}

export function ProductSuppliers({ suppliers, onRemove }: ProductSuppliersProps) {
  // Mock supplier data
  const supplierNames = {
    supplier1: "Acme Supplies",
    supplier2: "Global Distribution Inc.",
    supplier3: "Tech Parts Ltd.",
    supplier4: "Quality Goods Co.",
  }

  if (suppliers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No suppliers added yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click the "Add Supplier" button to link suppliers to this product.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Supplier</TableHead>
            <TableHead>Supplier SKU</TableHead>
            <TableHead>Cost Price</TableHead>
            <TableHead>Min. Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier, index) => (
            <TableRow key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <TableCell className="font-medium">
                {supplierNames[supplier.supplierId as keyof typeof supplierNames] || "Unknown Supplier"}
              </TableCell>
              <TableCell>{supplier.supplierSku || "—"}</TableCell>
              <TableCell>${supplier.costPrice?.toFixed(2) || "0.00"}</TableCell>
              <TableCell>{supplier.minimumOrderQuantity || "—"}</TableCell>
              <TableCell>
                {supplier.isPreferred ? (
                  <Badge className="bg-blue-500">Preferred</Badge>
                ) : (
                  <Badge variant="outline">Alternative</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
