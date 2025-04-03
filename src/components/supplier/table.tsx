"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  SearchIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import CreateSupplier from "./create-supplier";
import SupplierSheet from "./supplier-sheet";
import { Supplier } from "@prisma/client";

type SortField = "name" | "totalSpent" | "lastOrderDate" | "createdAt";
type SortDirection = "asc" | "desc";

export default function SupplierTable({
  initialSuppliers,
}: {
  initialSuppliers: Supplier[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState<any[]>(initialSuppliers);
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({ field: "name", direction: "asc" });
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );

  // Sort suppliers
  const sortedSuppliers = [...suppliers].sort((a, b) => {
    if (sortConfig.field === "name") {
      return sortConfig.direction === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortConfig.field === "totalSpent") {
      return sortConfig.direction === "asc"
        ? (a.totalSpent || 0) - (b.totalSpent || 0)
        : (b.totalSpent || 0) - (a.totalSpent || 0);
    } else if (sortConfig.field === "lastOrderDate") {
      const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
      const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
      return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
    } else {
      // createdAt
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
    }
  });

  // Filter suppliers based on search term
  const filteredSuppliers = sortedSuppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle sort
  const requestSort = (field: SortField) => {
    let direction: SortDirection = "asc";
    if (sortConfig.field === field && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ field, direction });
  };

  const handleSupplierCreated = (newSupplier: Supplier) => {
    setSuppliers([...suppliers, newSupplier]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="relative w-full max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search suppliers..."
            className="pl-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border-blue-200"
          >
            {filteredSuppliers.length}{" "}
            {filteredSuppliers.length === 1 ? "Supplier" : "Suppliers"}
          </Badge>
          <CreateSupplier onSupplierCreated={handleSupplierCreated} />
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="px-7 py-5 bg-gray-50 border-b border-gray-200 rounded-t-lg">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Current Suppliers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3 px-6 font-medium text-gray-700">
                  <button
                    onClick={() => requestSort("name")}
                    className="flex items-center gap-1 focus:outline-none"
                  >
                    Supplier
                    {sortConfig.field === "name" &&
                      (sortConfig.direction === "asc" ? (
                        <ArrowUp className="h-4 w-4 text-blue-500" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-blue-500" />
                      ))}
                  </button>
                </TableHead>
                <TableHead className="py-3 px-6 font-medium text-gray-700">
                  Contact
                </TableHead>
                <TableHead className="py-3 px-6 font-medium text-gray-700">
                  Email
                </TableHead>
                <TableHead className="py-3 px-6 font-medium text-gray-700">
                  <button
                    onClick={() => requestSort("totalSpent")}
                    className="flex items-center gap-1 focus:outline-none"
                  >
                    Total Spent
                    {sortConfig.field === "totalSpent" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="h-4 w-4 text-blue-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-blue-500" />
                      ))}
                  </button>
                </TableHead>
                <TableHead className="py-3 px-6 font-medium text-gray-700">
                  <button
                    onClick={() => requestSort("lastOrderDate")}
                    className="flex items-center gap-1 focus:outline-none"
                  >
                    Last Order
                    {sortConfig.field === "lastOrderDate" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="h-4 w-4 text-blue-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-blue-500" />
                      ))}
                  </button>
                </TableHead>
                <TableHead className="py-3 px-6 font-medium text-gray-700 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="hover:bg-blue-50/50 border-b border-gray-100"
                  >
                    <TableCell className="py-4 px-6 font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 bg-blue-100 text-blue-600">
                          <AvatarFallback>
                            {supplier.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {supplier.name}
                          </span>
                          {supplier.address && (
                            <span className="text-xs text-gray-500">
                              {supplier.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {supplier.contactPerson || (
                        <span className="text-gray-400">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {supplier.email || (
                        <span className="text-gray-400">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6 font-medium">
                      $
                      {(supplier.totalSpent || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {supplier.lastOrderDate ? (
                        new Date(supplier.lastOrderDate).toLocaleDateString()
                      ) : (
                        <span className="text-gray-400">No orders</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <SupplierSheet
                        supplier={supplier}
                        onOpenChange={(open) => {
                          if (open) {
                            setSelectedSupplier(supplier);
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center py-8">
                    {searchTerm ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <SearchIcon className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">
                          No matching suppliers found
                        </p>
                        <Button
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => setSearchTerm("")}
                        >
                          Clear search
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CreateSupplier
                          onSupplierCreated={handleSupplierCreated}
                          triggerText="Add your first supplier"
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {filteredSuppliers.length > 0 && (
          <CardFooter className="px-7 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{filteredSuppliers.length}</span>{" "}
                of{" "}
                <span className="font-medium">{filteredSuppliers.length}</span>{" "}
                suppliers
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
