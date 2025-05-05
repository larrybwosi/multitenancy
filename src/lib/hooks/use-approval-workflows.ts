import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ApprovalWorkflowInput } from '../validations/approval';

/**
 * Hook to fetch all approval workflows for an organization
 */
export function useApprovalWorkflows() {
  return useQuery({
    queryKey: ['approval-workflows'],
    queryFn: async () => {
      const response = await axios.get('/api/approval-workflows');
      return response.data;
    },
  });
}

/**
 * Hook to fetch a specific approval workflow by ID
 */
export function useApprovalWorkflow(workflowId: string | undefined) {
  return useQuery({
    queryKey: ['approval-workflow', workflowId],
    queryFn: async () => {
      if (!workflowId) throw new Error('Workflow ID is required');
      const response = await axios.get(`/api/approval-workflows/${workflowId}`);
      return response.data;
    },
    enabled: !!workflowId,
  });
}

/**
 * Hook to create a new approval workflow
 */
export function useCreateApprovalWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ organizationId, data }: { organizationId: string; data: ApprovalWorkflowInput }) => {
      const response = await axios.post('/api/approval-workflows', {
        organizationId,
        data,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Workflow created successfully', {
        description: 'Your approval workflow has been created and is now available for use.',
      });
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
    },
    onError: (error: AxiosError<{error?: string}>) => {
      toast.error('Failed to create workflow', {
        description: error?.response?.data?.error || 'An unexpected error occurred. Please try again.',
      });
      console.error('Error creating workflow:', error);
    },
  });
}

/**
 * Hook to update an existing approval workflow
 */
export function useUpdateApprovalWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workflowId, data }: { workflowId: string; data: ApprovalWorkflowInput }) => {
      const response = await axios.put(`/api/approval-workflows/${workflowId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Workflow updated successfully', {
        description: 'Your changes to the approval workflow have been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['approval-workflow', variables.workflowId] });
    },
    onError: (error: AxiosError<{error?: string}>) => {
      toast.error('Failed to update workflow', {
        description: error?.response?.data?.error || 'An unexpected error occurred. Please try again.',
      });
      console.error('Error updating workflow:', error);
    },
  });
}

/**
 * Hook to delete an approval workflow
 */
export function useDeleteApprovalWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await axios.delete(`/api/approval-workflows/${workflowId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Workflow deleted successfully', {
        description: 'The approval workflow has been permanently removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
    },
    onError: (error: AxiosError<{error?: string}>) => {
      toast.error('Failed to delete workflow', {
        description: error?.response?.data?.error || 'An unexpected error occurred. Please try again.',
      });
      console.error('Error deleting workflow:', error);
    },
  });
}

/**
 * Hook to set a workflow as active
 */
export function useSetActiveWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ organizationId, workflowId }: { organizationId: string; workflowId: string }) => {
      const response = await axios.put(`/api/approval-workflows/${workflowId}/set-active`, { organizationId });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Active workflow updated', {
        description: 'This workflow is now the active workflow for approval processes.',
      });
      queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['organization-expense-config'] });
    },
    onError: (error: AxiosError<{error?: string}>) => {
      toast.error('Failed to set active workflow', {
        description: error?.response?.data?.error || 'An unexpected error occurred. Please try again.',
      });
      console.error('Error setting active workflow:', error);
    },
  });
} 