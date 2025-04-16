import { NotificationType, Prisma } from "@prisma/client";
import prisma from "@/lib/db";

// --- Create ---

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Prisma.JsonValue; // Prisma.JsonValue allows any valid JSON
}

/**
 * Creates a new notification for a specific user.
 * @param data - The notification details.
 * @returns The created notification object.
 * @throws Error if the user doesn't exist (due to relation constraint).
 */
export async function createNotification(data: CreateNotificationInput) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        link: data.link,
        metadata: data.metadata || undefined,
        // 'read' defaults to false, 'readAt' to null, 'createdAt'/'updatedAt' are automatic
      },
    });
    console.log(
      `Notification created for user ${data.userId}: ${notification.id}`
    );
    return notification;
  } catch (error) {
    console.error(
      `Error creating notification for user ${data.userId}:`,
      error
    );
    // Consider more specific error handling/throwing based on Prisma error codes
    throw new Error(`Failed to create notification. Error: ${error.message}`);
  }
}

// --- Read / Fetch ---

interface GetNotificationsOptions {
  read?: boolean; // Filter by read status (true, false, or undefined for all)
  type?: NotificationType; // Filter by specific type
  sortBy?: "createdAt" | "updatedAt"; // Field to sort by
  sortOrder?: "asc" | "desc"; // Sort direction
  take?: number; // Limit number of results (pagination)
  skip?: number; // Offset results (pagination)
}

/**
 * Fetches notifications for a specific user with optional filtering and pagination.
 * @param userId - The ID of the user whose notifications to fetch.
 * @param options - Filtering, sorting, and pagination options.
 * @returns A list of notifications.
 */
export async function getNotificationsForUser(
  userId: string,
  options: GetNotificationsOptions = {}
) {
  const {
    read,
    type,
    sortBy = "createdAt",
    sortOrder = "desc",
    take = 20,
    skip = 0,
  } = options;

  const whereClause: Prisma.NotificationWhereInput = {
    userId: userId,
  };

  if (read !== undefined) {
    whereClause.read = read;
  }
  if (type) {
    whereClause.type = type;
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: take,
      skip: skip,
      // You might want to include the user relationship sometimes:
      // include: { user: true }
    });
    return notifications;
  } catch (error) {
    console.error(`Error fetching notifications for user ${userId}:`, error);
    throw new Error(`Failed to fetch notifications. Error: ${error.message}`);
  }
}

/**
 * Gets the count of unread notifications for a user.
 * @param userId - The ID of the user.
 * @returns The number of unread notifications.
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: userId,
        read: false,
      },
    });
    return count;
  } catch (error) {
    console.error(
      `Error getting unread notification count for user ${userId}:`,
      error
    );
    throw new Error(`Failed to get unread count. Error: ${error.message}`);
  }
}

// --- Update (Mark as Read) ---

/**
 * Marks a specific notification as read for a given user.
 * Sets the 'read' flag to true and records the 'readAt' timestamp.
 * @param notificationId - The ID of the notification to mark as read.
 * @param userId - The ID of the user who owns the notification (for verification).
 * @returns The updated notification object or null if not found/not owned by user.
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    // Using updateMany for safety: ensures we only update if userId matches
    const updateResult = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId, // Ensure the user owns this notification
        read: false, // Optional: Only update if it's currently unread
      },
      data: {
        read: true,
        readAt: new Date(), // Record the time it was read
      },
    });

    if (updateResult.count > 0) {
      console.log(
        `Notification ${notificationId} marked as read for user ${userId}.`
      );
      // Optionally fetch and return the updated record
      return await prisma.notification.findUnique({
        where: { id: notificationId },
      });
    } else {
      console.log(
        `Notification ${notificationId} not found, already read, or not owned by user ${userId}.`
      );
      // Check if it exists at all but was already read or belongs to someone else
      const existing = await prisma.notification.findUnique({
        where: { id: notificationId },
      });
      if (existing && existing.userId !== userId) {
        console.warn(
          `Attempt by user ${userId} to mark notification ${notificationId} owned by ${existing.userId} as read.`
        );
        // Potentially throw an authorization error here
        return null;
      }
      return existing; // Return existing if it was just already read
    }
  } catch (error) {
    console.error(
      `Error marking notification ${notificationId} as read for user ${userId}:`,
      error
    );
    throw new Error(
      `Failed to mark notification as read. Error: ${error.message}`
    );
  }
}

/**
 * Marks all unread notifications as read for a specific user.
 * @param userId - The ID of the user whose notifications to update.
 * @returns An object containing the count of updated notifications.
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const updateResult = await prisma.notification.updateMany({
      where: {
        userId: userId,
        read: false, // Target only unread notifications
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
    console.log(
      `Marked ${updateResult.count} notifications as read for user ${userId}.`
    );
    return updateResult; // Contains { count: number }
  } catch (error) {
    console.error(
      `Error marking all notifications as read for user ${userId}:`,
      error
    );
    throw new Error(
      `Failed to mark all notifications as read. Error: ${error.message}`
    );
  }
}

// --- Delete ---

/**
 * Deletes a specific notification for a given user.
 * @param notificationId - The ID of the notification to delete.
 * @param userId - The ID of the user who owns the notification (for verification).
 * @returns The deleted notification object or null if not found/not owned by user.
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
) {
  try {
    // Use deleteMany to ensure ownership before deleting
    const deleteResult = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: userId, // Crucial: User can only delete their own notifications
      },
    });

    if (deleteResult.count > 0) {
      console.log(`Notification ${notificationId} deleted for user ${userId}.`);
      // Since it's deleted, we can't return the object directly,
      // but we confirm success via count. Return true perhaps?
      return { success: true, count: deleteResult.count };
    } else {
      console.log(
        `Notification ${notificationId} not found or not owned by user ${userId}.`
      );
      // Could check if it exists but belongs to another user (for logging/security)
      return { success: false, count: 0 };
    }
  } catch (error) {
    console.error(
      `Error deleting notification ${notificationId} for user ${userId}:`,
      error
    );
    throw new Error(`Failed to delete notification. Error: ${error.message}`);
  }
}

/**
 * Deletes all *read* notifications older than a specified date for a user.
 * Useful for cleaning up old, already-viewed notifications.
 * @param userId - The ID of the user.
 * @param olderThan - A Date object. Notifications created *before* this date will be considered.
 * @returns An object containing the count of deleted notifications.
 */
