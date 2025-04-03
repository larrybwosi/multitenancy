// actions/business.actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/db'; // Assuming Prisma client setup
import {
  Category,
  Product,
  Stock,
  StockTransaction,
  Customer,
  Order,
  OrderItem,
  Delivery,
  Prisma,
  ProductType,
  StockTransactionType,
  OrderStatus,
  DeliveryType,
  PaymentMethod,
  MemberRole
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';


// --- Helper Function (Simulated Auth) ---
// In real app, get this from your auth provider (NextAuth, Clerk, etc.)
// Needs to provide userId AND check their membership/role for the specific organisationId
export async function getBusinessAuthContext(organisationId: string, requiredRole?: MemberRole | MemberRole[]): Promise<{ userId: string; memberId: string; organisationId: string, role: MemberRole }> {
  // !! IMPORTANT: Replace with actual authentication and authorization logic !!
  // This MUST verify the user belongs to the organisationId and has the requiredRole
  const MOCK_USER_ID = 'clerk_or_nextauth_user_id'; // Example User ID
  const MOCK_MEMBER_ID = 'prisma_member_id_for_user_and_org'; // Example Member ID
  const MOCK_ROLE = MemberRole.STAFF; // Example Role

  // Placeholder check: Find member record
  // const member = await db.member.findUnique({ where: { userId_organisationId: { userId: MOCK_USER_ID, organisationId } } });
  // if (!member) throw new Error("Unauthorized: Not a member of this organisation.");
  // if (requiredRole) {
  //   const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  //   if (!roles.includes(member.role)) {
  //      throw new Error(`Unauthorized: Requires role(s): ${roles.join(', ')}`);
  //   }
  // }
  // return { userId: member.userId, memberId: member.id, organisationId: member.organisationId, role: member.role };

  // Returning mock data - REPLACE THIS
  if (!organisationId) throw new Error("Organisation ID missing for auth check."); // Basic check
  return { userId: MOCK_USER_ID, memberId: MOCK_MEMBER_ID, organisationId, role: MOCK_ROLE };
}


// --- Zod Schemas for Validation ---


const OrganisationIdSchema = z.string().cuid({ message: 'Invalid Organisation ID' });
const OptionalCuidSchema = z.string().cuid().optional().nullable();
const RequiredCuidSchema = z.string().cuid({ message: 'Required ID is missing or invalid' });
const PositiveDecimalSchema = z.coerce.number().positive({ message: 'Must be a positive number' }).transform(val => new Decimal(val));
const NonNegativeDecimalSchema = z.coerce.number().min(0, { message: 'Cannot be negative' }).transform(val => new Decimal(val));

const PositiveIntSchema = z.coerce.number().int().positive({ message: 'Must be a positive whole number' });
const NonNegativeIntSchema = z.coerce.number().int().min(0, { message: 'Must be a non-negative whole number' });
// --- Zod Schemas (Updates & Additions) ---

const AddStockPurchaseSchema = z.object({
  organisationId: OrganisationIdSchema,
  productId: RequiredCuidSchema,
  quantity: PositiveDecimalSchema,
  unit: z.string().min(1),
  buyingPricePerUnit: NonNegativeDecimalSchema,
  supplierId: OptionalCuidSchema, // Link to Supplier
  batchNumber: z.string().max(50).optional().nullable(),
  purchaseDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  attachmentUrl: z.string().url({ message: "Invalid URL format for attachment" }).optional().nullable(), // URL to uploaded attachment
});

// Pagination Schema (Example)
const PaginationSchema = z.object({
  skip: z.coerce.number().int().min(0).optional().default(0),
  take: z.coerce.number().int().positive().max(100).optional().default(25), // Limit page size
});

const GetStockTransactionsSchema = PaginationSchema.extend({
    organisationId: OrganisationIdSchema,
    productId: OptionalCuidSchema,
    type: z.nativeEnum(StockTransactionType).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
});


// Category Schemas
const CreateCategorySchema = z.object({
  organisationId: OrganisationIdSchema,
  name: z.string().min(2, { message: 'Category name must be at least 2 characters' }),
  description: z.string().max(500).optional().nullable(),
});
const UpdateCategorySchema = z.object({
  id: RequiredCuidSchema,
  organisationId: OrganisationIdSchema, // For auth check
  name: z.string().min(2).optional(),
  description: z.string().max(500).optional().nullable(),
});
const DeleteCategorySchema = z.object({
  id: RequiredCuidSchema,
  organisationId: OrganisationIdSchema,
});

// Product Schemas
const CreateProductSchema = z.object({
  organisationId: OrganisationIdSchema,
  name: z.string().min(2),
  description: z.string().max(1000).optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  type: z.nativeEnum(ProductType),
  unit: z.string().min(1, { message: "Unit is required (e.g., pcs, kg, hour)"}),
  currentSellingPrice: PositiveDecimalSchema,
  categoryId: OptionalCuidSchema,
  isActive: z.boolean().default(true),
});
const UpdateProductSchema = z.object({
  id: RequiredCuidSchema,
  organisationId: OrganisationIdSchema,
  name: z.string().min(2).optional(),
  description: z.string().max(1000).optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  type: z.nativeEnum(ProductType).optional(),
  unit: z.string().min(1).optional(),
  currentSellingPrice: PositiveDecimalSchema.optional(),
  categoryId: OptionalCuidSchema,
  isActive: z.boolean().optional(),
});
const DeleteProductSchema = z.object({
    id: RequiredCuidSchema,
    organisationId: OrganisationIdSchema,
    // Consider soft delete (setting isActive=false) instead of hard delete
});

// Customer Schemas
const CreateCustomerSchema = z.object({
    organisationId: OrganisationIdSchema,
    customerId: z.string().min(1).max(50), // Business defined ID
    name: z.string().min(1),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email().optional().nullable(),
    addressLine1: z.string().max(100).optional().nullable(),
    addressLine2: z.string().max(100).optional().nullable(),
    city: z.string().max(50).optional().nullable(),
    postalCode: z.string().max(20).optional().nullable(),
    country: z.string().max(50).optional().nullable(),
});
const UpdateCustomerSchema = z.object({
    id: RequiredCuidSchema,
    organisationId: OrganisationIdSchema,
    customerId: z.string().min(1).max(50).optional(),
    name: z.string().min(1).optional(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email().optional().nullable(),
    addressLine1: z.string().max(100).optional().nullable(),
    addressLine2: z.string().max(100).optional().nullable(),
    city: z.string().max(50).optional().nullable(),
    postalCode: z.string().max(20).optional().nullable(),
    country: z.string().max(50).optional().nullable(),
    // loyalty points usually adjusted via orders/specific actions, not direct update here
});
const DeleteCustomerSchema = z.object({
  id: RequiredCuidSchema,
  organisationId: OrganisationIdSchema,
});


// Order Schemas
const OrderItemInputSchema = z.object({
  productId: RequiredCuidSchema,
  quantity: PositiveDecimalSchema,
  // unitPriceAtSale will be fetched server-side
  // loyaltyPointsAwarded can be calculated server-side based on rules
});

const CreateOrderSchema = z.object({
  organisationId: OrganisationIdSchema,
  customerId: RequiredCuidSchema,
  items: z.array(OrderItemInputSchema).min(1, { message: "Order must have at least one item" }),
  status: z.nativeEnum(OrderStatus).default(OrderStatus.PENDING), // Default status
  discountAmount: NonNegativeDecimalSchema.optional().default(0),
  notes: z.string().max(1000).optional().nullable(),
  // Delivery related fields if creating directly with delivery info
  deliveryType: z.nativeEnum(DeliveryType).optional(),
  deliveryAddressLine1: z.string().max(100).optional().nullable(),
   // ... other delivery address fields
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  paymentReference: z.string().max(100).optional().nullable(),
});

const UpdateOrderStatusSchema = z.object({
    orderId: RequiredCuidSchema,
    organisationId: OrganisationIdSchema,
    status: z.nativeEnum(OrderStatus),
    // Optionally add fields for payment capture, delivery updates etc. when status changes
    paymentReference: z.string().max(100).optional().nullable(), // e.g. when moving to PAID
    trackingNumber: z.string().max(100).optional().nullable(), // e.g. when moving to SHIPPED
});



// --- Types for Return Values ---

type ActionResponse<T = null> = Promise<
  | { success: true; data: T }
  | { success: false; error: string; details?: any }
>;

// --- Category Actions ---

export async function createCategory(input: z.infer<typeof CreateCategorySchema>): ActionResponse<Category> {
    try {
        const { organisationId } = input;
        // !! IMPORTANT: Authorization Check !!
        await getBusinessAuthContext(organisationId, [MemberRole.ADMIN, MemberRole.STAFF]); // Example: Staff or Admin can create

        const validation = CreateCategorySchema.safeParse(input);
        if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

        const newCategory = await db.category.create({ data: validation.data });
        revalidatePath(`/dashboard/${organisationId}/categories`); // Example path
        return { success: true, data: newCategory };
    } catch (error) {
        console.error("Create Category Error:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { // Unique constraint
            return { success: false, error: 'A category with this name already exists in this organisation.' };
         }
        return { success: false, error: 'Failed to create category.' };
    }
}

export async function updateCategory(input: z.infer<typeof UpdateCategorySchema>): ActionResponse<Category> {
     try {
        const { organisationId, id } = input;
        // !! IMPORTANT: Authorization Check !!
        await getBusinessAuthContext(organisationId, [MemberRole.ADMIN, MemberRole.STAFF]);

        const validation = UpdateCategorySchema.safeParse(input);
        if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

        const { id: categoryId, organisationId: _, ...updateData } = validation.data; // Exclude orgId from data obj

        const updatedCategory = await db.category.update({
            where: { id: categoryId, organisationId: organisationId }, // Ensure update is within the org
            data: updateData,
        });
        revalidatePath(`/dashboard/${organisationId}/categories`);
        revalidatePath(`/dashboard/${organisationId}/categories/${categoryId}`);
        return { success: true, data: updatedCategory };
    } catch (error) {
        console.error("Update Category Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return { success: false, error: 'A category with this name already exists.' };
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { // Record not found
            return { success: false, error: 'Category not found.' };
        }
        return { success: false, error: 'Failed to update category.' };
    }
}

export async function deleteCategory(input: z.infer<typeof DeleteCategorySchema>): ActionResponse<{ id: string }> {
     try {
        const { organisationId, id } = input;
        // !! IMPORTANT: Authorization Check !!
        await getBusinessAuthContext(organisationId, MemberRole.ADMIN); // Example: Only Admin can delete

        const validation = DeleteCategorySchema.safeParse(input);
        if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

        // Optionally check if category is in use by products first
        const productsInCategory = await db.product.count({ where: { categoryId: id, organisationId }});
        if (productsInCategory > 0) {
            // Option 1: Prevent deletion
             return { success: false, error: `Cannot delete category: ${productsInCategory} product(s) are using it. Reassign products first.` };
            // Option 2: Set categoryId to null on products (requires relation `onDelete: SetNull`) - Prisma handles this if configured
        }

        await db.category.delete({ where: { id, organisationId } });

        revalidatePath(`/dashboard/${organisationId}/categories`);
        return { success: true, data: { id } };
    } catch (error) {
        console.error("Delete Category Error:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { // Record not found
            return { success: false, error: 'Category not found.' };
        }
        return { success: false, error: 'Failed to delete category.' };
    }
}

// --- Product Actions ---


export async function createProduct(input: z.infer<typeof CreateProductSchema>): ActionResponse<Product> {
    try {
      const { organisationId } = input;
      // !! IMPORTANT: Authorization Check !!
      await getBusinessAuthContext(organisationId, [MemberRole.ADMIN, MemberRole.STAFF]);

      const validation = CreateProductSchema.safeParse(input);
      if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

      // Check SKU uniqueness if provided
      if (validation.data.sku) {
          const existing = await db.product.findUnique({ where: { organisationId_sku: { organisationId, sku: validation.data.sku } } });
          if (existing) return { success: false, error: `Product with SKU ${validation.data.sku} already exists.` };
      }
      // Check Category exists if provided
      if(validation.data.categoryId) {
          const category = await db.category.findUnique({ where: {id: validation.data.categoryId, organisationId}});
          if (!category) return { success: false, error: `Category not found.`};
      }


      const newProduct = await db.product.create({ data: validation.data });
      revalidatePath(`/dashboard/${organisationId}/products`);
      if(validation.data.categoryId) revalidatePath(`/dashboard/${organisationId}/categories/${validation.data.categoryId}`);
      return { success: true, data: newProduct };
  } catch (error) {
      console.error("Create Product Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { // Unique constraint (likely SKU)
          return { success: false, error: 'A product with this SKU already exists.' };
        }
      return { success: false, error: 'Failed to create product.' };
  }
}

export async function updateProduct(input: z.infer<typeof UpdateProductSchema>): ActionResponse<Product> {
     try {
        const { organisationId, id } = input;
        // !! IMPORTANT: Authorization Check !!
        await getBusinessAuthContext(organisationId, [MemberRole.ADMIN, MemberRole.STAFF]);

        const validation = UpdateProductSchema.safeParse(input);
        if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

        const { id: productId, organisationId: _, ...updateData } = validation.data;

        // Check SKU uniqueness if provided and changed
        if (updateData.sku) {
            const existing = await db.product.findFirst({
                where: { organisationId, sku: updateData.sku, NOT: { id: productId } },
            });
            if (existing) return { success: false, error: `Product with SKU ${updateData.sku} already exists.` };
        }
         // Check Category exists if provided
        if(updateData.categoryId) {
            const category = await db.category.findUnique({ where: {id: updateData.categoryId, organisationId}});
            if (!category) return { success: false, error: `Category not found.`};
        }


        const updatedProduct = await db.product.update({
            where: { id: productId, organisationId },
            data: updateData,
        });
        revalidatePath(`/dashboard/${organisationId}/products`);
        revalidatePath(`/dashboard/${organisationId}/products/${productId}`);
         if(updatedProduct.categoryId) revalidatePath(`/dashboard/${organisationId}/categories/${updatedProduct.categoryId}`);
        return { success: true, data: updatedProduct };
    } catch (error) {
        console.error("Update Product Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             return { success: false, error: 'A product with this SKU already exists.' };
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { // Record not found
            return { success: false, error: 'Product not found.' };
        }
        return { success: false, error: 'Failed to update product.' };
    }
}

// Add deleteProduct similarly (consider soft delete: update isActive = false)

// --- Stock Actions ---


export async function addStockPurchase(
  input: z.infer<typeof AddStockPurchaseSchema>
): ActionResponse<StockTransaction> {
  try {
    const { organisationId } = input;
    const auth = await getBusinessAuthContext(organisationId, [
      MemberRole.ADMIN,
      MemberRole.STAFF,
    ]);

    const validation = AddStockPurchaseSchema.safeParse(input);
    if (!validation.success)
      return {
        success: false,
        error: "Invalid input.",
        details: validation.error.format(),
      };

    const {
      productId,
      quantity,
      unit,
      buyingPricePerUnit,
      supplierId,
      attachmentUrl,
      ...restOfData
    } = validation.data;

    // Fetch product to verify type and unit
    const product = await db.product.findUnique({
      where: { id: productId, organisationId },
    });
    if (!product) return { success: false, error: "Product not found." };
    if (product.type !== ProductType.PHYSICAL)
      return { success: false, error: "Cannot add stock for a service." };
    if (product.unit !== unit)
      return {
        success: false,
        error: `Invalid unit. Product unit: "${product.unit}", received: "${unit}".`,
      };

    // Verify supplier exists if provided
    if (supplierId) {
      const supplier = await db.supplier.findUnique({
        where: { id: supplierId, organisationId },
      });
      if (!supplier) return { success: false, error: "Supplier not found." };
    }

    const transactionResult = await db.$transaction(async (tx) => {
      const stockEntry = await tx.stock.create({
        data: {
          productId: productId,
          organisationId: organisationId,
          quantityAvailable: quantity,
          unit: unit,
          buyingPricePerUnit: buyingPricePerUnit,
          supplierId: supplierId, // Use supplierId
          batchNumber: restOfData.batchNumber,
          purchaseDate: restOfData.purchaseDate ?? new Date(),
          expiryDate: restOfData.expiryDate,
          notes: restOfData.notes,
        },
      });

      const stockTransaction = await tx.stockTransaction.create({
        data: {
          productId: productId,
          stockId: stockEntry.id,
          organisationId: organisationId,
          type: StockTransactionType.PURCHASE,
          quantityChange: quantity,
          reason: `Purchase via Stock Action`, // Improved reason
          createdById: auth.userId,
          transactionDate: restOfData.purchaseDate ?? new Date(),
          attachmentUrl: attachmentUrl, // Save attachment URL
        },
      });
      return stockTransaction;
    });

    revalidatePath(`/dashboard/${organisationId}/products/${productId}/stock`);
    revalidatePath(`/dashboard/${organisationId}/stock`);
    if (supplierId)
      revalidatePath(`/dashboard/${organisationId}/suppliers/${supplierId}`);

    return { success: true, data: transactionResult };
  } catch (error) {
    console.error("Add Stock Purchase Error:", error);
    return { success: false, error: "Failed to add stock purchase." };
  }
}

// Add actions for Stock Adjustment (creating ADJUSTMENT/SPOILAGE transactions)

// --- Customer Actions ---

export async function createCustomer(input: z.infer<typeof CreateCustomerSchema>): ActionResponse<Customer> {
    try {
        const { organisationId } = input;
        // !! IMPORTANT: Authorization Check !!
        await getBusinessAuthContext(organisationId, [MemberRole.ADMIN, MemberRole.STAFF]);

        const validation = CreateCustomerSchema.safeParse(input);
        if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

        // Check Customer ID uniqueness
        const existingId = await db.customer.findUnique({ where: { organisationId_customerId: { organisationId, customerId: validation.data.customerId } } });
        if (existingId) return { success: false, error: `Customer with ID ${validation.data.customerId} already exists.` };

        // Check Email/Phone uniqueness if desired (using findFirst)
         if (validation.data.email) {
            const existingEmail = await db.customer.findFirst({ where: { organisationId, email: validation.data.email }});
            if (existingEmail) return { success: false, error: `Customer with email ${validation.data.email} already exists.` };
        }


        const newCustomer = await db.customer.create({ data: validation.data });
        revalidatePath(`/dashboard/${organisationId}/customers`);
        return { success: true, data: newCustomer };
    } catch (error) {
        console.error("Create Customer Error:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { // Unique constraint
            if (error.message.includes('customerId')) return { success: false, error: 'Customer ID already exists.' };
            if (error.message.includes('email')) return { success: false, error: 'Customer email already exists.' };
             if (error.message.includes('phone')) return { success: false, error: 'Customer phone number already exists.' };
         }
        return { success: false, error: 'Failed to create customer.' };
    }
}

export async function updateCustomer(input: z.infer<typeof UpdateCustomerSchema>): ActionResponse<Customer> {
     try {
        const { organisationId, id } = input;
        // !! IMPORTANT: Authorization Check !!
        await getBusinessAuthContext(organisationId, [MemberRole.ADMIN, MemberRole.STAFF]);

        const validation = UpdateCustomerSchema.safeParse(input);
        if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

        const { id: customerId, organisationId: _, ...updateData } = validation.data;

        // Check uniqueness constraints if fields are being updated
        if (updateData.customerId) {
             const existingId = await db.customer.findFirst({ where: { organisationId, customerId: updateData.customerId, NOT: { id: customerId } } });
             if (existingId) return { success: false, error: `Customer with ID ${updateData.customerId} already exists.` };
        }
         if (updateData.email) {
            const existingEmail = await db.customer.findFirst({ where: { organisationId, email: updateData.email, NOT: { id: customerId } }});
            if (existingEmail) return { success: false, error: `Customer with email ${updateData.email} already exists.` };
        }
        // Add phone check if needed


        const updatedCustomer = await db.customer.update({
            where: { id: customerId, organisationId },
            data: updateData,
        });
        revalidatePath(`/dashboard/${organisationId}/customers`);
         revalidatePath(`/dashboard/${organisationId}/customers/${customerId}`);
        return { success: true, data: updatedCustomer };
    } catch (error) {
        console.error("Update Customer Error:", error);
        // Add unique constraint checks as in create
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { // Record not found
            return { success: false, error: 'Customer not found.' };
        }
        return { success: false, error: 'Failed to update customer.' };
    }
}

// Add deleteCustomer similarly (check for existing orders first?)

// --- Order Actions ---

// Helper: Generate unique order number (example)
async function generateOrderNumber(organisationId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `ORD-${year}${month}-`;

    // Find the last order number for this month/prefix to determine the next sequence number
    const lastOrder = await db.order.findFirst({
        where: {
            organisationId: organisationId,
            orderNumber: { startsWith: prefix }
        },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true }
    });

    let nextSeq = 1;
    if (lastOrder && lastOrder.orderNumber) {
        const lastSeqStr = lastOrder.orderNumber.substring(prefix.length);
        const lastSeq = parseInt(lastSeqStr, 10);
        if (!isNaN(lastSeq)) {
            nextSeq = lastSeq + 1;
        }
    }
    return `${prefix}${nextSeq.toString().padStart(4, '0')}`; // e.g., ORD-202404-0001
}

// Modify createOrder to check selling price
export async function createOrder(input: z.infer<typeof CreateOrderSchema>): ActionResponse<Order & { items: OrderItem[] }> { // Use existing schema
    const { organisationId } = input;
    let authContext;
     try {
        authContext = await getBusinessAuthContext(organisationId, [MemberRole.ADMIN, MemberRole.STAFF]);
    } catch (authError: any) {
         return { success: false, error: authError.message || "Authentication failed." };
    }

    const validation = CreateOrderSchema.safeParse(input); // Use existing schema
    if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

    const { items: itemInputs, customerId, ...restInput } = validation.data; // Use existing schema

    try {
        const newOrder = await db.$transaction(async (tx) => {
            const customer = await tx.customer.findUnique({ where: { id: customerId, organisationId } });
            if (!customer) throw new Error("Customer not found.");

            const productIds = itemInputs.map(item => item.productId);
            const products = await tx.product.findMany({ where: { id: { in: productIds }, organisationId, isActive: true }});
             if (products.length !== productIds.length) throw new Error("One or more products not found, inactive, or invalid.");

            const productMap = new Map(products.map(p => [p.id, p]));
            let totalAmount = new Decimal(0);
            const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];
             const stockTransactionsData: Prisma.StockTransactionCreateManyInput[] = [];

            for (const itemInput of itemInputs) {
                const product = productMap.get(itemInput.productId);
                if (!product) throw new Error(`Product data inconsistency.`);

                // !! ADDED CHECK: Ensure selling price is configured !!
                if (!product.currentSellingPrice || product.currentSellingPrice.isZero()) {
                    throw new Error(`Product "${product.name}" (SKU: ${product.sku || 'N/A'}) must have a selling price configured before it can be added to an order.`);
                }

                const quantity = itemInput.quantity;
                const unitPriceAtSale = product.currentSellingPrice;
                const itemTotalPrice = quantity.mul(unitPriceAtSale);

                if (product.type === ProductType.PHYSICAL) {
                    const totalStock = await tx.stock.aggregate({ _sum: { quantityAvailable: true }, where: { productId: product.id, organisationId }});
                    const currentStockLevel = totalStock._sum.quantityAvailable ?? new Decimal(0);
                    if (currentStockLevel.lessThan(quantity)) throw new Error(`Insufficient stock for ${product.name}.`);

                    stockTransactionsData.push({
                         productId: product.id, organisationId, type: StockTransactionType.SALE,
                         quantityChange: quantity.negated(), reason: `Order Item`,
                         createdById: authContext.userId, transactionDate: new Date(),
                    });
                 }

                totalAmount = totalAmount.add(itemTotalPrice);
                const itemLoyaltyPoints = 0; // TODO: Implement loyalty logic

                orderItemsData.push({
                    productId: product.id, quantity, unitPriceAtSale,
                    totalPrice: itemTotalPrice, loyaltyPointsAwarded: itemLoyaltyPoints,
                });
            }

            const discount = restInput.discountAmount ?? new Decimal(0);
            const finalAmount = totalAmount.sub(discount);
            if (finalAmount.isNegative()) throw new Error("Final amount cannot be negative.");

            const orderNumber = await generateOrderNumber(organisationId); // Assume this helper exists

            const createdOrder = await tx.order.create({
                data: {
                    organisationId, customerId, createdById: authContext.memberId, orderNumber,
                    status: restInput.status ?? OrderStatus.PENDING,
                    totalAmount, discountAmount: discount, finalAmount,
                    loyaltyPointsEarned: 0, // Sum points later
                    notes: restInput.notes,
                    items: { createMany: { data: orderItemsData } },
                    ...( (restInput.deliveryType || restInput.paymentMethod) && { // Use restInput here
                        delivery: {
                             create: { /* ... delivery data from restInput ... */ }
                        }
                    })
                },
                include: { items: true, delivery: true }
            });

            if (stockTransactionsData.length > 0) {
                await tx.stockTransaction.createMany({
                    data: stockTransactionsData.map(st => ({ ...st, relatedOrderId: createdOrder.id }))
                });
                 // !! Reminder: Add logic here to decrease Stock.quantityAvailable if tracking per-batch levels directly !!
            }

            // TODO: Update customer loyalty points if needed

            return createdOrder;
        }); // End Transaction

        revalidatePath(`/dashboard/${organisationId}/orders`);
        // ... other revalidations ...

        return { success: true, data: newOrder };

    } catch (error: any) {
        console.error("Create Order Error:", error);
        return { success: false, error: error.message || 'Failed to create order.' };
    }
}



export async function updateOrderStatus(input: z.infer<typeof UpdateOrderStatusSchema>): ActionResponse<Order> {
  try {
    const { organisationId, orderId, status, ...updateData } = input;
    // !! IMPORTANT: Authorization Check !!
    const auth = await getBusinessAuthContext(organisationId, [MemberRole.ADMIN, MemberRole.STAFF]);

    const validation = UpdateOrderStatusSchema.safeParse(input);
    if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

    // --- Transaction might be needed if status change triggers other actions ---
    // e.g., If status -> CANCELLED or REFUNDED, create return stock transactions.
    // e.g., If status -> PAID, potentially update delivery payment info.

    const order = await db.order.findUnique({ where: { id: orderId, organisationId }});
    if (!order) return { success: false, error: "Order not found." };

    // Add State Machine Logic: Validate status transitions (e.g., can't go from COMPLETED to PENDING)
    // if (!isValidStatusTransition(order.status, status)) {
    //    return { success: false, error: `Cannot change status from ${order.status} to ${status}`};
    // }


    // Update Order Status
    const updatedOrder = await db.order.update({
        where: { id: orderId, organisationId },
        data: {
            status: status,
            // Potentially update delivery fields based on status change and input
              delivery: (updateData.trackingNumber || updateData.paymentReference) ? {
                  update: {
                      trackingNumber: updateData.trackingNumber, // Update tracking if provided
                      paymentReference: updateData.paymentReference, // Update payment ref if provided
                      // maybe update delivery status too?
                  }
              } : undefined,
        },
          include: { delivery: true, items: true }
    });

    // --- Handle Side Effects of Status Change (Example: Return Stock on Cancel) ---
    if (status === OrderStatus.CANCELLED /* && order.status !== OrderStatus.CANCELLED */ ) {
        // TODO: Create StockTransaction records (Type: RETURN) for physical items in the order
        // This needs careful implementation within a transaction probably starting before order update.
    }


    revalidatePath(`/dashboard/${organisationId}/orders`);
    revalidatePath(`/dashboard/${organisationId}/orders/${orderId}`);

    return { success: true, data: updatedOrder };
  } catch (error: any) {
      console.error("Update Order Status Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { // Record not found
          return { success: false, error: 'Order not found.' };
      }
      return { success: false, error: error.message || 'Failed to update order status.' };
  }
}


// --- Read Actions (Examples) ---

export async function getCategory(
  organisationId: string,
  categoryId: string
): ActionResponse<Category | null> {
  try {
    await getBusinessAuthContext(organisationId);
    const category = await db.category.findUnique({
      where: { id: categoryId, organisationId },
    });
    if (!category) {
      return { success: false, error: "Category not found." };
    }
    return { success: true, data: category };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch category.",
    };
  }
}

export async function getProduct(
  organisationId: string,
  productId: string
): ActionResponse<Product | null> {
  try {
    await getBusinessAuthContext(organisationId);
    const product = await db.product.findUnique({
      where: { id: productId, organisationId },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!product) {
      return { success: false, error: "Product not found." };
    }
    return { success: true, data: product };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch product.",
    };
  }
}

export async function getCustomer(
  organisationId: string,
  customerId: string
): ActionResponse<Customer | null> {
  try {
    await getBusinessAuthContext(organisationId);
    const customer = await db.customer.findUnique({
      where: { id: customerId, organisationId },
    });
    if (!customer) {
      return { success: false, error: "Customer not found." };
    }
    return { success: true, data: customer };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch customer.",
    };
  }
}

