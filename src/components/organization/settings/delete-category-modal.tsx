'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useDeleteExpenseCategory } from '@/lib/hooks/use-expense-categories';
import { toast } from 'sonner';

interface DeleteCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string | null;
  onSuccess?: () => void;
}

export function DeleteCategoryModal({ open, onOpenChange, categoryId, onSuccess }: DeleteCategoryModalProps) {
  const { mutateAsync: deleteCategory, isPending: deletingExpenseCategory } = useDeleteExpenseCategory();

  const handleDeleteCategory = async () => {
    if (!categoryId) return;

    try {
      await deleteCategory(categoryId);
      onOpenChange(false);
      toast.success('Category deleted successfully');
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this category? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteCategory} disabled={deletingExpenseCategory}>
            {deletingExpenseCategory ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
