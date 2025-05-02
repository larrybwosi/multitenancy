import { Customer, PaymentMethod, Product, ProductVariant, Sale, SaleItem } from "@prisma/client";
import { Member } from "better-auth/plugins";
import { z } from "zod";

// Updated Schema to include updateStock option
export const ProcessSaleSchema = z.object({
  cartItems: z
    .array(
      z.object({
        productId: z.string().cuid('Invalid Product ID format.'),
        // Variant ID is optional if selling the base product without variants,
        // or if the product has no variants. Check schema relations.
        variantId: z.string().cuid('Invalid Variant ID format.').optional().nullable(),
        quantity: z.number().int('Quantity must be an integer.').positive('Quantity must be positive.'),
      })
    )
    .min(1, 'Cart cannot be empty.'),
  // Assuming locationId is determined by the POS terminal/session
  // This MUST be provided by the frontend context
  locationId: z.string().cuid('Location ID is required.'),
  customerId: z.string().cuid('Invalid Customer ID format.').optional().nullable(),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Invalid Payment Method selected.' }),
  }),
  discountAmount: z.number().min(0, 'Discount cannot be negative.').default(0),
  // Add other potential inputs like notes, cashDrawerId if needed
  cashDrawerId: z.string().cuid('Invalid Cash Drawer ID format.').optional().nullable(),
  notes: z.string().optional(),
  // Add updateStock flag with default value of true
  updateStock: z.boolean().default(true), // Whether to update stock levels or just record the sale
});


// Type returned after successful sale (keeping original structure)
export type ProcessSaleResult = {
  success: boolean;
  message: string;
  saleId?: string;
  receiptUrl?: string | null;
  data?: SaleWithDetails | null; // Sale with details for receipt generation
  error?: string | object; // Return structured error or message string
};

// Type for Sale with necessary relations for receipt generation
// Adjust includes based on what generateAndSaveReceiptPdf actually needs
export type SaleWithDetails = Sale & {
  items: (SaleItem & {
    product: Product & { category?: { name: string } };
    variant: ProductVariant | null;
  })[];
  customer: Customer | null;
  member: Member & { user: { name: string | null } }; // [cite: 11]
  organization: { name: string /*, other fields */ };
};

