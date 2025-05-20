import { Order, OrderStatus, Prisma } from "@/prisma/client";
import { logger } from "../departments/logger";
import prisma from "@/lib/db";
import { generateOrderNumber } from "@/utils/orders";
import { CreateOrderInputSchema, UpdateOrderInputSchema } from "@/lib/validations/orders";

export async function createOrder(data: unknown): Promise<Order> {
  // Validate input
  const validatedData = CreateOrderInputSchema.parse(data);

  logger.info('Attempting to create order', { organizationId: validatedData.organizationId });

  try {
    // 2. Fetch product details for item name snapshots and calculate totals
    let subTotal = new Prisma.Decimal(0);
    const orderItemsData = await Promise.all(
      validatedData.items.map(async item => {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });
        if (!variant) {
          throw new Error(`Product variant with ID ${item.variantId} not found.`);
        }
        const itemTotalPrice = new Prisma.Decimal(item.quantity).mul(item.unitPrice);
        subTotal = subTotal.add(itemTotalPrice);
        return {
          variantId: item.variantId,
          productName: variant.product.name,
          variantName: variant.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: itemTotalPrice,
          notes: item.notes,
        };
      })
    );

    // 3. Calculate total amount
    const totalAmount = subTotal
      .minus(validatedData.discountAmount || 0)
      .add(validatedData.taxAmount || 0)
      .add(validatedData.shippingAmount || 0);

    // 4. Generate order number
    const orderNumber = await generateOrderNumber(validatedData.organizationId);

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        organizationId: validatedData.organizationId,
        customerId: validatedData.customerId,
        memberId: validatedData.memberId,
        orderType: validatedData.orderType,
        fulfillmentType: validatedData.fulfillmentType,
        status: 'PENDING_CONFIRMATION', // Default initial status
        items: {
          create: orderItemsData,
        },
        subTotal,
        discountAmount: validatedData.discountAmount,
        taxAmount: validatedData.taxAmount,
        shippingAmount: validatedData.shippingAmount,
        totalAmount,
        paymentMethod: validatedData.paymentMethod,
        paymentStatus: validatedData.paymentStatus || 'PENDING',
        shippingAddress: validatedData.shippingAddress,
        billingAddress: validatedData.billingAddress,
        deliveryNotes: validatedData.deliveryNotes,
        pickupLocationId: validatedData.pickupLocationId,
        tableNumber: validatedData.tableNumber,
        estimatedPreparationTime: validatedData.estimatedPreparationTime,
        notes: validatedData.notes,
        tags: validatedData.tags,
        placedAt: new Date(),
      },
      include: {
        items: true,
        customer: true,
        member: true,
      },
    });
    logger.info(`Order created successfully: ${newOrder.id}`, { orderNumber: newOrder.orderNumber });
    return newOrder;
  } catch (error) {
    logger.error('Error creating order', { inputData: data, error });
    throw error;
  }
}

// --- Order Read Functions ---
export async function getOrderById(orderId: string, organizationId: string): Promise<Order | null> {
  logger.debug(`Workspaceing order by ID: ${orderId}`, { organizationId });
  return prisma.order.findUnique({
    where: { id: orderId, organizationId }, // Ensure org tenancy
    include: {
      items: { include: { variant: { include: { product: true } } } },
      customer: true,
      member: true,
      organization: true,
      pickupLocation: true,
    },
  });
}

export async function getOrdersByCustomer(customerId: string, organizationId: string): Promise<Order[]> {
  logger.debug(`Workspaceing orders for customer: ${customerId}`, { organizationId });
  return prisma.order.findMany({
    where: { customerId, organizationId },
    orderBy: { placedAt: 'desc' },
    include: { items: true },
  });
}

export async function getOrdersByStatus(status: OrderStatus, organizationId: string): Promise<Order[]> {
  logger.debug(`Workspaceing orders with status: ${status}`, { organizationId });
  return prisma.order.findMany({
    where: { status, organizationId },
    orderBy: { placedAt: 'asc' }, // Oldest pending orders first perhaps
    include: { items: true, customer: true },
  });
}

