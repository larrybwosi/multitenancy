import { z } from 'zod';
import { FulfillmentType, OrderStatus, OrderType, PaymentMethod, PaymentStatus, Prisma } from '@/prisma/client';

// Define Zod schemas for enums first
const OrderStatusSchema = z.nativeEnum(OrderStatus);

const PaymentStatusSchema = z.nativeEnum(PaymentStatus);

const OrderTypeSchema = z.nativeEnum(OrderType);

const FulfillmentTypeSchema = z.nativeEnum(FulfillmentType);

const PaymentMethodSchema = z.nativeEnum(PaymentMethod);

// Helper schema for Decimal validation
const DecimalSchema = z.union([z.string(), z.number()]).transform(value => new Prisma.Decimal(value.toString()));

// --- Order Update Validation Schema ---
export const UpdateOrderInputSchema = z
  .object({
    status: OrderStatusSchema.optional(),
    paymentStatus: PaymentStatusSchema.optional(),
    paymentTransactionId: z.string().optional(),
    memberId: z.string().optional(),
    shippingAddress: z.string().optional(),
    notes: z.string().optional(),
    // Timestamps should not be in the input - they're set automatically
    confirmedAt: z.never().optional(),
    preparingAt: z.never().optional(),
    readyAt: z.never().optional(),
    dispatchedAt: z.never().optional(),
    deliveredAt: z.never().optional(),
    completedAt: z.never().optional(),
    cancelledAt: z.never().optional(),
  })
  .strict(); // strict() ensures no extra fields are passed

// --- Order Create Validation Schema ---
const OrderItemSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: DecimalSchema,
  notes: z.string().optional(),
});

export const CreateOrderInputSchema = z
  .object({
    organizationId: z.string().min(1, 'Organization ID is required'),
    customerId: z.string().optional(),
    memberId: z.string().optional(),
    orderType: OrderTypeSchema,
    fulfillmentType: FulfillmentTypeSchema,
    items: z.array(OrderItemSchema).min(1, 'At least one order item is required'),
    shippingAddress: z.string().optional(),
    billingAddress: z.string().optional(),
    deliveryNotes: z.string().optional(),
    pickupLocationId: z.string().optional(),
    tableNumber: z.string().optional(),
    estimatedPreparationTime: z.number().int().positive().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    paymentMethod: PaymentMethodSchema.optional(),
    paymentStatus: PaymentStatusSchema.optional(),
    discountAmount: DecimalSchema.optional(),
    taxAmount: DecimalSchema.optional(),
    shippingAmount: DecimalSchema.optional(),
  })
  .strict();
