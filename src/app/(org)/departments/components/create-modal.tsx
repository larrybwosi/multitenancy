import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateDepartment } from '@/lib/hooks/use-departments';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import MembersSelect from '@/components/members-select';

// Define the form schema
const departmentFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Department name must be at least 2 characters' })
    .max(50, { message: 'Department name cannot exceed 50 characters' }),
  description: z.string().nullable().optional(),
  head: z.string().min(2, { message: 'Department head must be provided' }),
  banner: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface CreateDepartmentProps {
  isOpen: boolean;
  onOpenChange: ()=> boolean;
}

const CreateDepartment = ({isOpen, onOpenChange}: CreateDepartmentProps) => {
  const createMutation = useCreateDepartment();

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      banner: '',
      image: '',
    },
  });

  
  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      console.log(data);
      return data.url; // Assuming the API returns { url: string }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Error', {
        description: 'Failed to upload file',
      });
      throw error;
    }
  };

  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      toast.success('Department created', {
        description: `${values.name} has been successfully created.`,
      });
      form.reset();
      onOpenChange();
    } catch (error) {
      console.error(error);
      toast.error('Error', {
        description: 'Failed to create department',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
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
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>Optional description of the department&#39;s purpose</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="head"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Head</FormLabel>
                    <FormControl>
                      <MembersSelect value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>The person who leads this department</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Image</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 flex items-center justify-center rounded-md border border-dashed cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          <Input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={async e => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                const url = await handleFileUpload(file);
                                field.onChange(url);
                              }
                            }}
                          />
                        </div>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="Or enter image URL"
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Optional department logo or icon (square format)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="banner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Banner</FormLabel>
                  <FormControl>
                    <div className="flex flex-col space-y-3">
                      <div className="relative h-32 flex items-center justify-center rounded-md border border-dashed cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                        {field.value ? (
                          <div
                            className="absolute inset-0 bg-cover bg-center rounded-md"
                            style={{ backgroundImage: `url(${field.value})` }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Upload className="h-8 w-8 mb-2" />
                            <span>Upload banner image</span>
                          </div>
                        )}
                        <Input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={async e => {
                            if (e.target.files?.[0]) {
                              const file = e.target.files[0];
                              const url = await handleFileUpload(file);
                              field.onChange(url);
                            }
                          }}
                        />
                      </div>
                      <Input {...field} value={field.value || ''} placeholder="Or enter banner URL" />
                    </div>
                  </FormControl>
                  <FormDescription>Optional banner image (recommended size: 1200×300px)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange()}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Create Department
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDepartment;
