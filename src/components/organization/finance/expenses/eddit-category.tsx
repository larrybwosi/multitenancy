'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, X } from 'lucide-react';
import { MotionDiv } from '@/components/motion';
import { ExpenseCategory } from '@/prisma/client';
import { useUpdateExpenseCategory } from '@/lib/hooks/use-expense-categories';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  code: z.string().optional(),
  description: z.string().optional(),
});

interface EditCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ExpenseCategory;
  onSuccess: () => void;
}

export const EditCategoryModal = ({ open, onOpenChange, category, onSuccess }: EditCategoryModalProps) => {
  const { mutateAsync: updateCategory, isPending: updatingExpenseCategory } = useUpdateExpenseCategory();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || '',
      code: category?.code || '',
      description: category?.description || '',
    },
  });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!category?.id) return
    console.log(values);
    await updateCategory({
      id:category?.id,
      ...values
    })
    onSuccess();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <MotionDiv initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <DialogHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                {category ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-full p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Office Supplies" className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. OFF-SUP" className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe this category..."
                        className="rounded-lg min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 pb-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm transition-all"
                  disabled={updatingExpenseCategory}
                >
                  {updatingExpenseCategory ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </MotionDiv>
      </DialogContent>
    </Dialog>
  );
};
