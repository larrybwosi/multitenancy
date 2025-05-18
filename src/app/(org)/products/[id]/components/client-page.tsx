import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { MeasurementUnit } from '@/prisma/client';
import AddEditVariantModal from './add-edit-variant-modal';
import { useQueryState } from 'nuqs';
import { cn } from '@/lib/utils';
import { useUpdateProduct } from '@/lib/hooks/use-products';
import { EditProductSchema } from '@/lib/validations/product';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Input, Label, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '@/components/ui';

// Type definitions based on your Prisma schema
type Location = {
  id: string;
  name: string;
  isActive: boolean;
};

type Supplier = {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
};

type VariantStock = {
  id: string;
  locationId: string;
  location: Location;
  stockQuantity: number;
  reservedQuantity: number;
};

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  category: Category;
  isActive: boolean;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  width?: number;
  height?: number;
  length?: number;
  dimensionUnit?: MeasurementUnit;
  weight?: number;
  weightUnit?: MeasurementUnit;
  volumetricWeight?: number;
  defaultLocationId?: string;
  defaultLocation?: Location;
  variants: ProductVariant[];
  variantStock: VariantStock[];
  organizationId: string;
};

type ProductDetailProps = {
  product: Product;
  locations: Location[];
  suppliers: Supplier[];
};

