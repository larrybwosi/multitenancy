'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2, Users, MoreHorizontal, Search, X } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useCreateDepartment, useDeleteDepartment, useDepartments } from '@/lib/hooks/use-departments';
import { toast } from 'sonner';
import { DepartmentsSkeleton } from './loader';

// Hooks and Types

// Form validation schema
const departmentFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Department name must be at least 2 characters' })
    .max(50, { message: 'Department name cannot exceed 50 characters' }),
  description: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

const DepartmentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // TanStack Query hooks
  const { data, isLoading, isError } = useDepartments();
  const createMutation = useCreateDepartment();
  const deleteMutation = useDeleteDepartment();

  // Form setup
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Handle form submission
  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      toast.success('Department created', {
        description: `${values.name} has been successfully created.`,
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.log(error);
      toast.error('Error', {
        description: 'Failed to create department',
      });
    }
  };

  const handleDelete = async (departmentId: string) => {
    try {
      await deleteMutation.mutateAsync(departmentId);
      toast.success('Department deleted', {
        description: 'Department has been successfully removed.',
      });
    } catch (error) {
      console.log(error);
      toast.error('Error', {
        description: 'Failed to delete department',
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-[1500px]">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <X className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold">Failed to load departments</h3>
          <p className="text-muted-foreground mt-1 mb-4">Please try again later</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if(isLoading){
    return <DepartmentsSkeleton/>
  }
  // Handle search
  const filteredDepartments =
    data?.data?.items?.filter(
      dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-[1500px]">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground mt-1">Manage your organization&#39;s departments and teams</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Add Department</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
                <DialogDescription>Add a new department to your organization structure.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Marketing" {...field} />
                        </FormControl>
                        <FormDescription>The display name for this department</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of this department's responsibilities"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>Optional description of the department&#39;s purpose</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Creating...' : 'Create Department'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Separator />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <DepartmentsSkeleton/>
        ) : filteredDepartments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Department</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map(dept => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {dept.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {dept.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-2 text-muted-foreground">{dept.description || 'No description'}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-2 w-fit">
                      <Users className="h-4 w-4" />
                      {dept.totalMembers}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={dept.activeBudgetId ? 'default' : 'outline'}>
                      {dept.activeBudgetId ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          <span>Manage Members</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(dept.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No departments found</h3>
            <p className="text-muted-foreground mt-1 mb-4">No departments match your search criteria</p>
            <Button variant="outline" onClick={clearSearch}>
              Clear search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentsPage;