export async function getOrder(
  organisationId: string,
  orderId: string
): ActionResponse<
  | (Order & {
      items: (OrderItem & { product: Product })[];
      customer: Customer;
      delivery: Delivery | null;
      createdBy: Member & { user: User };
    })
  | null
> {
  // More detailed include
  try {
    await getBusinessAuthContext(organisationId);
    const order = await db.order.findUnique({
      where: { id: orderId, organisationId },
      include: {
        customer: true,
        delivery: true,
        createdBy: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unit: true },
            }, // Include product details per item
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!order) {
      return { success: false, error: "Order not found." };
    }
    // Type assertion needed because Prisma's inferred type might not be perfect with nested includes
    return { success: true, data: order as any };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch order details.",
    };
  }
}

export async function getStockBatch(
  organisationId: string,
  stockId: string
): ActionResponse<Stock | null> {
  try {
    await getBusinessAuthContext(organisationId);
    const stock = await db.stock.findUnique({
      where: { id: stockId, organisationId },
      include: {
        product: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    });
    if (!stock) {
      return { success: false, error: "Stock batch not found." };
    }
    return { success: true, data: stock };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch stock batch.",
    };
  }
}

export async function getStockHistoryForProduct(
  organisationId: string,
  productId: string
): ActionResponse<(Stock & { supplier: Supplier | null })[]> {
  try {
    await getBusinessAuthContext(organisationId);
    const stockHistory = await db.stock.findMany({
      where: { productId: productId, organisationId },
      include: { supplier: true },
      orderBy: { purchaseDate: "desc" },
    });
    return { success: true, data: stockHistory };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch stock history for product.",
    };
  }
}

