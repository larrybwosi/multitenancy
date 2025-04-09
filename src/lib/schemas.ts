import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const CartItemSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional().nullable(), // Optional variant support
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  // Note: unitPrice and unitCost will be fetched server-side for security
});

export const CreateSaleSchema = z.object({
  customerId: z.string().cuid().optional().nullable(),
  userId: z.string().cuid().optional().nullable(),
  items: z.array(CartItemSchema).min(1, "Cart cannot be empty"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
  // Add other relevant fields like discountAmount, taxAmount if calculated client-side
  // Or better, calculate totals server-side based on items
});
