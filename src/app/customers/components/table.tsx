// src/components/CustomerTable.tsx
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar
import { Customer } from "./mock";
import { Pagination } from "@/components/ui/pagination";
import { PaginationComponent } from "@/components/pagination";

// Ensure Avatar is added via Shadcn CLI: npx shadcn-ui@latest add avatar

interface CustomerTableProps {
  customers: Customer[];
  onViewCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
}

// Function to get initials for Avatar fallback
const getInitials = (name: string): string => {
  const names = name.split(" ");
  if (names.length === 0) return "?";
  if (names.length === 1) return names[0][0]?.toUpperCase() ?? "?";
  return (
    (names[0][0]?.toUpperCase() ?? "") +
    (names[names.length - 1][0]?.toUpperCase() ?? "")
  );
};

export function CustomerTable({
  customers,
  onViewCustomer,
  onEditCustomer,
  onDeleteCustomer,
}: CustomerTableProps) {
  // More distinct badge styling (can be done via Tailwind or custom variants) toLocal
  const getStatusBadgeClass = (status: Customer["status"]): string => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"; // More vibrant green
      case "inactive":
        return "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"; // Subtle gray
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"; // Clear yellow
      default:
        return "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200";
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-white">
      {" "}
      {/* Slightly rounded */}
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[60px] pl-4"></TableHead>{" "}
            {/* Space for Avatar */}
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="text-right pr-4">Actions</TableHead>{" "}
            {/* Added padding */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                No customers found.
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer, index) => (
              <TableRow
                key={customer.id}
                className={`hover:bg-slate-50/60 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`} // Subtle striping
              >
                <TableCell className="pl-4 py-2">
                  {" "}
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={customer.avatarUrl} alt={customer.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                      {" "}
                      {/* Colored fallback */}
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium text-gray-800 py-2">
                  {customer.name}
                </TableCell>
                <TableCell className="text-gray-600 text-sm py-2">
                  {customer.email}
                </TableCell>
                <TableCell className="text-gray-600 text-sm py-2">
                  {customer.company}
                </TableCell>
                <TableCell className="py-2">
                  <Badge
                    variant="outline" // Use outline base, apply custom classes
                    className={`capitalize text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadgeClass(customer.status)}`}
                  >
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-500 text-sm py-2">
                  {customer.registeredDate?.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right pr-4 py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-800"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-5 w-5" />{" "}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => onViewCustomer(customer)}
                        className="cursor-pointer"
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEditCustomer(customer)}
                        className="cursor-pointer"
                      >
                        Edit Customer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                        onClick={() => onDeleteCustomer(customer.id)}
                      >
                        Delete Customer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <PaginationComponent currentPage={1} />
    </div>
  );
}
