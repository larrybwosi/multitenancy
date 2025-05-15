import { createDepartmentSchema } from '@/lib/validations/department';
import prisma from '@/lib/db';
import { createStandardDocumentApprovalWorkflow } from './workflows-templates';
import { Department, DepartmentMemberRole, Prisma } from '@/prisma/client';
import { ApiResponse, PaginatedResponse, UpdateDepartmentDto } from './types';
import { logger } from './logger';
import { getServerAuthContext } from '../auth';
import { NotFoundError } from '@/utils/errors';

/**
 * Creates a new department, assigns heads, and generates a default workflow.
 * @param organizationId The ID of the organization this department belongs to.
 * @param name Name of the department.
 * @param description Optional description.
 * @param departmentHeadAssignments Array of member IDs to be assigned as department heads.
 * @param defaultBudgetAllocation Optional initial budget amount.
 */

/**
 * Creates a new department and generates a default GENERIC workflow using Gemini API.
 */
export async function createDepartmentWithGenericDefaults({name, organizationId, banner,description, image, departmentHeadAssignments}:
  {organizationId: string,
  name: string,
  description?: string,
  image?: string,
  banner?:string,
  departmentHeadAssignments?: Array<{ memberId: string }>},
) {
  console.log(`[DepartmentService] Attempting to create department (generic workflow): ${name} in org: ${organizationId}`);
  try {
    // TODO: Permission Check: Ensure requestingMemberId is Org Owner or Org Admin for dto.organizationId.
    const { organizationId,role, memberId } = await getServerAuthContext()
    
    if (!(role === 'OWNER' || role === 'ADMIN')) {
       logger.warn(`Permission denied for ${memberId} to create department in org ${organizationId}`);
       return { success: false, statusCode: 403, error: 'Permission denied.' };
    }

    // Basic validation
    // createDepartmentSchema.parse({ name, organizationId, description });

    const department = await prisma.department.create({
      data: { name, description, organizationId, headId: memberId, image, banner },
    });
    console.log(`[DepartmentService] Department created with ID: ${department.id}`);

    if (departmentHeadAssignments && departmentHeadAssignments.length > 0) {
      for (const head of departmentHeadAssignments) {
        await prisma.departmentMember.create({
          data: {
            departmentId: department.id,
            memberId: head.memberId,
            role: 'HEAD',
            canApproveExpenses: true,
            canManageBudget: true,
          },
        });
      }
    }

    const defaultWorkflow = await createStandardDocumentApprovalWorkflow(
      organizationId,
      `${department.name} - Default Document Approval`,
      DepartmentMemberRole.MANAGER, // Or another default role
      department.id
    );

    console.log(`[DepartmentService] Default GENERIC workflow created with ID: ${defaultWorkflow?.id}`);

    await prisma.departmentMember.create({
      data: {
        departmentId: department.id,
        memberId: memberId,
        role: 'HEAD',
        canApproveExpenses: true,
        canManageBudget: true,
      },
    });
    await prisma.department.update({
      where: { id: department.id },
      data: { defaultWorkflowId: defaultWorkflow?.id },
      include:{head:true,}
    });

    // console.log(`[DepartmentService] Department ${department.id} updated with default generic workflow ${defaultWorkflow.id}`);
    return { department, defaultWorkflow };
  } catch (error) {
    logger.error(`[DepartmentService] Error creating department with generic workflow ${name}:`, error);
    // Handle ZodError specifically if input validation is done here
    throw new Error(`Could not create department: ${(error as Error).message}`);
  }
}

/**
 * Get a list of departments for an organization with pagination.
 * Permissions: Org Admin, Org Manager, or Department Head/Manager/Member/Viewer (scoped to their departments).
 */
export async function getDepartments(
  organizationId: string,
  requestingMemberId: string, // Used for permission checks
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<PaginatedResponse<Department>>> {
  logger.info(`Workspaceing departments for organization ${organizationId}`, { page, limit, requestingMemberId });
  try {
    // TODO: Implement permission check:
    // 1. Get requestingMember's organization role and department memberships/roles.
    // 2. If Org Admin/Manager, allow access to all departments in orgId.
    // 3. If Department role, filter by departments they are a member of.

    const skip = (page - 1) * limit;
    const [departments, total] = await prisma.$transaction([
      prisma.department.findMany({
        where: { organizationId }, // Add further permission-based filtering here
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { departmentMembers: true, } }, head:{ select:{ user: {select:{ name:true, image:true, }}}} }, // Example of including member count
      }),
      prisma.department.count({ where: { organizationId } }), // Adjust count based on permission filtering
    ]);
    const departmentsWithCount = departments.map((dep)=>{
      return {
        ...dep,
        totalMembers: dep._count.departmentMembers,
        head:{
          name: dep.head?.user.name,
          image: dep.head?.user.image
        }
      };
    })

    logger.info(`Successfully fetched ${departments.length} departments. Total: ${total}`);
    return {
      success: true,
      statusCode: 200,
      data: { items: departmentsWithCount, total, page, limit },
    };
  } catch (error) {
    logger.error('Error fetching departments', error);
    return { success: false, statusCode: 500, error: 'Failed to fetch departments.' };
  }
}

/**
 * Get a single department by ID, including its members.
 * Permissions: Org Admin, Org Manager, or Department Head/Manager/Member/Viewer of that specific department.
 */
export async function getDepartmentWithMembers(
  departmentId: string,
  requestingMemberId: string // For permission checks
): Promise<ApiResponse<Department>> {
  logger.info(`Workspaceing department ${departmentId} with members`, { requestingMemberId });
  try {
    // TODO: Permission Check: Ensure requestingMemberId has rights to view this department.
    // This involves checking if the member belongs to this department or has overarching org permissions.

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        departmentMembers: {
          // [cite: 28]
          include: {
            member: {
              // [cite: 33]
              include: {
                user: { select: { id: true, name: true, email: true } }, // [cite: 2, 9]
              },
            },
          },
        },
      },
    });

    if (!department) {
      logger.warn(`Department ${departmentId} not found.`);
      return { success: false, statusCode: 404, message: 'Department not found.' };
    }

    // Further permission check: Is the requesting member part of this department or an Org Admin/Manager?
    // Example: const isMemberOfDepartment = department.departmentMembers.some(dm => dm.memberId === requestingMemberId);
    // if (!isOrgAdminOrManager && !isMemberOfDepartment) {
    //    logger.warn(`Access denied for member ${requestingMemberId} to department ${departmentId}`);
    //    return { success: false, statusCode: 403, error: 'Access denied.' };
    // }

    logger.info(`Successfully fetched department ${departmentId}`);
    return { success: true, statusCode: 200, data: department };
  } catch (error) {
    logger.error(`Error fetching department ${departmentId}`, error);
    return { success: false, statusCode: 500, error: 'Failed to fetch department.' };
  }
}


/**
 * Interface defining the structure of the department response with detailed relations
 */
interface DepartmentDetails {
  id: string;
  name: string;
  image?: string | null;
  banner?: string | null;
  description?: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  head?: {
    id: string;
    role: string;
    userId: string;
    userName?: string | null;
    userEmail: string;
    userUsername?: string | null;
  } | null;
  members: {
    id: string;
    memberId: string;
    role: string;
    canApproveExpenses: boolean;
    canManageBudget: boolean;
    joinedAt: Date;
    userId: string;
    userName?: string | null;
    userEmail: string;
    userUsername?: string | null;
  }[];
  activeBudget?: {
    id: string;
    name: string;
    amount: number;
    periodStart: Date;
    periodEnd: Date;
    amountUsed: number;
    amountRemaining: number;
  } | null;
  budgets: {
    id: string;
    name: string;
    amount: number;
    periodStart: Date;
    periodEnd: Date;
  }[];
  workflows: {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    isDefault: boolean;
  }[];
  customFields?: any | null;
}

/**
 * Retrieves detailed information about a department by its ID, including related head, members, budgets, and workflows
 * @param departmentId - The unique ID of the department
 * @param organizationId - The ID of the organization to ensure data isolation
 * @returns A promise resolving to the department details
 * @throws NotFoundError if the department is not found
 * @throws InternalServerError for unexpected database errors
 */
export async function getDepartmentWithDetails(
  departmentId: string,
  organizationId: string,
  memberId: string
): Promise<DepartmentDetails> {
  logger.info(`Workspaceing department ${departmentId} with members`, { memberId });
  try {
    // Fetch the department with related data using Prisma
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        organizationId, // Ensure department belongs to the specified organization
      },
      include: {
        head: {
          // Include head details
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
        departmentMembers: {
          // Include department members with their user details
          select: {
            id: true,
            memberId: true,
            role: true,
            canApproveExpenses: true,
            canManageBudget: true,
            createdAt: true,
            member: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
        activeBudget: {
          // Include active budget details
          select: {
            id: true,
            name: true,
            amount: true,
            periodStart: true,
            periodEnd: true,
            amountUsed: true,
            amountRemaining: true,
          },
        },
        budgets: {
          // Include all related budgets
          select: {
            id: true,
            name: true,
            amount: true,
            periodStart: true,
            periodEnd: true,
          },
        },
        workflows: {
          // Include related workflows
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
          },
        },
        defaultWorkflow: {
          // Include default workflow to check if it exists
          select: {
            id: true,
          },
        },
      },
    });

    // Check if department exists
    if (!department) {
      throw new NotFoundError(`Department with ID ${departmentId} not found in organization ${organizationId}`, departmentId);
    }

    // Transform the Prisma response into the desired DepartmentDetails structure
    const departmentDetails: DepartmentDetails = {
      id: department.id,
      name: department.name,
      image: department.image,
      banner: department.banner,
      description: department.description,
      organizationId: department.organizationId,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
      head: department.head
        ? {
            id: department.head.id,
            role: department.head.role,
            userId: department.head.user.id,
            userName: department.head.user.name,
            userEmail: department.head.user.email,
            userUsername: department.head.user.username,
          }
        : null,
      members: department.departmentMembers.map((dm) => ({
        id: dm.id,
        memberId: dm.memberId,
        role: dm.role,
        canApproveExpenses: dm.canApproveExpenses,
        canManageBudget: dm.canManageBudget,
        joinedAt: dm.createdAt,
        userId: dm.member.user.id,
        userName: dm.member.user.name,
        userEmail: dm.member.user.email,
        userUsername: dm.member.user.username,
      })),
      activeBudget: department.activeBudget
        ? {
            id: department.activeBudget.id,
            name: department.activeBudget.name,
            amount: department.activeBudget.amount.toNumber(),
            periodStart: department.activeBudget.periodStart,
            periodEnd: department.activeBudget.periodEnd,
            amountUsed: department.activeBudget.amountUsed.toNumber(),
            amountRemaining: department.activeBudget.amountRemaining.toNumber(),
          }
        : null,
      budgets: department.budgets.map((budget) => ({
        id: budget.id,
        name: budget.name,
        amount: budget.amount.toNumber(),
        periodStart: budget.periodStart,
        periodEnd: budget.periodEnd,
      })),
      workflows: department.workflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        isActive: workflow.isActive,
        isDefault: department.defaultWorkflow?.id === workflow.id,
      })),
      customFields: department.customFields,
    };

    return departmentDetails;
  } catch (error) {
    // Handle specific Prisma errors or custom errors
    if (error instanceof NotFoundError) {
      throw error;
    }
    // Log the error for debugging (in a real app, use a logging service)
    console.error('Error fetching department details:', error);
    throw new InternalServerError('Failed to retrieve department details');
  } finally {
    // Ensure Prisma client disconnects to free resources
    await prisma.$disconnect();
  }
}

/**
 * Custom error classes (assumed to be defined elsewhere)
 */

class InternalServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InternalServerError';
  }
}

/**
 * Update an existing department.
 * Permissions: Org Owner, Org Admin, or Department Head of that specific department.
 */
export async function updateDepartment(
  departmentId: string,
  dto: UpdateDepartmentDto,
  requestingMemberId: string
): Promise<ApiResponse<Department>> {
  logger.info(`Attempting to update department ${departmentId}`, { dto, requestingMemberId });
  try {
    // TODO: Permission Check: Ensure requestingMemberId is Org Owner/Admin or HEAD of this department.
    // const departmentToUpdate = await prisma.department.findUnique({ where: { id: departmentId }, include: { departmentMembers: true } });
    // if (!departmentToUpdate) return { success: false, statusCode: 404, message: 'Department not found.'};
    // const isHead = departmentToUpdate.departmentMembers.some(dm => dm.memberId === requestingMemberId && dm.role === 'HEAD');
    // if (!isOrgAdmin && !isHead) return { success: false, statusCode: 403, error: 'Permission denied.'};

    if (dto.name) {
      const departmentToUpdate = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!departmentToUpdate) return { success: false, statusCode: 404, message: 'Department not found.' };

      const existingDepartment = await prisma.department.findUnique({
        where: { organizationId_name: { organizationId: departmentToUpdate.organizationId, name: dto.name } },
      });
      if (existingDepartment && existingDepartment.id !== departmentId) {
        logger.warn(`Another department with name "${dto.name}" already exists.`);
        return { success: false, statusCode: 409, message: 'Another department with this name already exists.' };
      }
    }

    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: {
        name: dto.name,
        description: dto.description,
        customFields: dto.customFields,
        updatedAt: new Date(), // [cite: 28] Prisma handles this automatically with @updatedAt
      },
    });
    logger.info(`Department ${departmentId} updated successfully.`);
    return { success: true, statusCode: 200, data: updatedDepartment };
  } catch (error: any) {
    if (error.code === 'P2025') {
      // Prisma error code for record not found
      logger.warn(`Department ${departmentId} not found for update.`);
      return { success: false, statusCode: 404, message: 'Department not found.' };
    }
    logger.error(`Error updating department ${departmentId}`, error);
    return { success: false, statusCode: 500, error: 'Failed to update department.' };
  }
}

/**
 * Delete a department.
 * Permissions: Org Owner, Org Admin.
 */
export async function deleteDepartment(departmentId: string, requestingMemberId: string): Promise<ApiResponse<null>> {
  logger.info(`Attempting to delete department ${departmentId}`, { requestingMemberId });
  try {
    // TODO: Permission Check: Ensure requestingMemberId is Org Owner or Org Admin.
    // Also, consider business logic: what happens to members of a deleted department?
    // The schema uses onDelete: Cascade for departmentMembers[cite: 33], meaning they will be deleted.
    // You might want to reassign members or prevent deletion if the department is not empty.

    // Example check: prevent deletion if department has members
    // const memberCount = await prisma.departmentMember.count({ where: { departmentId } });
    // if (memberCount > 0) {
    //   logger.warn(`Attempt to delete department ${departmentId} which still has ${memberCount} members.`);
    //   return { success: false, statusCode: 400, message: 'Department cannot be deleted as it still has members. Please reassign or remove members first.' };
    // }

    await prisma.department.delete({
      where: { id: departmentId },
    });
    logger.info(`Department ${departmentId} deleted successfully.`);
    return { success: true, statusCode: 204, data: null };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      logger.warn(`Department ${departmentId} not found for deletion.`);
      return { success: false, statusCode: 404, message: 'Department not found.' };
    }
    logger.error(`Error deleting department ${departmentId}`, error);
    return { success: false, statusCode: 500, error: 'Failed to delete department.' };
  }
}