// lib/api/departments.ts
import { ApiResponse, PaginatedResponse, UpdateDepartmentDto } from '@/actions/departments/types';
import { Department, DepartmentMemberRole } from '@/prisma/client';
import axios, { AxiosError } from 'axios';
import { DepartmentMemberInput } from '../validations/department';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = '/api/departments';
// Query keys
const QUERY_KEYS = {
  departments: (page: number, limit: number) => ['departments', page, limit],
  department: (id: string) => ['department', id],
};

// Create department
const createDepartment = async (data: {
  name: string;
  description?: string;
  departmentHeadAssignments?: Array<{ memberId: string }>;
}): Promise<ApiResponse<{ department: Department }>> => {
  const response = await axios.post(API_BASE_URL, data);
  return response.data;
};

export type ExtendedDepartment = Department & {
  head: {
    name:string;
    image?: string
  };
  totalMembers: number;
};
// Get departments (paginated)
const getDepartments = async (
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<PaginatedResponse<ExtendedDepartment>>> => {
  const response = await axios.get(API_BASE_URL, {
    params: { page, limit },
  });
  return response.data;
};

// Get department with members
const getDepartmentWithMembers = async (departmentId: string): Promise<ApiResponse<Department>> => {
  const response = await axios.get(`${API_BASE_URL}/${departmentId}`);
  return response.data;
};

// Update department
const updateDepartment = async (departmentId: string, data: UpdateDepartmentDto): Promise<ApiResponse<Department>> => {
  const response = await axios.patch(`${API_BASE_URL}/${departmentId}`, data);
  return response.data;
};

// Delete department
const deleteDepartment = async (departmentId: string): Promise<ApiResponse<null>> => {
  const response = await axios.delete(`${API_BASE_URL}/${departmentId}`);
  return response.data;
};

const addDepartmentMember = async (
  departmentId: string,
  data: {
    memberId: string;
    role: DepartmentMemberRole;
    canApproveExpenses?: boolean;
    canManageBudget?: boolean;
  }
): Promise<{ success: boolean; data: unknown }> => {
  const response = await axios.post(`/api/departments/${departmentId}/members`, data);
  return response.data;
};

const updateDepartmentMemberRole = async (
  departmentId: string,
  memberId: string,
  updates: Partial<DepartmentMemberInput>
): Promise<{ success: boolean; data: unknown }> => {
  const response = await axios.patch(`/api/departments/${departmentId}/members`, {
    memberId,
    ...updates,
  });
  return response.data;
};

const removeDepartmentMember = async (
  departmentId: string,
  memberId: string
): Promise<{ success: boolean; data: unknown }> => {
  const response = await axios.delete(`/api/departments/${departmentId}/members?memberId=${memberId}`);
  return response.data;
};

// Create department
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<{ department: Department }>,
    AxiosError,
    {
      name: string;
      description?: string;
      departmentHeadAssignments?: Array<{ memberId: string }>;
    }
  >({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<Department>, AxiosError, { departmentId: string; data: UpdateDepartmentDto }>({
    mutationFn: ({ departmentId, data }) => updateDepartment(departmentId, data),
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.department(departmentId) });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

// Get departments (paginated)
export const useDepartments = (page: number = 1, limit: number = 10) => {
  return useQuery<ApiResponse<PaginatedResponse<ExtendedDepartment>>, AxiosError>({
    queryKey: QUERY_KEYS.departments(page, limit),
    queryFn: () => getDepartments(page, limit),
  });
};

// Get department with members
export const useDepartmentWithMembers = (departmentId: string) => {
  return useQuery<ApiResponse<Department>, AxiosError>({
    queryKey: QUERY_KEYS.department(departmentId),
    queryFn: () => getDepartmentWithMembers(departmentId),
    enabled: !!departmentId,
  });
};

// Delete department
export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, AxiosError, string>({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useAddDepartmentMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      departmentId,
      data,
    }: {
      departmentId: string;
      data: {
        memberId: string;
        role: DepartmentMemberRole;
        canApproveExpenses?: boolean;
        canManageBudget?: boolean;
      };
    }) => {
      return await addDepartmentMember(departmentId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['department', variables.departmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['departments'],
      });
    },
  });
};

export const useUpdateDepartmentMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      departmentId,
      memberId,
      updates,
    }: {
      departmentId: string;
      memberId: string;
      updates: Partial<DepartmentMemberInput>;
    }) => {
      return await updateDepartmentMemberRole(departmentId, memberId, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['department', variables.departmentId],
      });
    },
  });
};

export const useRemoveDepartmentMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ departmentId, memberId }: { departmentId: string; memberId: string }) => {
      return await removeDepartmentMember(departmentId, memberId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['department', variables.departmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['departments'],
      });
    },
  });
};

// Define the DepartmentDetails interface (same as in getDepartmentWithDetails)
export interface DepartmentDetails {
  id: string;
  name: string;
  image?: string | null;
  banner?: string | null;
  description?: string | null;
  organizationId: string;
  createdAt: string; // Dates are serialized as strings
  updatedAt: string;
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
    joinedAt: string;
    userId: string;
    userName?: string | null;
    userEmail: string;
    userUsername?: string | null;
  }[];
  activeBudget?: {
    id: string;
    name: string;
    amount: number;
    periodStart: string;
    periodEnd: string;
    amountUsed: number;
    amountRemaining: number;
  } | null;
  budgets: {
    id: string;
    name: string;
    amount: number;
    periodStart: string;
    periodEnd: string;
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
 * Hook to fetch department details using Tanstack Query and Axios
 * @param departmentId - The ID of the department to fetch
 * @returns Tanstack Query result with department details
 */
export function useGetFullDepartment(departmentId: string) {
  return useQuery<DepartmentDetails, AxiosError>({
    queryKey: ['department', departmentId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/departments/${departmentId}`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw error;
        }
        throw new Error('Failed to fetch department details');
      }
    },
    enabled: !!departmentId, // Only run query if departmentId is provided
    retry: (failureCount, error) => {
      // Retry up to 3 times unless it's a 404 or 401
      if (error.response?.status === 404 || error.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
}