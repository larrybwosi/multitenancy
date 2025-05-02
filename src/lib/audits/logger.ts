// --- Audit Log Helper Function ---

import { AuditEntityType, AuditLogAction, Prisma, PrismaClient } from "@prisma/client";

/**
 * Parameters for creating an audit log entry.
 */
export interface AuditLogParams {
  organizationId?: string; // Optional, but highly recommended [cite: 172]
  memberId: string; // ID of the member performing the action [cite: 173]
  action: AuditLogAction; // The type of action performed
  entityType: AuditEntityType; // The type of entity affected
  entityId?: string; // Optional: ID of the specific entity affected [cite: 175]
  description: string; // Human-readable description of the event
  details?: Record<string, any> | Prisma.JsonValue; // Optional: JSON object with extra data (e.g., changes) [cite: 176]
  ipAddress?: string; // Optional: Request IP Address [cite: 177]
  userAgent?: string; // Optional: Request User Agent [cite: 177]
}

/**
 * Creates an audit log entry in the database.
 *
 * @param prisma - An instance of the PrismaClient or Prisma Transaction Client.
 * @param params - The details for the audit log entry.
 * @returns A Promise resolving to the created AuditLog entry or null if logging fails silently.
 * @throws Error if Prisma operation fails (unless caught silently).
 */
export async function createAuditLog(
  prisma: PrismaClient | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>, // Allows passing PrismaClient or a transaction client (tx)
  params: AuditLogParams
): Promise<Prisma.AuditLogGetPayload<{}> | null> {
  const { organizationId, memberId, action, entityType, entityId, description, details, ipAddress, userAgent } = params;

  if (!memberId) {
    console.error('Audit Log Error: memberId is required.');
    return null; // Or throw error depending on desired strictness
  }
  if (!description) {
    console.error('Audit Log Error: description is required.');
    return null; // Or throw error
  }

  try {
    const logEntry = await prisma.auditLog.create({
      data: {
        organizationId: organizationId, // Link to organization if available [cite: 172]
        memberId: memberId, // Link to the member [cite: 173, 174]
        action, // Action type [cite: 171]
        entityType, // Entity type [cite: 171]
        entityId: entityId, // Specific entity ID [cite: 175]
        description: description, // Description of the event
        details: details || Prisma.JsonNull, // Store additional details as JSON [cite: 176]
        ipAddress: ipAddress, // Optional IP [cite: 177]
        userAgent: userAgent, // Optional User Agent [cite: 177]
        performedAt: new Date(), // Timestamp the action
      },
    });
    // console.log(`Audit log created: ${logEntry.id} - ${logEntry.description}`); // Optional: for debugging
    return logEntry;
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
    console.error('Audit Log Parameters:', params);
    // Decide if you want to throw the error or fail silently
    // throw error; // Option 1: Propagate the error
    return null; // Option 2: Log error and continue
  }
}

// --- Example Usage of createAuditLog ---
/*
async function exampleAudit(prisma: PrismaClient, tx: any) { // tx could be Prisma transaction client
  const memberPerformingAction = "mem_janedoe05";
  const orgContext = "org_nktsupermarket";
  const productBeingUpdated = "prod_oil001";

  // Example 1: Simple log during a transaction
  await createAuditLog(tx, { // Use 'tx' if inside a transaction
     memberId: memberPerformingAction,
     organizationId: orgContext,
     action: AuditLogActionEnum.UPDATE,
     entityType: AuditEntityTypeEnum.PRODUCT,
     entityId: productBeingUpdated,
     description: `Updated price for product ${productBeingUpdated}.`,
     details: { oldPrice: 190, newPrice: 195 } // Example details
  });

  // Example 2: Log outside a transaction
  await createAuditLog(prisma, { // Use 'prisma' if not in transaction
     memberId: memberPerformingAction,
     organizationId: orgContext,
     action: AuditLogActionEnum.LOGIN,
     entityType: AuditEntityTypeEnum.USER, // Or MEMBER
     entityId: memberPerformingAction, // Log against the member/user themselves
     description: `Member ${memberPerformingAction} logged in.`,
     ipAddress: "192.168.1.100", // Example IP
     userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ..." // Example User Agent
  });

   // Example 3: Log for created entity without specific ID known yet (use description)
    await createAuditLog(prisma, {
      memberId: memberPerformingAction,
      organizationId: orgContext,
      action: AuditLogActionEnum.CREATE,
      entityType: AuditEntityTypeEnum.CUSTOMER,
      // entityId might not be available yet if logging happens before commit/creation ID is known
      description: `Attempted to create a new customer: John Doe`,
      details: { name: "John Doe", email: "john.doe@example.com" }
    });
}
*/
