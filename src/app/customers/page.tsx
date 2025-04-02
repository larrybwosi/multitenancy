"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, PlusCircle } from "lucide-react";
import { Customer, mockCustomers } from "./components/mock";
import { CustomerTable } from "./components/table";
import { CustomerDetailSheet } from "./components/sheet";
import { AddCustomerDialog } from "./components/add-dialog";
import { toast } from "sonner";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate fetching data
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setCustomers(mockCustomers);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsSheetOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    console.log("Edit customer:", customer.id);
    toast("Edit Action",{
      description: `Edit functionality for ${customer.name} not implemented.`,
      style: {
        backgroundColor: "red",
        color: "white",
      }
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    console.log("Delete customer:", customerId);
    if (
      window.confirm(
        "Are you sure you want to delete this customer? This action cannot be undone."
      )
    ) {
      // --- Real App: Call API to delete ---
      // Simulate successful deletion
      setCustomers((prevCustomers) =>
        prevCustomers.filter((c) => c.id !== customerId)
      );
      toast("Customer Deleted",{
        description: `Customer profile ${customerId} has been removed.`,
        icon: <Check className="h-4 w-4 bg-cyan-500"/>,
        style:{
          backgroundColor: "green",
          color: "white",
        }
      });
      // Close sheet if the deleted customer was being viewed
      if (selectedCustomer?.id === customerId) {
        setIsSheetOpen(false);
        setSelectedCustomer(null);
      }
    }
  };

  // Handler for submitting the Add Customer form
  const handleAddCustomerSubmit = (
    data: Omit<
      Customer,
      "id" | "registeredDate" | "loyaltyPoints" | "orders" | "avatarUrl"
    > &
      Partial<Pick<Customer, "company">>
  ) => {
    // --- Real App: Send data to API, get back the full customer object with ID ---
    const newCustomer: Customer = {
      ...data,
      id: `cus_temp_${Date.now()}`, // Generate temporary ID
      registeredDate: new Date(),
      loyaltyPoints: 0, // Default loyalty points
      orders: [], // Default empty orders
      avatarUrl: `https://i.pravatar.cc/150?u=${data.email}`, // Generate placeholder avatar
      company: data.company || "N/A", // Ensure company has a value
    };

    // Add to the beginning of the list for immediate visibility
    setCustomers((prevCustomers) => [newCustomer, ...prevCustomers]);

    toast("Customer Added",{
      description: `${newCustomer.name} has been successfully added.`,
      className: "bg-green-100 border-green-300 text-green-800", // Custom success style
      icon: <Check className="h-4 w-4 bg-cyan-500"/>,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
        {/* Button now opens the dialog */}
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">
          Loading customers...
        </div>
      ) : (
        <CustomerTable
          customers={customers}
          onViewCustomer={handleViewCustomer}
          onEditCustomer={handleEditCustomer}
          onDeleteCustomer={handleDeleteCustomer}
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
