"use client"

import { useState } from "react"
import { type Control, Controller, useFieldArray } from "react-hook-form"
import { Info, Plus, Trash2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

interface ProductPricingProps {
  control: Control<any>
  errors: any
}

export function ProductPricing({ control, errors }: ProductPricingProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "sellingUnits",
  })

  const [showWholesale, setShowWholesale] = useState(false)

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-lg font-medium mb-2">Pricing Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Set the pricing details for your product, including retail and wholesale prices.
        </p>
      </div>

      {/* Base Unit Configuration */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="font-medium">Base Unit Configuration</h4>
            <p className="text-sm text-muted-foreground">
              Define how your product is measured and sold. This affects inventory tracking and pricing.
            </p>

            <FormField
              control={control}
              name="baseUnit"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Base Unit*</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">
                            The smallest unit by which this product is tracked in inventory.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select base unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="pair">Pair</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="g">Gram</SelectItem>
                      <SelectItem value="l">Liter</SelectItem>
                      <SelectItem value="ml">Milliliter</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="cm">Centimeter</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This is the smallest unit by which you track this product in inventory.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selling Units Configuration */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Selling Units</h4>
                <p className="text-sm text-muted-foreground">Define how your product can be sold to customers.</p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => append({ unit: "", conversionFactor: 1, isDefault: fields.length === 0 })}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Unit
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border rounded-md p-4">
                  <FormField
                    control={control}
                    name={`sellingUnits.${index}.unit`}
                    render={({ field: unitField }) => (
                      <FormItem>
                        <FormLabel>Unit Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., piece, dozen, box" {...unitField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`sellingUnits.${index}.conversionFactor`}
                    render={({ field: factorField }) => (
                      <FormItem>
                        <FormLabel>Conversion Factor*</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                            {...factorField}
                            onChange={(e) => factorField.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How many base units are in this selling unit (e.g., 12 pieces = 1 dozen)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-4">
                    <FormField
                      control={control}
                      name={`sellingUnits.${index}.isDefault`}
                      render={({ field: defaultField }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Switch checked={defaultField.value} onCheckedChange={defaultField.onChange} />
                          </FormControl>
                          <FormLabel className="cursor-pointer">Default selling unit</FormLabel>
                        </FormItem>
                      )}
                    />

                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <div className="text-center p-4 border border-dashed rounded-md">
                  <p className="text-sm text-muted-foreground">
                    No selling units defined. Add at least one selling unit.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retail Pricing */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="font-medium">Retail Pricing</h4>
            <p className="text-sm text-muted-foreground">Set the standard retail price for this product.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Retail Price*</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[200px] text-xs">
                              The standard selling price of this product to retail customers.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-8"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="baseCost"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Cost Price</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[200px] text-xs">The cost to acquire or produce this product.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-8"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wholesale Pricing */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Wholesale Pricing</h4>
                <p className="text-sm text-muted-foreground">Set wholesale pricing for bulk orders.</p>
              </div>
              <Switch checked={showWholesale} onCheckedChange={setShowWholesale} />
            </div>

            {showWholesale && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <FormField
                  control={control}
                  name="wholesalePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wholesale Price*</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-8"
                            {...field}
                            onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                            value={field.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="wholesaleMinQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 1)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>Minimum quantity required for wholesale pricing</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Settings */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="font-medium">Inventory Settings</h4>
            <p className="text-sm text-muted-foreground">Configure inventory management settings for this product.</p>

            <FormField
              control={control}
              name="reorderPoint"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Reorder Point</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">
                            The inventory level at which you should reorder this product.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="5"
                      {...field}
                      onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>Default is 5 units</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-4">Pricing Summary</h4>
          <PricingSummary control={control} />
        </CardContent>
      </Card>
    </div>
  )
}

function PricingSummary({ control }: { control: Control<any> }) {
  return (
    <div className="space-y-4 text-sm">
      <Controller
        control={control}
        name="basePrice"
        render={({ field }) => {
          const basePrice = Number.parseFloat(field.value) || 0
          const baseCost = Number.parseFloat(control._formValues.baseCost) || 0
          const wholesalePrice = Number.parseFloat(control._formValues.wholesalePrice) || 0

          const margin = baseCost > 0 ? ((basePrice - baseCost) / basePrice) * 100 : 0
          const profit = basePrice - baseCost

          const wholesaleMargin =
            baseCost > 0 && wholesalePrice > 0 ? ((wholesalePrice - baseCost) / wholesalePrice) * 100 : 0
          const wholesaleProfit = wholesalePrice - baseCost

          return (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Retail</div>
                <div></div>

                <div className="text-muted-foreground">Price:</div>
                <div className="text-right">${basePrice.toFixed(2)}</div>

                <div className="text-muted-foreground">Cost:</div>
                <div className="text-right">${baseCost.toFixed(2)}</div>

                <div className="text-muted-foreground">Profit:</div>
                <div className={`text-right ${profit >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  ${profit.toFixed(2)}
                </div>

                <div className="text-muted-foreground">Margin:</div>
                <div className={`text-right ${margin >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  {margin.toFixed(2)}%
                </div>
              </div>

              {wholesalePrice > 0 && (
                <>
                  <Separator />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium">Wholesale</div>
                    <div></div>

                    <div className="text-muted-foreground">Price:</div>
                    <div className="text-right">${wholesalePrice.toFixed(2)}</div>

                    <div className="text-muted-foreground">Cost:</div>
                    <div className="text-right">${baseCost.toFixed(2)}</div>

                    <div className="text-muted-foreground">Profit:</div>
                    <div className={`text-right ${wholesaleProfit >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                      ${wholesaleProfit.toFixed(2)}
                    </div>

                    <div className="text-muted-foreground">Margin:</div>
                    <div className={`text-right ${wholesaleMargin >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                      {wholesaleMargin.toFixed(2)}%
                    </div>
                  </div>
                </>
              )}
            </>
          )
        }}
      />
    </div>
  )
}
