"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Eye,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"; // Use Trash2 for deactivate visual
import { format } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import type { Supplier } from "@prisma/client";
import { SupplierForm } from "./create"; // Import the form
import { SupplierDetailsSheet } from "./details-sheet"; // Import the details sheet
import { toggleSupplierStatus } from "@/actions/supplier.actions"; // Import toggle action
import { toast } from "sonner";

interface SupplierTableProps {
  suppliers: Supplier[];
}

export function SupplierTable({ suppliers }: SupplierTableProps) {
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] =
    useState<Supplier | null>(null);
  const [selectedSupplierForView, setSelectedSupplierForView] =
    useState<Supplier | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [supplierToToggleStatus, setSupplierToToggleStatus] =
    useState<Supplier | null>(null);

  const handleEditClick = (supplier: Supplier) => {
    setSelectedSupplierForEdit(supplier);
    setIsEditSheetOpen(true);
  };

  const handleViewClick = (supplier: Supplier) => {
    setSelectedSupplierForView(supplier);
    setIsViewSheetOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!supplierToToggleStatus) return;

    const result = await toggleSupplierStatus(
      supplierToToggleStatus.id,
      supplierToToggleStatus.isActive
    );

    if (result.success) {
      toast.success(
        result.message || `Status updated for ${supplierToToggleStatus.name}.`
      );
      // No need to manually update state here, revalidatePath in action handles it
    } else {
      toast.error(
        result.message ||
          `Failed to update status for ${supplierToToggleStatus.name}.`
      );
    }
    setSupplierToToggleStatus(null); // Close dialog
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="hover:bg-muted/50 transition-colors duration-150"
                >
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {supplier.contactName || "-"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {supplier.email || "-"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {supplier.phone || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={supplier.isActive ? "default" : "outline"}
                      className={
                        supplier.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }
                    >
                      {supplier.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {format(new Date(supplier.createdAt), "PP")}{" "}
                    {/* Shorter date format */}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Actions Dropdown */}
                    <AlertDialog>
                      {" "}
                      {/* Wrap dropdown trigger if using AlertDialog */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewClick(supplier)}
                            className="cursor-pointer flex items-center gap-2 hover:bg-accent transition-colors duration-150"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />{" "}
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(supplier)}
                            className="cursor-pointer flex items-center gap-2 hover:bg-accent transition-colors duration-150"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />{" "}
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {/* --- Toggle Status Trigger --- */}
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault(); // Prevent closing dropdown immediately
                                setSupplierToToggleStatus(supplier);
                              }}
                              className={`cursor-pointer flex items-center gap-2 hover:!bg-accent transition-colors duration-150 ${supplier.isActive ? "text-destructive hover:!text-destructive focus:!text-destructive" : "text-green-600 hover:!text-green-700 focus:!text-green-700"}`}
                            >
                              {supplier.isActive ? (
                                <>
                                  <ToggleRight className="h-4 w-4" /> Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-4 w-4" /> Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {/* --- Toggle Status Confirmation Dialog --- */}
                      {supplierToToggleStatus?.id === supplier.id && (
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will{" "}
                              {supplierToToggleStatus.isActive
                                ? "deactivate"
                                : "activate"}{" "}
                              the supplier &quot;{supplierToToggleStatus.name}&quot;.
                              {supplierToToggleStatus.isActive
                                ? " They may no longer be selectable for new purchases."
                                : ""}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => setSupplierToToggleStatus(null)}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleToggleStatus}
                              className={
                                supplierToToggleStatus.isActive
                                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  : "bg-green-600 text-white hover:bg-green-700"
                              }
                            >
                              Confirm{" "}
                              {supplierToToggleStatus.isActive
                                ? "Deactivate"
                                : "Activate"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      )}
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- Edit Supplier Sheet --- */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-lg w-[90vw] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>Edit Supplier</SheetTitle>
            <SheetDescription>
              Update the details for &quot;{selectedSupplierForEdit?.name}&quot;.
            </SheetDescription>
          </SheetHeader>
          {selectedSupplierForEdit && (
            <SupplierForm
              mode="edit"
              supplier={selectedSupplierForEdit}
              onSuccess={() => setIsEditSheetOpen(false)} // Close sheet on success
            />
          )}
        </SheetContent>
      </Sheet>

      {/* --- View Supplier Details Sheet --- */}
      <SupplierDetailsSheet
        supplier={selectedSupplierForView}
        open={isViewSheetOpen}
        onOpenChange={setIsViewSheetOpen}
      />
    </>
  );
}
