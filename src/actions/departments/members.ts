import prisma from "@/lib/db";
import { DepartmentMemberInput, departmentMemberSchema } from "@/lib/validations/department";
import { DepartmentMemberRole } from "@/prisma/client";
import { logger } from "./logger";

/**
 * Adds a member to a department with a specific role.
 */
export async function addMemberToDepartment(
  departmentId: string,
  memberId: string,
  role: DepartmentMemberRole,
  canApproveExpenses?: boolean,
  canManageBudget?: boolean
) {
  // console.log(`[DepartmentService] Adding member ${memberId} to department ${departmentId} with role ${role}`);
  try {
    // Zod validation would go here or in the route handler
    departmentMemberSchema.parse({ departmentId, memberId, role, canApproveExpenses, canManageBudget });

    // Check if department and member exist
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) throw new Error('Department not found.');
    const member = await prisma.member.findUnique({ where: { id: memberId } }); // Assuming Member model uses 'id'
    if (!member) throw new Error('Member not found.');

    const departmentMember = await prisma.departmentMember.create({
      data: {
        departmentId,
        memberId,
        role,
        canApproveExpenses: canApproveExpenses ?? (role === 'HEAD' || role === 'MANAGER'), // Default based on role
        canManageBudget: canManageBudget ?? role === 'HEAD', // Default based on role
      },
    });
    // console.log(`[DepartmentService] Member ${memberId} added to department ${departmentId} successfully.`);
    return departmentMember;
  } catch (error) {
    console.error(`[DepartmentService] Error adding member ${memberId} to department ${departmentId}:`, error);
    throw error;
  }
}

/**
 * Removes a member from a department.
 */
export async function removeMemberFromDepartment(departmentId: string, memberId: string) {
  logger.debug(`[DepartmentService] Removing member ${memberId} from department ${departmentId}`);
  try {
    // Add validation and checks (e.g., ensure the remover has permission)
    await prisma.departmentMember.delete({
      where: {
        departmentId_memberId: {
          departmentId,
          memberId,
        },
      },
    });
    // console.log(`[DepartmentService] Member ${memberId} removed from department ${departmentId} successfully.`);
    return { success: true, message: 'Member removed from department.' };
  } catch (error) {
    logger.error(`[DepartmentService] Error removing member ${memberId} from department ${departmentId}:`, error);
    throw error;
  }
}

/**
 * Updates a member's role or permissions within a department.
 */
export async function updateDepartmentMember(
  departmentId: string,
  memberId: string,
  updates: Partial<DepartmentMemberInput>
) {
  // console.log(`[DepartmentService] Updating member ${memberId} in department ${departmentId}`);
  try {
    // Validate updates
    // Ensure role is valid if provided, etc.

    const updatedMember = await prisma.departmentMember.update({
      where: {
        departmentId_memberId: {
          departmentId,
          memberId,
        },
      },
      data: updates,
    });
    // console.log(`[DepartmentService] Member ${memberId} in department ${departmentId} updated successfully.`);
    return updatedMember;
  } catch (error) {
    console.error(`[DepartmentService] Error updating member ${memberId} in department ${departmentId}:`, error);
    throw error;
  }
}
