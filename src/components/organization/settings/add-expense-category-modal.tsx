'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateExpenseCategory } from '@/lib/hooks/use-expense-categories';

interface CategoryFormValues {
  name: string;
  description?: string;
  code?: string;
}

interface AddCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddCategoryModal({ open, onOpenChange, onSuccess }: AddCategoryModalProps) {
  const [newCategory, setNewCategory] = useState<CategoryFormValues>({
    name: '',
    description: '',
    code: '',
  });
  const { mutateAsync: createExpenseCategory, isPending: creatingExpenseCategory } = useCreateExpenseCategory();

  const handleAddCategory = async () => {
    try {
      if (!newCategory.name.trim()) {
        toast.error('Category name is required');
        return;
      }

      await createExpenseCategory(newCategory);
      setNewCategory({ name: '', description: '', code: '' });
      onOpenChange(false);
      toast.success('Category created successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create category');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Expense Category</DialogTitle>
          <DialogDescription>
            Create a new category to organize expenses. Categories help with reporting and analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="categoryName" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="categoryName"
              placeholder="e.g., Travel, Office Supplies"
              className="w-full"
              value={newCategory.name}
              onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="categoryCode" className="text-sm font-medium">
              Code
            </label>
            <Input
              id="categoryCode"
              placeholder="e.g., TRVL, OFFC"
              className="w-full"
              value={newCategory.code || ''}
              onChange={e => setNewCategory({ ...newCategory, code: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">Optional short code for accounting and reports</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="categoryDescription" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="categoryDescription"
              placeholder="Brief description of this category"
              className="resize-none"
              value={newCategory.description || ''}
              onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddCategory} disabled={creatingExpenseCategory}>
            {creatingExpenseCategory ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Category'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
