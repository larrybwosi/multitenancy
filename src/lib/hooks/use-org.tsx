import {getServerAuthContext} from '@/actions/auth';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

export function useOrganizationName() {
  return useQuery({
    queryKey: ['organizationName'],
    queryFn: async () => {
      const {organizationName} = await getServerAuthContext();
      return organizationName;
    },
    staleTime: 1000 * 60 * 60 * 12, // 12 hours in milliseconds
    // cacheTime: 1000 * 60 * 60 * 24, // 24 hours cache time
    retry: false, // Don't retry if the request fails
  });
}

// Fetch organization hook
export function useOrganization() {
  return useQuery({
    queryKey: ['organization'],
    queryFn: fetchOrganization,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Update organization hook
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrganization,
    onSuccess: data => {
      // Invalidate and refetch organization data after successful update
      queryClient.invalidateQueries({queryKey: ['organization']});
      // Alternatively, you can set the data directly:
      // queryClient.setQueryData(['organization'], data);
    },
    onError: error => {
      console.error('Mutation error:', error);
      // You can add additional error handling here if needed
    },
  });
}

async function fetchOrganization() {
  try {
    const response = await fetch('/api/organization', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch organization');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
}

async function updateOrganization(data: any) {
  try {
    const response = await fetch('/api/organizations/curret', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update organization');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
}