const ProductDetailComponent: React.FC<ProductDetailProps> = ({ product, locations, suppliers }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useQueryState('modal', {
    parse: v => v === 'true',
    serialize: v => (v ? 'true' : 'false'),
  });

  const { mutateAsync: updateProduct, isPending: updating } = useUpdateProduct();

  const form = useForm<z.infer<typeof EditProductSchema>>({
    resolver: zodResolver(EditProductSchema),
    defaultValues: {
      productId: product.id,
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      barcode: product.barcode || '',
      categoryId: product.categoryId,
      isActive: product.isActive,
      imageUrls: product.imageUrls,
      width: product.width || undefined,
      height: product.height || undefined,
      length: product.length || undefined,
      dimensionUnit: product.dimensionUnit || undefined,
      weight: product.weight || undefined,
      weightUnit: product.weightUnit || undefined,
      volumetricWeight: product.volumetricWeight || undefined,
      defaultLocationId: product.defaultLocationId || undefined,
    },
  });

  const availableStock = product.variants.reduce((total, variant) => {
    return (
      total +
      variant.variantStocks.reduce((varTotal, stock) => {
        return varTotal + (stock.stockQuantity - stock.reservedQuantity);
      }, 0)
    );
  }, 0);

  const tabCategories = [
    { name: 'Details', id: 'details' },
    { name: 'Variants', id: 'variants' },
    { name: 'Inventory', id: 'inventory' },
    { name: 'Suppliers', id: 'suppliers' },
  ];

  const onSubmit = async (data: z.infer<typeof EditProductSchema>) => {
    try {
      // Only send changed fields
      const changedFields: Partial<typeof data> = {};
      Object.keys(data).forEach(key => {
        if (form.formState.dirtyFields[key as keyof typeof data]) {
          changedFields[key as keyof typeof data] = data[key as keyof typeof data];
        }
      });

      if (Object.keys(changedFields).length > 0) {
        await updateProduct({
          ...changedFields,
          productId: product.id,
        });
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  return (
    <Card>
      {/* Product Header */}
      <CardHeader className="border-b">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <CardTitle>{product.name}</CardTitle>
              {product.isActive ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </div>
            <CardDescription className="mt-1">
              <span className="font-medium">SKU:</span> {product.sku}{' '}
              {product.barcode && `• Barcode: ${product.barcode}`}
            </CardDescription>
            <CardDescription className="mt-1">
              <span className="font-medium">Category:</span> {product.category.name}
            </CardDescription>
          </div>
          <div className="flex gap-3">
            <Button
              variant={form.formState.isDirty ? 'outline' : 'secondary'}
              onClick={() => form.reset()}
              disabled={!form.formState.isDirty}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={!form.formState.isDirty || updating}
              loading={updating}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Product Content */}
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {/* Left Column - Images & Stock Summary */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square relative">
            {product.imageUrls.length > 0 ? (
              <Image
                src={product.imageUrls[activeImageIndex]}
                alt={product.name}
                fill
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-200">
                <span className="text-gray-400 text-lg">No image available</span>
              </div>
            )}
          </div>

          {/* Thumbnail row */}
          {product.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.imageUrls.map((url, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="icon"
                  className={`w-16 h-16 rounded border-2 flex-shrink-0 p-0 ${
                    index === activeImageIndex ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <Image
                    src={url}
                    fill
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </Button>
              ))}
            </div>
          )}

          {/* Stock Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inventory Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Available Stock:</span>
                <span
                  className={cn(
                    'font-medium',
                    availableStock <= 0 ? 'text-destructive' : availableStock < 10 ? 'text-amber-600' : 'text-success'
                  )}
                >
                  {availableStock} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Variants:</span>
                <span className="font-medium">{product.variants.length}</span>
              </div>
              {product.defaultLocation && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Default Location:</span>
                  <span className="font-medium">{product.defaultLocation.name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tab Interface */}
        <div className="md:col-span-2">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {tabCategories.map(category => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Details Panel */}
            <TabsContent value="details">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      {...form.register('description')}
                      className="min-h-[100px]"
                      placeholder="Product description"
                    />
                  </div>

                  {/* Dimensions */}
                  <div className="space-y-4">
                    <Label>Physical Properties</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Dimensions</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Length</Label>
                            <Input
                              {...form.register('length', { valueAsNumber: true })}
                              type="number"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Width</Label>
                            <Input
                              {...form.register('width', { valueAsNumber: true })}
                              type="number"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Height</Label>
                            <Input
                              {...form.register('height', { valueAsNumber: true })}
                              type="number"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Weight</Label>
                        <div className="flex gap-2">
                          <Input
                            {...form.register('weight', { valueAsNumber: true })}
                            type="number"
                            min="0"
                            step="0.01"
                            className="flex-1"
                          />
                          <Select
                            {...form.register('weightUnit')}
                            value={form.watch('weightUnit')}
                            onValueChange={val => form.setValue('weightUnit', val as MeasurementUnit)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="KG">KG</SelectItem>
                              <SelectItem value="G">G</SelectItem>
                              <SelectItem value="LB">LB</SelectItem>
                              <SelectItem value="OZ">OZ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2">
                    <Label>Metadata</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Created</Label>
                        <p className="text-sm font-medium">{new Date(product.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Last Updated</Label>
                        <p className="text-sm font-medium">{new Date(product.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Variants Panel */}
            <TabsContent value="variants">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {product.variants.length > 0 ? (
                    <ScrollArea className="h-[500px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Variant</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Attributes</TableHead>
                            <TableHead>Buying Price</TableHead>
                            <TableHead>Selling Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {product.variants.map(variant => {
                            const totalStock = variant.variantStocks.reduce(
                              (sum, stock) => sum + stock.stockQuantity - stock.reservedQuantity,
                              0
                            );

                            return (
                              <TableRow key={variant.id}>
                                <TableCell className="font-medium">{variant.name}</TableCell>
                                <TableCell>{variant.sku}</TableCell>
                                <TableCell>
                                  {/* {Object.entries(variant.attributes).map(([key, value]) => (
                                    <Badge key={key} variant="outline" className="mr-1">
                                      {key}: {value}
                                    </Badge>
                                  ))} */}
                                </TableCell>
                                <TableCell>${variant.buyingPrice}</TableCell>
                                <TableCell>${variant.retailPrice || 'N/A'}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      totalStock <= 0
                                        ? 'destructive'
                                        : totalStock < variant.reorderPoint
                                          ? 'warning'
                                          : 'success'
                                    }
                                  >
                                    {totalStock}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {variant.isActive ? (
                                    <Badge variant="success">Active</Badge>
                                  ) : (
                                    <Badge variant="destructive">Inactive</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                      <p className="text-muted-foreground">No variants found for this product.</p>
                      <Button onClick={() => setIsModalOpen(true)}>Add Variant</Button>
                    </div>
                  )}
                  {product.variants.length > 0 && (
                    <div className="flex justify-end">
                      <Button onClick={() => setIsModalOpen(true)}>Add Variant</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Panel */}
            <TabsContent value="inventory">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default Location</Label>
                      <Select
                        {...form.register('defaultLocationId')}
                        value={form.watch('defaultLocationId')}
                        onValueChange={val => form.setValue('defaultLocationId', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select default location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Inventory By Location</Label>
                    {product.variants.length > 0 ? (
                      <ScrollArea className="h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Variant</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Available</TableHead>
                              <TableHead>Reserved</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Reorder Point</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {product.variants.flatMap(variant =>
                              variant.variantStocks.map(stock => (
                                <TableRow key={`${variant.id}-${stock.locationId}`}>
                                  <TableCell className="font-medium">{variant.name}</TableCell>
                                  <TableCell>{stock.location.name}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        stock.stockQuantity - stock.reservedQuantity <= 0
                                          ? 'destructive'
                                          : stock.stockQuantity - stock.reservedQuantity < variant.reorderPoint
                                            ? 'warning'
                                            : 'success'
                                      }
                                    >
                                      {stock.stockQuantity - stock.reservedQuantity}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{stock.reservedQuantity}</TableCell>
                                  <TableCell>{stock.stockQuantity}</TableCell>
                                  <TableCell>{variant.reorderPoint}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 space-y-4">
                        <p className="text-muted-foreground">No inventory data available.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Suppliers Panel */}
            <TabsContent value="suppliers">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Variant</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Preferred</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {product.variants.flatMap(variant =>
                          variant.suppliers.map(supplierLink => (
                            <TableRow key={`${variant.id}-${supplierLink.id}`}>
                              <TableCell className="font-medium">{supplierLink.supplier.name}</TableCell>
                              <TableCell>{variant.name}</TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground">
                                  {supplierLink.supplier.email && <div>{supplierLink.supplier.email}</div>}
                                  {supplierLink.supplier.phone && <div>{supplierLink.supplier.phone}</div>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Checkbox checked={supplierLink.isPreferred} disabled />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Add Supplier</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Supplier</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map(supplier => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Variant</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select variant" />
                          </SelectTrigger>
                          <SelectContent>
                            {product.variants.map(variant => (
                              <SelectItem key={variant.id} value={variant.id}>
                                {variant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button className="w-full">Add Supplier Link</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <AddEditVariantModal
        open={isModalOpen as boolean}
        onOpenChange={() => setIsModalOpen(false)}
        productId={product.id}
      />
    </Card>
  );
};

export default ProductDetailComponent;
