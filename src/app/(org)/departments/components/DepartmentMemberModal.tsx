// components/modals/DepartmentMemberModal.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Or manage open state from parent
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useEffect, useState } from 'react';
// Assuming you have these types/enums from your Prisma schema or a shared types file
import { DepartmentMemberRole, Member } from '@/prisma/client'; // Adjust import as needed

// Zod schema for validation (based on DepartmentMember model)
const departmentMemberFormSchema = z.object({
  memberId: z.string().cuid({ message: 'Please select a member.' }),
  role: z.nativeEnum(DepartmentMemberRole),
  canApproveExpenses: z.boolean().default(false),
  canManageBudget: z.boolean().default(false),
  // departmentId is usually passed as a prop or context
});

type DepartmentMemberFormData = z.infer<typeof departmentMemberFormSchema>;

interface DepartmentMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  organizationMembers: Member[]; // To populate member selection
  editingMember?: DepartmentMemberFormData & { id?: string }; // Include 'id' if editing
  onSave: (data: DepartmentMemberFormData, id?: string) => Promise<void>;
}

export const DepartmentMemberModal = ({
  isOpen,
  onClose,
  departmentId,
  organizationMembers,
  editingMember,
  onSave,
}: DepartmentMemberModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!editingMember;

  const form = useForm({
    resolver: zodResolver(departmentMemberFormSchema),
    defaultValues: editingMember || {
      memberId: '',
      role: DepartmentMemberRole.MEMBER,
      canApproveExpenses: false,
      canManageBudget: false,
    },
  });

  useEffect(() => {
    // Reset form if editingMember changes (e.g., opening modal for different member)
    form.reset(
      editingMember || {
        memberId: '',
        role: DepartmentMemberRole.MEMBER,
        canApproveExpenses: false,
        canManageBudget: false,
      }
    );
  }, [editingMember, form]);

  const onSubmit = async (data: DepartmentMemberFormData) => {
    setIsLoading(true);
    try {
      // Construct payload, potentially including departmentId
      // const payload = { ...data, departmentId };
      await onSave(data, editingMember?.id);
      onClose(); // Close on success
    } catch (error) {
      console.error('Failed to save department member:', error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Department Member' : 'Add Department Member'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details for this department member.'
              : 'Select a member and assign their role and permissions within the department.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 pb-4">
            {!isEditing && ( // Member selection only for new members
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizationMembers?.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.user?.name || member.user?.email || member.id}{' '}
                            {/* Adjust based on your User model */}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role in Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(DepartmentMemberRole).map(role => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="canApproveExpenses"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Can Approve Expenses</FormLabel>
                    <FormDescription>Allows this member to approve expenses within this department.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="canManageBudget"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Can Manage Budget</FormLabel>
                    <FormDescription>Allows this member to manage budgets for this department.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                {isEditing ? 'Save Changes' : 'Add Member'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
