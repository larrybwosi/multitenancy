'use server'
import { db } from "@/lib/db"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { AuditAction, AuditResource } from "./audit-types"

interface AuditLogParams {
  action: AuditAction
  resource: AuditResource
  resourceId?: string | number
  details?: Record<string, unknown>
}

export async function logAuditEvent({
  action,
  resource,
  resourceId,
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
        entity_type: resource,
        entity_id: resourceId ? Number(resourceId) : null,
        details: details ? JSON.stringify(details) : null,
        ip_address: ip,
        user_agent: userAgent,
        operation_status: "SUCCESS",
        user:{connect:{id: session?.user?.id}}
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
          entity_type: resource,
          entity_id: resourceId ? Number(resourceId) : null,
          details: JSON.stringify({ 
            error: error instanceof Error ? error.message : "Unknown error",
            originalDetails: details 
          }),
          ip_address: ip,
          // operation_status: "FAILED",
        },
      })
    } catch (innerError) {
      console.error("Critical: Failed to log audit failure:", innerError)
    }
  }
}

interface GetAuditLogsParams {
  userId?: string
  action?: AuditAction
  resource?: AuditResource
  resourceId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
  status?: 'SUCCESS' | 'FAILED' | 'ALL'
}

export async function getAuditLogs({
  userId,
  action,
  resource,
  resourceId,
  startDate,
  endDate,
  limit = 100,
  offset = 0,
  status = 'ALL',
}: GetAuditLogsParams) {
  type WhereClause = {
    userId?: string;
    action?: AuditAction;
    entity_type?: AuditResource;
    entity_id?: number;
    operation_status?: string;
    createdAt?: {
      gte?: Date;
      lte?: Date;
    };
  }
  
  const where: WhereClause = {}

  if (userId) where.userId = userId
  if (action) where.action = action
  if (resource) where.entity_type = resource
  if (resourceId) where.entity_id = Number(resourceId)
  if (status && status !== 'ALL') where.operation_status = status

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [logs, count] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    db.auditLog.count({ where }),
  ])

  return {
    logs,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: Math.floor(offset / limit) + 1,
  }
}

