'use server'
import { db } from "@/lib/db"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { AuditEntityType, AuditLogAction, Prisma } from "@prisma/client"

interface AuditLogParams {
  action: AuditLogAction;
  resource: AuditEntityType;
  resourceId?: string | number;
  description: string;
  details?: Record<string, unknown>;
}

export async function logAuditEvent({
  action,
  resource,
  resourceId,
  description,
  details,
}: AuditLogParams) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    await db.auditLog.create({
      data: {
        action,
        entityType: resource,
        description,
        entityId: resourceId ? resourceId.toString() : undefined,
        details: details ? JSON.stringify(details) : undefined,
        ipAddress: ip,
        userAgent: userAgent,
        member:{connect:{id: session?.user?.id}}
      },
    })
  } catch (error) {
    console.error("Failed to log audit event:", error)
    // Attempt to log the failure itself
    try {
      const headersList = await headers()
      const ip = headersList.get("x-forwarded-for") || "unknown"
      
      await db.auditLog.create({
        data: {
          action,
          entityType: resource,
          description,
          entityId: resourceId ? resourceId.toString() : undefined,
          details: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
            originalDetails: details,
          }),
          ipAddress: ip,
          // operation_status: "FAILED",
        },
      });
    } catch (innerError) {
      console.error("Critical: Failed to log audit failure:", innerError)
    }
  }
}

interface GetAuditLogsParams {
  userId?: string;
  action: AuditLogAction;
  resource: AuditEntityType;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  status?: "SUCCESS" | "FAILED" | "ALL";
}

export async function getAuditLogs({
  action,
  resourceId,
  startDate,
  endDate,
  limit = 100,
  offset = 0,
}: GetAuditLogsParams) {
  
  const where: Prisma.AuditLogWhereInput = {};

  if (action) where.action = action
  if (resourceId) where.entityId = resourceId
  // if (status && status !== 'ALL') where.operationStatus = status

  if (startDate || endDate) {
    where.performedAt = {}
    if (startDate) where.performedAt = startDate
    if (endDate) where.performedAt = endDate
  }

  const [logs, count] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { performedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        member: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Math.floor(offset / limit) + 1,
  }
}

