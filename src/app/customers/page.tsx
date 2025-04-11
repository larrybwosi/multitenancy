"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, PlusCircle } from "lucide-react";
import { CustomerTable } from "./components/table";
import { CustomerDetailSheet } from "./components/sheet";
import { AddCustomerDialog } from "./components/add-dialog";
import { toast } from "sonner";
import useSWR from "swr";
import { Customer } from "@prisma/client";
import { deleteCustomer, addCustomer, getCustomers } from "@/actions/customers.actions";

interface CustomersResponse {
  success: boolean;
  data?: {
    customers: Customer[];
    totalCount: number;
  };
  error?: string;
}

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch customers using SWR
  const { data, error, mutate, isLoading } = useSWR<CustomersResponse>(
    `/api/customers?page=${currentPage}`,
    () => getCustomers(currentPage)
  );

  const customers = data?.data?.customers || [];
  const totalCustomers = data?.data?.totalCount || 0;

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsSheetOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    console.log("Edit customer:", customer.id);
    toast("Edit Action", {
      description: `Edit functionality for ${customer.name} not implemented.`,
      style: {
        backgroundColor: "red",
        color: "white",
      }
    });
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this customer? This action cannot be undone."
      )
    ) {
      try {
        const result = await deleteCustomer(customerId);
        
        if (result.success) {
          // Refresh data
          mutate();
          toast("Customer Deleted", {
            description: `Customer profile has been removed.`,
            icon: <Check className="h-4 w-4 bg-cyan-500" />,
            style: {
              backgroundColor: "green",
              color: "white",
            }
          });
          
          // Close sheet if the deleted customer was being viewed
          if (selectedCustomer?.id === customerId) {
            setIsSheetOpen(false);
            setSelectedCustomer(null);
          }
        } else {
          toast("Error", {
            description: result.error || "Failed to delete customer",
            style: {
              backgroundColor: "red",
              color: "white",
            }
          });
        }
      } catch (error) {
        console.error("Error deleting customer:", error);
        toast("Error", {
          description: "Something went wrong while deleting the customer",
          style: {
            backgroundColor: "red",
            color: "white",
          }
        });
      }
    }
  };

  // Handler for submitting the Add Customer form
  const handleAddCustomerSubmit = async (
    data: {
      name: string;
      email: string;
      company?: string;
      status: "active" | "inactive" | "pending";
    }
  ) => {
    try {
      const result = await addCustomer(data);

      if (result.success && result.data) {
        // Update customer list
        mutate();
        
        toast("Customer Added", {
          description: `${result.data.name} has been successfully added.`,
          className: "bg-green-100 border-green-300 text-green-800", // Custom success style
          icon: <Check className="h-4 w-4 bg-cyan-500" />,
        });
      } else {
        toast("Error", {
          description: result.error || "Failed to add customer",
          style: {
            backgroundColor: "red",
            color: "white",
          }
        });
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      toast("Error", {
        description: "Something went wrong while adding the customer",
        style: {
          backgroundColor: "red",
          color: "white",
        }
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">
          Loading customers...
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          Error loading customers
        </div>
      ) : (
        <CustomerTable
          customers={customers}
          onViewCustomer={handleViewCustomer}
          onEditCustomer={handleEditCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          currentPage={currentPage}
          totalCustomers={totalCustomers}
          onPageChange={handlePageChange}
        />
      )}

      {/* Render the Detail Sheet */}
      <CustomerDetailSheet
        customer={selectedCustomer}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />

      {/* Render the Add Customer Dialog */}
      <AddCustomerDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddCustomer={handleAddCustomerSubmit}
      />
    </div>
  );
}