export async function getStockTransactions(
  input: z.infer<typeof GetStockTransactionsSchema>
): ActionResponse<{ transactions: StockTransaction[]; total: number }> {
  try {
    const { organisationId, skip, take, productId, type, dateFrom, dateTo } =
      input;
    await getBusinessAuthContext(organisationId);

    const validation = GetStockTransactionsSchema.safeParse(input);
    if (!validation.success)
      return {
        success: false,
        error: "Invalid input.",
        details: validation.error.format(),
      };

    const where: Prisma.StockTransactionWhereInput = {
      organisationId,
      ...(productId && { productId }),
      ...(type && { type }),
      ...(dateFrom && { transactionDate: { gte: dateFrom } }),
      ...(dateTo && { transactionDate: { lte: dateTo } }),
      ...(dateFrom &&
        dateTo && { transactionDate: { gte: dateFrom, lte: dateTo } }),
    };

    const [transactions, total] = await db.$transaction([
      db.stockTransaction.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          stock: { select: { batchNumber: true } }, // Link to batch if available
          createdBy: { select: { name: true } }, // User who performed action
          relatedOrder: { select: { orderNumber: true } }, // Link to order if applicable
        },
        orderBy: { transactionDate: "desc" },
        skip: skip,
        take: take,
      }),
      db.stockTransaction.count({ where }),
    ]);

    return { success: true, data: { transactions, total } };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch stock transactions.",
    };
  }
}


export async function getOrders(organisationId: string, customerId?: string): ActionResponse<Order[]> {
     try {
        await getBusinessAuthContext(organisationId);
        const orders = await db.order.findMany({
            where: {
                organisationId,
                customerId: customerId // Optional filter by customer
            },
            include: {
                 customer: { select: { name: true } },
                 createdBy: { include: { user: { select: { name: true } } } } // Member who created
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, data: orders };
    } catch (error: any) {
        console.error("Get Orders Error:", error);
        return { success: false, error: error.message || "Failed to fetch orders." };
    }
}

// Add more read actions as needed (getStock, getCustomers, getOrderDetails etc.)