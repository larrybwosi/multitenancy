'use server'
import { db } from "@/lib/db";
import { z } from "zod";
import { AuditLogInput, AuditLogSchema } from "./audit-types";

// Get all audit logs with user information
export async function getAuditLogs() {
  return await db.auditLog.findMany({
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// Get audit logs by user ID with user information
export async function getAuditLogsByUser(userId: string) {
  return await db.auditLog.findMany({
    where: { user_id: userId },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// Get audit logs by entity type with user information
export async function getAuditLogsByEntityType(entityType: string) {
  return await db.auditLog.findMany({
    where: { entity_type: entityType },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// Get audit logs by entity type and ID with user information
export async function getAuditLogsByEntityId(
  entityType: string,
  entityId: number
) {
  return await db.auditLog.findMany({
    where: { entity_type: entityType, entity_id: entityId },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// Create a new audit log
export async function createAuditLog(log: AuditLogInput) {
  const validatedData = AuditLogSchema.parse(log);
  return await db.auditLog.create({
    data: validatedData,
  });
}
