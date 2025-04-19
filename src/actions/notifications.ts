'use server'
import { PrismaClient, Notification, NotificationType, Prisma } from '@prisma/client';

// Define the type for create notification input
export type CreateNotificationInput = {
  type: NotificationType;
  title: string;
  description: string;
  link?: string;
  userId?: string;
  recipientEmail?: string;
  senderId?: string;
  details?: Record<string, any>;
};

// Define the type for get notifications query parameters
export type GetNotificationsParams = {
  userId?: string;
  recipientEmail?: string;
  read?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
  orderBy?: 'asc' | 'desc';
};

/**
 * Creates a new notification
 * @param prisma - PrismaClient instance
 * @param data - The notification data to create
 * @returns The created notification
 * @throws Error if neither userId nor recipientEmail is provided
 */
export async function createNotification(
  prisma: PrismaClient,
  data: CreateNotificationInput
): Promise<Notification> {
  if (!data.userId && !data.recipientEmail) {
    throw new Error('Either userId or recipientEmail must be provided');
  }

  return prisma.notification.create({
    data: {
      type: data.type,
      title: data.title,
      description: data.description,
      link: data.link,
      userId: data.userId? data.userId : undefined,
      recipientEmail: data.recipientEmail,
      senderId: data.senderId,
      details: data.details ? data.details : {},
    },
  });
}

/**
 * Gets notifications based on filter parameters
 * @param prisma - PrismaClient instance
 * @param params - Query parameters to filter notifications
 * @returns Array of notifications matching the criteria
 */
export async function getNotifications(
  prisma: PrismaClient,
  params: GetNotificationsParams
): Promise<{
  notifications: Notification[];
  total: number;
  unreadCount?: number;
}> {
  const {
    userId,
    recipientEmail,
    read,
    type,
    page = 1,
    limit = 10,
    orderBy = 'desc',
  } = params;

  const skip = (page - 1) * limit;

  const whereClause: Prisma.NotificationWhereInput = {};

  if (userId) whereClause.userId = userId;
  if (recipientEmail) whereClause.recipientEmail = recipientEmail;
  if (read !== undefined) whereClause.read = read;
  if (type) whereClause.type = type;

  // Get total count for pagination
  const total = await prisma.notification.count({
    where: whereClause,
  });

  // Get unread count if looking up by userId or recipientEmail
  let unreadCount;
  if (userId || recipientEmail) {
    const unreadWhereClause = { ...whereClause, read: false };
    unreadCount = await prisma.notification.count({
      where: unreadWhereClause,
    });
  }

  // Get paginated notifications
  const notifications = await prisma.notification.findMany({
    where: whereClause,
    skip,
    take: limit,
    orderBy: {
      createdAt: orderBy,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      member: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return {
    notifications,
    total,
    unreadCount,
  };
}

/**
 * Gets a single notification by ID
 * @param prisma - PrismaClient instance
 * @param id - The notification ID
 * @returns The notification or null if not found
 */
export async function getNotificationById(
  prisma: PrismaClient,
  id: string
): Promise<Notification | null> {
  return prisma.notification.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      member: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Marks a notification as read
 * @param prisma - PrismaClient instance
 * @param id - The notification ID to mark as read
 * @returns The updated notification
 * @throws Error if notification not found
 */
export async function markNotificationRead(
  prisma: PrismaClient,
  id: string
): Promise<Notification> {
  try {
    return await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  } catch (error) {
    console.log(error)
    throw new Error(`Notification not found: ${id}`);
  }
}

/**
 * Marks all notifications as read for a user or email
 * @param prisma - PrismaClient instance
 * @param params - Object containing either userId or recipientEmail
 * @returns Count of updated notifications
 * @throws Error if neither userId nor recipientEmail is provided
 */
export async function markAllNotificationsRead(
  prisma: PrismaClient,
  params: {
    userId?: string;
    recipientEmail?: string;
  }
): Promise<{ count: number }> {
  const { userId, recipientEmail } = params;

  if (!userId && !recipientEmail) {
    throw new Error('Either userId or recipientEmail must be provided');
  }

  const whereClause: Prisma.NotificationWhereInput = {
    read: false,
  };

  if (userId) whereClause.userId = userId;
  if (recipientEmail) whereClause.recipientEmail = recipientEmail;

  const result = await prisma.notification.updateMany({
    where: whereClause,
    data: { read: true },
  });

  return { count: result.count };
}

/**
 * Deletes a notification by ID
 * @param prisma - PrismaClient instance
 * @param id - The notification ID to delete
 * @returns Boolean indicating if deletion was successful
 */
export async function deleteNotification(
  prisma: PrismaClient,
  id: string
): Promise<boolean> {
  try {
    await prisma.notification.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.log(error)
    return false;
  }
}

/**
 * Deletes all notifications for a user or email that match criteria
 * @param prisma - PrismaClient instance
 * @param params - Object containing filters for deletion
 * @returns Count of deleted notifications
 */
export async function deleteAllNotifications(
  prisma: PrismaClient,
  params: {
    userId?: string;
    recipientEmail?: string;
    read?: boolean;
    olderThan?: Date;
  }
): Promise<{ count: number }> {
  const { userId, recipientEmail, read, olderThan } = params;

  if (!userId && !recipientEmail) {
    throw new Error('Either userId or recipientEmail must be provided');
  }

  const whereClause: Prisma.NotificationWhereInput = {};

  if (userId) whereClause.userId = userId;
  if (recipientEmail) whereClause.recipientEmail = recipientEmail;
  if (read !== undefined) whereClause.read = read;
  if (olderThan) whereClause.createdAt = { lt: olderThan };

  const result = await prisma.notification.deleteMany({
    where: whereClause,
  });

  return { count: result.count };
}

/**
 * Gets notification counts by type
 * @param prisma - PrismaClient instance
 * @param params - Object containing either userId or recipientEmail
 * @returns Object with counts by notification type
 */
export async function getNotificationCounts(
  prisma: PrismaClient,
  params: {
    userId?: string;
    recipientEmail?: string;
  }
): Promise<Record<NotificationType, number>> {
  const { userId, recipientEmail } = params;

  if (!userId && !recipientEmail) {
    throw new Error('Either userId or recipientEmail must be provided');
  }

  const whereClause: Prisma.NotificationWhereInput = {};

  if (userId) whereClause.userId = userId;
  if (recipientEmail) whereClause.recipientEmail = recipientEmail;

  const notifications = await prisma.notification.groupBy({
    by: ['type'],
    where: whereClause,
    _count: {
      type: true,
    },
  });

  // Create a record with all notification types initialized to 0
  const result = Object.values(NotificationType).reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as Record<NotificationType, number>);

  // Update counts based on query results
  notifications.forEach((item) => {
    result[item.type as NotificationType] = item._count.type;
  });

  return result;
}