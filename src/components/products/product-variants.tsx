"use client"

import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ProductVariantsProps {
  variants: any[]
  onRemove: (index: number) => void
}

export function ProductVariants({ variants, onRemove }: ProductVariantsProps) {
  if (variants.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No variants added yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click the "Add Variant" button to create product variations.
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
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Price Modifier</TableHead>
            <TableHead>Reorder Point</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((variant, index) => (
            <TableRow key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <TableCell className="font-medium">{variant.name}</TableCell>
              <TableCell>{variant.sku || "—"}</TableCell>
              <TableCell>
                {variant.priceModifier > 0 ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    +${variant.priceModifier.toFixed(2)}
                  </Badge>
                ) : variant.priceModifier < 0 ? (
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                    -${Math.abs(variant.priceModifier).toFixed(2)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">No change</span>
                )}
              </TableCell>
              <TableCell>{variant.reorderPoint}</TableCell>
              <TableCell>
                <Switch checked={variant.isActive} disabled />
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
