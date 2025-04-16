"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addStockBatch } from "@/actions/stock.actions"; // Server Action
import { getLocationsByType } from "@/actions/warehouse"; // Server Action to get locations
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { LocationSelect } from "./location-select"; // Your custom location select

// Utilities and Types
import { cn } from "@/lib/utils";
import { ProductVariant, InventoryLocation } from "@prisma/client"; // Assuming Prisma types
import {
  RestockSchema,
  RestockSchemaType,
  Supplier, // Import Supplier type
  ProductWithRelations, // Import Product type
} from "@/lib/validations/product"; // Import schema and types

// Define Props Interface
interface RestockDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: ProductWithRelations | null;
  variants?: ProductVariant[];
  suppliers: Supplier[]; // <-- Add suppliers prop
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
}

export default function RestockDialog({
  isOpen,
  setIsOpen,
  product,
  variants = [],
  suppliers = [], // <-- Destructure suppliers prop with default
  onSuccess,
  onError,
  onClose,
}: RestockDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const hasVariants = variants && variants.length > 0;
  const hasSuppliers = suppliers && suppliers.length > 0;
  const hasLocations = locations && locations.length > 0;

  // Effect to fetch locations (assuming only WAREHOUSE type for now)
  useEffect(() => {
    const fetchWarehouseLocations = async () => {
      setLoadingLocations(true);
      try {
        // Fetch only WAREHOUSE locations, adjust if needed
        const result = await getLocationsByType("WAREHOUSE");
        if (result.data) {
          setLocations(result.data);
        } else {
          // Handle case where fetching locations fails
          console.error("Failed to fetch locations:", result.error);
          setLocations([]);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        setLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    if (isOpen) {
      fetchWarehouseLocations();
    }
  }, [isOpen]); // Fetch locations when the dialog opens

  // Initialize the form
  const form = useForm({
    resolver: zodResolver(RestockSchema),
    defaultValues: {
      // Set initial default values
      productId: product?.id || "",
      variantId: null,
      supplierId: "",
      initialQuantity: 1,
      purchasePrice: 0,
      expiryDate: null,
      location: "",
      purchaseItemId: null,
    },
  });

  // Effect to reset form when dialog opens or product changes
  useEffect(() => {
    if (isOpen && product) {
      form.reset({
        productId: product.id,
        variantId: null,
        supplierId: "",
        initialQuantity: 1,
        purchasePrice: 0,
        expiryDate: null,
        location: "",
        purchaseItemId: null,
      });
      setServerError(null); // Clear any previous server errors
    }
  }, [isOpen, product, form]);

  // Handle form submission
  // Handle form submission (Updated for FormData)
  const onSubmit = (data: RestockSchemaType) => {
    // data is the validated object from RHF
    if (!product) return; // Should not happen if button is enabled correctly

    setServerError(null);

    // --- Create FormData ---
    const formData = new FormData();

    // Iterate over the validated data from react-hook-form
    Object.entries(data).forEach(([key, value]) => {
      // Check if the value is meaningful (not null or undefined)
      // We rely on the server action's Zod parsing for coercion of numbers etc.
      // But we need to format specific types for FormData transmission.
      if (value !== null && value !== undefined) {
        if (key === "expiryDate" && value instanceof Date) {
          // Send dates as ISO strings (server action expects this)
          formData.append(key, value.toISOString());
        } else if (typeof value === "number") {
          // Send numbers as strings
          formData.append(key, String(value));
        } else if (typeof value === "string" && value !== "") {
          // Append non-empty strings (covers productId, supplierId, location, variantId, purchaseItemId if set)
          formData.append(key, value);
        }
        // Add handling for other types like booleans if needed
      }
      // If value is null, undefined, or an empty string (for optional strings),
      // it's simply *not appended* to formData. The server-side Zod schema
      // (using .optional().nullable()) should handle the absence correctly.
    });

    // --- Debugging: Log FormData (Optional) ---
    // console.log("Submitting FormData:");
    // for (let pair of formData.entries()) {
    //   console.log(`${pair[0]}: ${pair[1]}`);
    // }
    // --- End Debugging ---

    startTransition(async () => {
      // --- Call server action with FormData ---
      const result = await addStockBatch(formData); // Pass the formData object

      // --- Handle Response (This part remains the same) ---
      if (result?.error) {
        setServerError(result.error); // Display general error
        // Set field-specific errors from server action response
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof RestockSchemaType, {
                type: "server",
                message: errors.join(", "),
              });
            }
          });
        }
        onError?.(result.error); // Call error callback
      } else {
        // Success
        onSuccess?.(
          `Stock added successfully for "${product?.name}"! Batch ID: ${result.data?.id ?? "N/A"}` // Assuming result.data.id exists
        );
        setIsOpen(false); // Close dialog on success
      }
    });
  };

  // Handle dialog open/close changes
  const handleOpenChange = (open: boolean) => {
    if (!isPending) {
      // Prevent closing while submitting
      setIsOpen(open);
      if (!open) {
        form.reset(); // Reset form on close
        setServerError(null);
        setLocations([]); // Clear locations
        onClose?.(); // Call close callback
      }
    }
  };

  // Helper to check if form is ready to submit (basic check)
  const canSubmit =
    !!product && hasSuppliers && hasLocations && !loadingLocations;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        {" "}
        {/* Increased width slightly */}
        <DialogHeader>
          <DialogTitle>
            Add Stock / Restock: {product?.name ?? "Product"}
          </DialogTitle>
          <DialogDescription>
            Enter details for the incoming stock batch. Required fields are
            marked with <span className="text-destructive">*</span>.
          </DialogDescription>
        </DialogHeader>
        {product ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-3" // Added padding-right
            >
              {/* Display General Server Error */}
              {serverError && (
                <p className="text-sm font-medium text-destructive px-1">
                  Error: {serverError}
                </p>
              )}

              {/* Hidden Product ID */}
              <input
                type="hidden"
                {...form.register("productId")}
                value={product.id}
              />

              {/* Variant Selection (Optional) */}
              {hasVariants && (
                <FormField
                  control={form.control}
                  name="variantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Variant</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value || null)} // Ensure null if empty selected
                        value={field.value ?? ""} // Handle null for Select
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select variant (if applicable)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None (Base Product)</SelectItem>
                          {variants.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {variant.name}{" "}
                              {variant.sku ? `(${variant.sku})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Supplier Selection (Required) */}
              {hasSuppliers ? (
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Supplier <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        required // HTML5 required for accessibility hint
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage /> {/* Shows Zod validation error */}
                    </FormItem>
                  )}
                />
              ) : (
                <FormItem>
                  <FormLabel>
                    Supplier <span className="text-destructive">*</span>
                  </FormLabel>
                  <Input disabled value="No suppliers available" />
                  <FormDescription className="text-destructive">
                    Cannot add stock without suppliers.
                  </FormDescription>
                </FormItem>
              )}

              {/* Quantity (Required) */}
              <FormField
                control={form.control}
                name="initialQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantity Received{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g., 50"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value, 10)
                          )
                        } // Ensure integer
                        value={field.value ?? 1} // Handle potential null/undefined
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grid for Price and Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Purchase Price (Required) */}
                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Unit Purchase Cost ($){" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g., 5.50"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? ""
                                : parseFloat(e.target.value)
                            )
                          } // Ensure float
                          value={field.value ?? 0} // Handle potential null/undefined
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expiry Date (Optional) */}
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-1.5">
                      {" "}
                      {/* Align label better */}
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isPending}
                            >
                              {field.value ? (
                                format(field.value, "PPP") // Format date nicely
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            disabled={(
                              date // Disable past dates
                            ) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Selection (Required) */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Storage Location{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      {loadingLocations ? (
                        <div className="flex items-center space-x-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading locations...</span>
                        </div>
                      ) : hasLocations ? (
                        <LocationSelect
                          locations={locations}
                          value={field.value ?? ""}
                          onChange={field.onChange} // Let RHF handle state
                          placeholder="Select a warehouse location"
                        />
                      ) : (
                        <Input disabled value="No locations available" />
                      )}
                    </FormControl>
                    {!loadingLocations && !hasLocations && (
                      <FormDescription className="text-destructive">
                        Cannot add stock without locations.
                      </FormDescription>
                    )}
                    <FormMessage /> {/* Shows Zod validation error */}
                  </FormItem>
                )}
              />

              {/* Optional Purchase Order Item Link */}
              {/* Uncomment and adjust if you implement this feature
              <FormField
                control={form.control}
                name="purchaseItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Order Item (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter Purchase Order Item ID"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              */}

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !canSubmit}>
                  {" "}
                  {/* Disable if loading/missing data */}
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isPending ? "Adding Stock..." : "Add Stock Batch"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          // Loading state if product data isn't available yet
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2">Loading Product...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}