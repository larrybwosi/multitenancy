import { Member, MemberRole } from '@/prisma/client';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

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
    onSuccess: (data) => {
      // Invalidate and refetch organization data after successful update
      queryClient.invalidateQueries({queryKey: ['organization']});
      // Alternatively, you can set the data directly:
      queryClient.setQueryData(['organization'], data);
    },
    onError: error => {
      console.error('Mutation error:', error);
      toast.error('Failed to update organization');
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

async function updateOrganization(data: unknown) {
  try {
    const response = await fetch('/api/organization', {
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

export interface ExtendedMember extends Member {
  id: string;
  userId: string;
  organizationId: string;
  role: MemberRole;
  departmentId?: string | null;
  name: string;
  image?: string;
  isActive: boolean;
  email:string
  department?: { name: string; id: string };
}

export const useMembers = () => {
  return useQuery({
    queryKey: ['members'],
    queryFn: async (): Promise<ExtendedMember[]> => {
      const response = await fetch('/api/members');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch members');
      }

      const data = await response.json();
      return data.members;
    },
  });
};


export interface CreateInterface {
  name: string;
  email: string;
  phone: string;
  password: string;
  image?: string;
  departmentId?: string;
  role: MemberRole;
}

export const useCreateUserAndMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData: CreateInterface) => {
      const { data } = await axios.post('/api/members', userData);
      return data;
    },
    // Optional: Add onSuccess, onError handlers as needed
    onSuccess: data => {
      // Handle success (e.g., show toast, invalidate queries)
      console.log('User created successfully', data);
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (error: any) => {
      // Handle error (e.g., show error toast)
      console.error('Error creating user:', error.response?.data?.error || error.message);
      toast.error('Error creating user', {
        description: error.response?.data?.error || error.message,
      });
    },
  });
};

// const state$ = useObservableSyncedQuery<Profile>({
//   query: {
//     queryKey: ['profile'],
//     queryFn: async () => {
//       return fetch(`/api/profile`).then(v => v.json());
//     },
//     initialData: { ...profile },
//     refetchOnMount: false,
//   },
//   mutation: {
//     mutationFn: async function <Profile>(variables: Profile) {
//       const sendData: Partial<Profile> = {};
//       for (const k in serverState.current) {
//         const key = k as keyof Profile;
//         if (variables[key] !== serverState.current[key as string]) {
//           sendData[key] = variables[key];
//         }
//       }
//       return fetch(`/api/profile`, {
//         method: 'POST',
//         body: JSON.stringify(sendData),
//       }).then(v => v.json());
//     },
//   },
//   transform: {
//     load: (data: Profile) => {
//       serverState.current = { ...data };
//       return data;
//     },
//   },
//   persist: {
//     plugin: ObservablePersistLocalStorage,
//     retrySync: true,
//     name: 'profile',
//   },
// });