"use client";

import React, { useState, useMemo, cloneElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, Search, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Customer } from "../types";

interface CustomerSelectionDialogProps {
  customers?: Customer[];
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  triggerButton?: React.ReactElement;
}

export function CustomerSelectionDialog({
  customers = [],
  selectedCustomer,
  onCustomerSelect,
  triggerButton,
}: CustomerSelectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerCaseSearch) ||
        c.phone?.toLowerCase()?.includes(lowerCaseSearch) ||
        c.email?.toLowerCase()?.includes(lowerCaseSearch)
    );
  }, [customers, searchTerm]);

  const handleSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onCustomerSelect(null);
    setSearchTerm("");
    setIsOpen(false);
  };

  const trigger = triggerButton ? (
    cloneElement(triggerButton)
  ) : (
    <Button
      variant="outline"
      onClick={() => setIsOpen(true)}
      className="min-w-40 justify-start"
    >
      <UserPlus className="mr-2 h-4 w-4" />
      {selectedCustomer ? (
        <span className="truncate">{selectedCustomer.name}</span>
      ) : (
        "Select Customer"
      )}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <span>Select Customer</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="border rounded-md overflow-hidden">
            <ScrollArea className="h-[300px]">
              <div className="divide-y">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-3 hover:bg-accent/50 cursor-pointer transition-colors ${
                        selectedCustomer?.id === customer.id ? "bg-accent" : ""
                      }`}
                      onClick={() => handleSelect(customer)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <div className="flex gap-2 mt-1">
                            {customer.phone && (
                              <Badge
                                variant="outline"
                                className="text-xs font-normal"
                              >
                                {customer.phone}
                              </Badge>
                            )}
                            {customer.email && (
                              <Badge
                                variant="outline"
                                className="text-xs font-normal"
                              >
                                {customer.email}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {selectedCustomer?.id === customer.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No customers found</p>
                    {searchTerm && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Try a different search term
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="justify-between">
          {selectedCustomer && (
            <Button
              variant="ghost"
              onClick={handleClear}
              className="text-destructive hover:bg-destructive/5"
            >
              Clear Selection
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
