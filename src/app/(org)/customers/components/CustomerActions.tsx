"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Customer } from "@/prisma/client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { deleteCustomer } from "@/actions/customers.actions";

interface CustomerActionsProps {
  customer: Customer;
  onEdit: (customer: Customer) => void; // Function to trigger edit dialog
  onView: () => void; // Function to trigger view dialog
}

export function CustomerActions({ customer, onEdit, onView }: CustomerActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCustomer(customer.id);
      if (result?.message) {
        toast.error(result.message);
      } else {
        toast.success(result?.message || "Customer deleted!");
      }
      setIsConfirmOpen(false);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Button onClick={() => onView()} variant={"ghost"}>
              <Eye className="mr-2 h-4 w-4" /> View Details
            </Button>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(customer)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsConfirmOpen(true)}
            className="text-destructive focus:text-destructive focus:bg-red-50"
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              customer &quot;{customer.name}&quot;. Consider deactivating the
              customer instead if they have past transaction history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Yes, delete customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
