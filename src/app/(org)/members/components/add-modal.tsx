
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { UploadCloud, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { useDepartments } from '@/lib/hooks/use-departments';
import { useCreateUserAndMember } from '@/lib/hooks/use-org';

interface UserCreationModal {
  isOpen: boolean;
  onOpenChange: ()=>void
}
// User creation modal component
const UserCreationModal = ({isOpen, onOpenChange}:UserCreationModal) => {
  const [imagePreview, setImagePreview] = useState(null);
  const { mutateAsync: createMember, isPending: creating} = useCreateUserAndMember();
  const { data: departments, isLoading: loadingDepartments } = useDepartments()

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      department: '',
      status: 'Active',
      image: null,
    },
  });
  
  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      form.setValue('image', file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async(data) => {
    console.log(data)
    await createMember(data)
    form.reset();
    setImagePreview(null);
    onOpenChange();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add New Employee</DialogTitle>
          <DialogDescription>
            Enter the details for the new employee. All fields except image are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormDescription>Enter employee&lsquo;s full name</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormDescription>Work email address</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                rules={{
                  required: 'Phone number is required',
                  // pattern: {
                  //   value: /^\d{3}-\d{3}-\d{4}$/,
                  //   message: 'Format: 123-456-7890',
                  // },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="123-456-7890" {...field} />
                    </FormControl>
                    <FormDescription>Format: 123-456-7890</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                rules={{
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>Minimum 8 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                // rules={{ required: 'Department is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.data &&
                          departments?.data?.items?.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Employee&lsquo;s department</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Employee&lsquo;s status</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel>Profile Image (Optional)</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div className="flex items-center justify-center h-32 w-full border-2 border-dashed rounded-md border-gray-300 px-6 py-10">
                        <div className="text-center">
                          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-2 flex text-sm text-gray-600 justify-center">
                            <label
                              htmlFor="file-upload"
                              className="cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={handleImageChange}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {imagePreview && (
                        <div className="flex items-center justify-center">
                          <Image
                            src={imagePreview}
                            fill
                            alt="Profile preview"
                            className="h-32 w-32 object-cover rounded-full border-4 border-purple-200"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>Upload an optional profile image</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange()}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Employee'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserCreationModal