import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendanceLog } from '@/prisma/client'; // Adjust import based on your Prisma schema

interface AutoCheckoutSettings {
  enableAutoCheckout?: boolean;
  autoCheckoutTime?: string | null;
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'API request failed');
  }
  return response.json();
};

// Set Auto-Checkout Settings
export const useSetAutoCheckoutSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ organizationId, settings }: { organizationId: string; settings: AutoCheckoutSettings }) => {
      const response = await fetch(`/api/organization/${organizationId}/auto-checkout`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      return handleResponse(response);
    },
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({ queryKey: ['autoCheckoutSettings', organizationId] });
    },
  });
};

// Check-In Member
export const useCheckInMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      actingMemberId: string;
      memberToCheckInId: string;
      organizationId: string;
      inventoryLocationId: string;
      notes?: string;
    }) => {
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

// Check-Out Member
export const useCheckOutMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      actingMemberId: string;
      memberToCheckoutId: string;
      organizationId: string;
      notes?: string;
      checkoutInventoryLocationId?: string;
    }) => {
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

// Perform Auto-Checkout
export const usePerformAutoCheckout = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/attendance/auto-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return handleResponse(response);
    },
    onSuccess: () => {
      // Optionally invalidate attendance queries
    },
  });
};

// Get Member Attendance
export const useMemberAttendance = (organizationId: string, memberId: string, periodStart: Date, periodEnd: Date) => {
  return useQuery<AttendanceLog[]>({
    queryKey: ['memberAttendance', organizationId, memberId, periodStart, periodEnd],
    queryFn: async () => {
      const params = new URLSearchParams({
        organizationId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      });
      const response = await fetch(`/api/attendance/member/${memberId}?${params}`);
      return handleResponse(response);
    },
    enabled: !!organizationId && !!memberId && !!periodStart && !!periodEnd,
  });
};

// Get All Members Attendance for Organization
export const useAllMembersAttendance = (organizationId: string, periodStart: Date, periodEnd: Date) => {
  return useQuery<AttendanceLog[]>({
    queryKey: ['allMembersAttendance', organizationId, periodStart, periodEnd],
    queryFn: async () => {
      const params = new URLSearchParams({
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      });
      const response = await fetch(`/api/attendance/organization/${organizationId}?${params}`);
      return handleResponse(response);
    },
    enabled: !!organizationId && !!periodStart && !!periodEnd,
  });
};

// Get Location Attendance
export const useLocationAttendance = (
  organizationId: string,
  inventoryLocationId: string,
  periodStart: Date,
  periodEnd: Date
) => {
  return useQuery<AttendanceLog[]>({
    queryKey: ['locationAttendance', organizationId, inventoryLocationId, periodStart, periodEnd],
    queryFn: async () => {
      const params = new URLSearchParams({
        organizationId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      });
      const response = await fetch(`/api/attendance/location/${inventoryLocationId}?${params}`);
      return handleResponse(response);
    },
    enabled: !!organizationId && !!inventoryLocationId && !!periodStart && !!periodEnd,
  });
};
