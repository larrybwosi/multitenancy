import { db } from "@/lib/db";
import { Member, MemberRole, User, Prisma } from "@prisma/client";

// Define the arguments for the function
interface CreateAssistantArgs {
  /** The ID of the organization the assistant belongs to */
  organizationId: string;
  /** A descriptive name for the assistant (e.g., "Inventory Bot") */
  assistantName?: string;
  /** The specific role the assistant will have within the organization */
  assistantRole?: MemberRole; // Defaults to ASSISTANT if schema is updated
}

/**
 * Creates an Organization Assistant user and links it as a member
 * to the specified organization.
 *
 * Requires the Prisma schema to be updated with:
 * - `MemberRole.ASSISTANT` enum value
 * - `User.isAssistant` boolean field (recommended)
 *
 * @param args - Arguments including Prisma instance, organizationId, etc.
 * @returns The created Member object, including the related User.
 * @throws Error if the organization is not found or creation fails.
 */
export async function createOrganizationAssistant(
  args: CreateAssistantArgs
): Promise<Member & { user: User }> {
  const {
    organizationId,
    assistantName = "Organization Assistant", // Default name
    // Default to the ASSISTANT role if available in the enum, else fallback
    assistantRole = MemberRole.ASSISTANT ?? MemberRole.EMPLOYEE,
  } = args;

  // This avoids needing real email addresses and prevents conflicts.
  const assistantEmail = `assistant-${organizationId}-${crypto.randomUUID()}@system.internal`;

  console.log(
    `Attempting to create assistant '${assistantName}' for organization ${organizationId} with role ${assistantRole}`
  );

  try {
    // Use a transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // 1. Verify the organization exists (optional but recommended)
      const organization = await tx.organization.findUnique({
        where: { id: organizationId },
        select: { id: true }, // Select only necessary fields
      });
      if (!organization) {
        throw new Error(`Organization with ID ${organizationId} not found.`);
      }

      // 2. Create the Assistant User
      const assistantUser = await tx.user.create({
        data: {
          name: assistantName,
          email: assistantEmail,
          // role: UserRole.ASSISTANT,
          isActive: true,
          // isAssistant: true,
          // No password needed usually for assistants
        },
      });
      console.log(`Created assistant user: ${assistantUser.id}`);

      // 3. Create the Member record linking User to Organization
      const assistantMember = await tx.member.create({
        data: {
          userId: assistantUser.id,
          organizationId: organizationId,
          role: assistantRole,
          isActive: true,
        },
        // Include the user details in the returned member object
        include: {
          user: true,
        },
      });
      console.log(`Created assistant member: ${assistantMember.id}`);

      return assistantMember;
    });

    console.log(
      `Successfully created assistant member ${result.id} (User ID: ${result.userId})`
    );
    return result;
  } catch (error) {
    console.error("Failed to create organization assistant:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if needed
      if (error.code === "P2002") {
        // Unique constraint violation (shouldn't happen with generated email)
        console.error(
          "Unique constraint violation. This might indicate an issue with email generation or another unique field."
        );
      }
    }
    // Re-throw the error or handle it as appropriate for your application
    throw new Error(
      `Could not create organization assistant: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// --- Example Usage ---
/*
async function main() {
  const prisma = new PrismaClient();
  const ORG_ID_TO_USE = 'cl...........'; // Replace with an actual organization ID

  try {
    const inventoryAssistant = await createOrganizationAssistant({
      prisma,
      organizationId: ORG_ID_TO_USE,
      assistantName: 'Inventory Bot',
      assistantRole: MemberRole.ASSISTANT, // Explicitly set role
    });
    console.log('Created Inventory Assistant:', inventoryAssistant);

    // Example: Create a reporting assistant with default name/role
    // const reportingAssistant = await createOrganizationAssistant({
    //   prisma,
    //   organizationId: ORG_ID_TO_USE,
    // });
    // console.log('Created Reporting Assistant:', reportingAssistant);

  } catch (error) {
    console.error('Error in main execution:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
*/
