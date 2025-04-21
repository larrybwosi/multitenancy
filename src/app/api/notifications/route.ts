import { NextRequest, NextResponse } from "next/server";
import { Notification } from "@prisma/client";
import {
  CreateNotificationInput,
  GetNotificationsParams,
  createNotification,
  deleteAllNotifications,
  getNotifications,
} from "@/actions/notifications";


export async function POST(request: NextRequest) {
  try {
    const data: CreateNotificationInput = await request.json();

    const notification = await createNotification(data);

    return NextResponse.json(transformNotification(notification), {
      status: 201,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

function transformNotification(notification: Notification): NotificationType {
  return {
    id: notification.id, // No need to parse as it's already a String (cuid)
    type: notification.type,
    title: notification.title,
    description: notification.description,
    time: notification.createdAt.toISOString(),
    read: notification.read,
    link: notification.link || undefined,
    // Handle details from the JSON field
    ...(notification.details && typeof notification.details === 'object' ? {
      invitedBy: notification.details.invitedBy || undefined,
      invitedByAvatar: notification.details.invitedByAvatar || undefined,
      organization: notification.details.organization || undefined,
      role: notification.details.role || undefined,
      mentionedBy: notification.details.mentionedBy || undefined,
      mentionedByAvatar: notification.details.mentionedByAvatar || undefined,
      meetingTime: notification.details.meetingTime || undefined,
      assignedBy: notification.details.assignedBy || undefined,
      assignedByAvatar: notification.details.assignedByAvatar || undefined,
    } : {}),
    // Include sender information if available
    ...(notification.member ? {
      sender: {
        id: notification.member.id,
        name: notification.member.user.name || undefined,
        avatar: notification.member.user.image || undefined
      }
    } : {})
  };
}
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const params: GetNotificationsParams = {
      userId: searchParams.get("userId") || undefined,
      recipientEmail: searchParams.get("recipientEmail") || undefined,
      read: searchParams.get("read")
        ? searchParams.get("read") === "true"
        : undefined,
      type: (searchParams.get("type") as NotificationType) || undefined,
      page: searchParams.get("page")
        ? parseInt(searchParams.get("page")!)
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      orderBy: (searchParams.get("orderBy") as "asc" | "desc") || undefined,
    };

    const { notifications, total, unreadCount } = await getNotifications(
            params
    );

    return NextResponse.json({
      notifications: notifications.map(transformNotification),
      total,
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, recipientEmail, read, olderThan } = await request.json();

    const { count } = await deleteAllNotifications({
      userId,
      recipientEmail,
      read,
      olderThan: olderThan ? new Date(olderThan) : undefined,
    });

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

type NotificationType = {
  id: string;
  type: NotificationType; // from the enum in the schema
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
  invitedBy?: string;
  invitedByAvatar?: string;
  organization?: string;
  role?: string;
  mentionedBy?: string;
  mentionedByAvatar?: string;
  meetingTime?: string;
  assignedBy?: string;
  assignedByAvatar?: string;
  sender?: {
    id: string;
    name?: string;
    avatar?: string;
  };
};