// --- Order Update Function ---

export async function updateOrder(orderId: string, organizationId: string, data: unknown): Promise<Order | null> {
  logger.info(`Attempting to update order: ${orderId}`, { organizationId });

  // Validate input
  const validatedData = UpdateOrderInputSchema.parse(data);

  try {
    // Add logic to set timestamps based on status changes
    const updateData: Prisma.OrderUpdateInput = { ...validatedData };
    if (validatedData.status) {
      switch (validatedData.status) {
        case 'CONFIRMED':
          updateData.confirmedAt = new Date();
          break;
        case 'PREPARING':
          updateData.preparingAt = new Date();
          break;
        case 'DELIVERED':
          updateData.deliveredAt = new Date();
          break;
        case 'COMPLETED':
          updateData.completedAt = new Date();
          break;
        case 'CANCELLED':
          updateData.cancelledAt = new Date();
          break;
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId, organizationId },
      data: updateData,
      include: { items: true, customer: true },
    });
    logger.info(`Order updated successfully: ${orderId}`);
    return updatedOrder;
  } catch (error) {
    logger.error('Error updating order', { orderId, inputData: data, error });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }
    throw error;
  }
}


// --- Order Delete Function (Soft Delete Recommended) ---
// For compliance and data integrity, orders are usually soft-deleted or archived.
// A true delete might be needed for GDPR "right to be forgotten" but requires careful handling.
export async function softDeleteOrder(orderId: string, organizationId: string): Promise<Order | null> {
  logger.info(`Attempting to soft delete (cancel) order: ${orderId}`, { organizationId });
  // This example sets status to CANCELLED, which acts as a soft delete.
  // You might also add an `isArchived` boolean field.
  try {
    const cancelledOrder = await prisma.order.update({
      where: { id: orderId, organizationId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
    logger.info(`Order ${orderId} marked as CANCELLED.`);
    // Add logic to revert inventory reservations etc.
    return cancelledOrder;
  } catch (error) {
    logger.error('Error soft deleting order', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }
    //@ts-expect-error unknown
    throw new Error(`Failed to soft delete order: ${error.message}`);
  }
}

// --- Helper Functions for Analytics ---
export async function getOrderAnalytics(organizationId: string, period?: { startDate: Date; endDate: Date }) {
  logger.debug('Fetching order analytics', { organizationId, period });
  const dateFilter = period ? { placedAt: { gte: period.startDate, lte: period.endDate } } : {};

  const totalOrders = await prisma.order.count({
    where: { organizationId, ...dateFilter, NOT: { status: OrderStatus.CANCELLED } },
  });

  const totalSalesAmountResult = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: {
      organizationId,
      ...dateFilter,
      status: { in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED] }, // Or other relevant statuses
    },
  });
  const totalSalesAmount = totalSalesAmountResult._sum.totalAmount || 0;

  // Most popular products (based on OrderItem quantity)
  const popularItems = await prisma.orderItem.groupBy({
    by: ['variantId', 'productName', 'variantName'],
    _sum: { quantity: true },
    where: { order: { organizationId, ...dateFilter, NOT: { status: OrderStatus.CANCELLED } } },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10, // Top 10
  });

  // Sales by OrderType
  const salesByOrderType = await prisma.order.groupBy({
    by: ['orderType'],
    _sum: { totalAmount: true },
    _count: { id: true },
    where: {
      organizationId,
      ...dateFilter,
      status: { in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED] },
    },
  });

  logger.info('Order analytics fetched', { organizationId });
  return {
    totalOrders,
    totalSalesAmount: new Prisma.Decimal(totalSalesAmount),
    popularItems: popularItems.map(item => ({
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      totalQuantitySold: item._sum.quantity,
    })),
    salesByOrderType: salesByOrderType.map(typeGroup => ({
      orderType: typeGroup.orderType,
      totalRevenue: new Prisma.Decimal(typeGroup._sum.totalAmount || 0),
      numberOfOrders: typeGroup._count.id,
    })),
  };
}