export async function deleteReadNotificationsOlderThan(
  userId: string,
  olderThan: Date
) {
  try {
    const deleteResult = await prisma.notification.deleteMany({
      where: {
        userId: userId,
        read: true, // Only target read notifications
        createdAt: {
          lt: olderThan, // 'lt' means less than (older than)
        },
      },
    });
    console.log(
      `Deleted ${deleteResult.count} read notifications older than ${olderThan.toISOString()} for user ${userId}.`
    );
    return deleteResult; // Contains { count: number }
  } catch (error) {
    console.error(
      `Error deleting old read notifications for user ${userId}:`,
      error
    );
    throw new Error(
      `Failed to delete old notifications. Error: ${error.message}`
    );
  }
}

// Example Usage (Illustrative)
async function main() {
  // Assume user exists with id 'user-uuid-123'
  const userId = "clvfsq4z5000010xl6x7uic5k"; // Replace with an actual user ID from your DB

  // Create a new notification
  const newNotif = await createNotification({
    userId: userId,
    type: "MENTION",
    title: "You were mentioned!",
    body: 'John Doe mentioned you in the "Project Phoenix" discussion.',
    link: "/projects/phoenix/discussion/42",
    metadata: { mentionedById: "user-uuid-456", projectId: "proj-phoenix" },
  });

  // Create another one
  await createNotification({
    userId: userId,
    type: "INVITATION",
    title: "Org Invitation",
    body: "Acme Corp invited you to join.",
    metadata: { invitedBy: "Jane Smith", organization: "Acme Corp" },
  });

  // Get unread notifications
  const unreadCount = await getUnreadNotificationCount(userId);
  console.log(`User ${userId} has ${unreadCount} unread notifications.`);

  // Get all notifications for the user (first 5)
  const notifications = await getNotificationsForUser(userId, { take: 5 });
  console.log(
    `\nFetched ${notifications.length} notifications for user ${userId}:`,
    notifications
  );

  // Mark the first notification as read (if it exists)
  if (newNotif) {
    const updatedNotif = await markNotificationAsRead(newNotif.id, userId);
    console.log("\nMarked as read:", updatedNotif);
  }

  // Get unread notifications again
  const newUnreadCount = await getUnreadNotificationCount(userId);
  console.log(`User ${userId} now has ${newUnreadCount} unread notifications.`);

  // Mark all remaining as read
  await markAllNotificationsAsRead(userId);
  console.log("\nMarked all as read.");

  const finalUnreadCount = await getUnreadNotificationCount(userId);
  console.log(
    `User ${userId} finally has ${finalUnreadCount} unread notifications.`
  );

  // Delete a specific notification (if the first one existed)
  if (newNotif) {
    await deleteNotification(newNotif.id, userId);
  }

  // Delete old read notifications (e.g., older than 1 minute ago for demo)
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  await deleteReadNotificationsOlderThan(userId, oneMinuteAgo);
}
