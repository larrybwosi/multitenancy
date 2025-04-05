"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion"; // For animations
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Search as SearchIcon,
  Sliders,
  Building,
  MoreHorizontal,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Added AvatarImage
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // For tooltips

// Assuming these components exist and work with server actions / state updates
import CreateSupplier from "./create-supplier"; // Needs to call createSupplierAction
import SupplierSheet from "./supplier-sheet"; // Needs props for update/delete actions

// Use the enhanced type
import type { SupplierWithStats } from "@/lib/types";
import { Decimal } from "@prisma/client/runtime/library"; // Import Decimal
import { Supplier } from "@prisma/client";

// Define sortable fields using the SupplierWithStats type
type SortField = keyof Pick<
  SupplierWithStats,
  "name" | "totalSpent" | "lastOrderDate" | "createdAt"
>;
type SortDirection = "asc" | "desc";

// Helper to format currency (using Decimal)
const formatCurrency = (value: Decimal | number | null | undefined): string => {
  const num = value instanceof Decimal ? value.toNumber() : value || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD", // Adjust currency as needed
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Helper to format dates
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      // Adjust locale as needed
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    console.log(e)
    return "Invalid Date";
  }
};

// Utility for generating initials
const getInitials = (name: string = ""): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter((_, i, arr) => i === 0 || i === arr.length - 1) // First and Last initial
    .join("")
    .toUpperCase();
};

interface SupplierTableProps {
  initialSuppliers: SupplierWithStats[];
  // Add props for handling updates/deletes if SupplierSheet doesn't manage its own actions
  // onDeleteSupplier: (id: string) => Promise<void>;
  // onUpdateSupplier: (id: string, data: UpdateSupplierInput) => Promise<void>;
}

export default function SupplierTable({
  initialSuppliers,
}: SupplierTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  // Use SupplierWithStats for the state
  const [suppliers, setSuppliers] =
    useState<SupplierWithStats[]>(initialSuppliers);
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({ field: "name", direction: "asc" });

  // Memoize sorting and filtering for performance
  const filteredAndSortedSuppliers = useMemo(() => {
    let filtered = suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactPerson
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const field = sortConfig.field;
      const directionMultiplier = sortConfig.direction === "asc" ? 1 : -1;

      let comparison = 0;

      switch (field) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "totalSpent":
          // Compare Decimal values
          comparison = a.totalSpent.comparedTo(b.totalSpent);
          break;
        case "lastOrderDate":
          const dateA = a.lastOrderDate
            ? new Date(a.lastOrderDate).getTime()
            : 0;
          const dateB = b.lastOrderDate
            ? new Date(b.lastOrderDate).getTime()
            : 0;
          comparison = dateA - dateB;
          break;
        case "createdAt":
          const createdA = new Date(a.createdAt).getTime();
          const createdB = new Date(b.createdAt).getTime();
          comparison = createdA - createdB;
          break;
        default:
          // Optional: handle unexpected sort field
          console.warn(`Unsupported sort field: ${field}`);
          return 0;
      }

      return comparison * directionMultiplier;
    });

    return filtered;
  }, [suppliers, searchTerm, sortConfig]);

  // Handle sort request
  const requestSort = useCallback((field: SortField) => {
    setSortConfig((currentSortConfig) => ({
      field,
      direction:
        currentSortConfig.field === field &&
        currentSortConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  }, []);

  // Handle new supplier creation (called from CreateSupplier component's success handler)
  // This optimistically updates the UI. For stats, a refetch might be needed.
  const handleSupplierCreated = useCallback((newSupplier: Supplier) => {
    // Add the new supplier with default/zero stats initially
    const supplierWithDefaults: SupplierWithStats = {
      ...newSupplier,
      totalSpent: new Decimal(0),
      lastOrderDate: null,
    };
    setSuppliers((currentSuppliers) => [
      ...currentSuppliers,
      supplierWithDefaults,
    ]);
    // Optionally: Trigger a refetch of the full list here to get accurate stats
    // Example: router.refresh(); // If using Next.js App Router
  }, []);

  // --- Render Functions ---

  // Render Sortable Table Header Cell
  const renderSortableHeader = (
    field: SortField,
    label: string,
    className?: string
  ) => (
    <TableHead
      className={`py-3 px-4 md:px-6 font-semibold text-gray-600 whitespace-nowrap ${className}`}
    >
      <button
        onClick={() => requestSort(field)}
        className="flex items-center gap-1 group focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
        aria-label={`Sort by ${label} ${sortConfig.field === field ? (sortConfig.direction === "asc" ? "(ascending)" : "(descending)") : ""}`}
      >
        {label}
        {sortConfig.field === field ? (
          sortConfig.direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
          )
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
    </TableHead>
  );

  return (
    <TooltipProvider delayDuration={200}>
      {" "}
      {/* Wrap root for Tooltips */}
      <div className="flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Filter and Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative w-full md:max-w-xs lg:max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search suppliers..."
              className="pl-9 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search suppliers"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            {/* Filter/Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 border-gray-300 dark:border-gray-600 dark:text-gray-300"
                >
                  <Sliders className="h-4 w-4" />
                  <span className="hidden sm:inline">Sort</span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 dark:bg-gray-800 dark:border-gray-700"
              >
                <DropdownMenuLabel className="dark:text-gray-400">
                  Sort by
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-gray-700" />
                <DropdownMenuItem
                  onSelect={() => requestSort("name")}
                  className="cursor-pointer dark:focus:bg-gray-700 dark:text-gray-300"
                >
                  Name{" "}
                  {sortConfig.field === "name" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ))}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => requestSort("totalSpent")}
                  className="cursor-pointer dark:focus:bg-gray-700 dark:text-gray-300"
                >
                  Value Held{" "}
                  {sortConfig.field === "totalSpent" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ))}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => requestSort("lastOrderDate")}
                  className="cursor-pointer dark:focus:bg-gray-700 dark:text-gray-300"
                >
                  Last Stock Date{" "}
                  {sortConfig.field === "lastOrderDate" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ))}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => requestSort("createdAt")}
                  className="cursor-pointer dark:focus:bg-gray-700 dark:text-gray-300"
                >
                  Date Added{" "}
                  {sortConfig.field === "createdAt" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ))}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add New Supplier Button */}
            <CreateSupplier onSupplierCreated={handleSupplierCreated} />
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-grow overflow-x-auto">
          {filteredAndSortedSuppliers.length === 0 ? (
            <div className="py-16 px-6 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center text-center rounded-b-lg">
              <div className="bg-white dark:bg-gray-700 p-3 rounded-full mb-4 shadow-sm border border-gray-100 dark:border-gray-600">
                <Building className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {searchTerm ? "No suppliers match" : "No suppliers found"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-5">
                {searchTerm
                  ? `We couldn't find any suppliers matching "${searchTerm}". Try adjusting your search.`
                  : "Get started by adding your first supplier. They'll appear here once added."}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600 dark:text-gray-300"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </Button>
              )}
              {!searchTerm && (
                <CreateSupplier
                  onSupplierCreated={handleSupplierCreated}
                />
              )}
            </div>
          ) : (
            <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <TableHeader className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                {" "}
                {/* Sticky header */}
                <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                  {renderSortableHeader("name", "Supplier", "w-2/5 lg:w-1/3")}
                  <TableHead className="py-3 px-4 md:px-6 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                    Contact
                  </TableHead>
                  {renderSortableHeader(
                    "totalSpent",
                    "Value Held",
                    "hidden md:table-cell text-right"
                  )}
                  {renderSortableHeader(
                    "lastOrderDate",
                    "Last Stock Date",
                    "hidden sm:table-cell"
                  )}
                  <TableHead className="py-3 px-4 md:px-6 font-semibold text-gray-600 dark:text-gray-300 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-750">
                {filteredAndSortedSuppliers.map((supplier) => (
                  <motion.tr
                    key={supplier.id}
                    className="hover:bg-blue-50/40 dark:hover:bg-gray-800/60 transition-colors duration-150"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Supplier Name & Avatar */}
                    <TableCell className="py-3 px-4 md:px-6 font-medium align-top w-2/5 lg:w-1/3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                          {/* <AvatarImage src={supplier.logoUrl} alt={supplier.name} /> */}
                          <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-300">
                            {getInitials(supplier.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
                            {supplier.name}
                          </span>
                          {supplier.address && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 cursor-default">
                                  {supplier.address}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300">
                                <p>{supplier.address}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact Info (Hidden on smaller screens) */}
                    <TableCell className="py-3 px-4 md:px-6 align-top text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {supplier.contactPerson ? (
                        <div className="flex flex-col">
                          <span className="text-gray-800 dark:text-gray-200">
                            {supplier.contactPerson}
                          </span>
                          {supplier.phone && (
                            <span className="text-xs mt-0.5">
                              {supplier.phone}
                            </span>
                          )}
                          {supplier.email && (
                            <a
                              href={`mailto:${supplier.email}`}
                              className="text-xs mt-0.5 text-blue-600 hover:underline"
                            >
                              {supplier.email}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic">
                          N/A
                        </span>
                      )}
                    </TableCell>

                    {/* Total Spent */}
                    <TableCell className="py-3 px-4 md:px-6 align-top font-medium text-right hidden md:table-cell">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={`text-sm ${supplier.totalSpent.isZero() ? "text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}
                          >
                            {formatCurrency(supplier.totalSpent)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300">
                          <p>
                            Approx. current value of stock held from this
                            supplier.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>

                    {/* Last Order Date */}
                    <TableCell className="py-3 px-4 md:px-6 align-top text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                      {formatDate(supplier.lastOrderDate)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 px-4 md:px-6 text-right align-top">
                      <SupplierSheet supplier={supplier} />
                      {/* Example: Add Edit/Delete directly or via Dropdown */}
                      <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500"> <MoreHorizontal className="h-4 w-4"/> </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => {/* handle edit*/ }}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => {/* handle delete */}} className="text-red-600">Delete</DropdownMenuItem>
                             </DropdownMenuContent>
                         </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer / Pagination Area */}
        {filteredAndSortedSuppliers.length > 0 && (
          <div className="flex items-center justify-between px-4 md:px-6 py-3 text-xs md:text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            <div>
              Showing{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {filteredAndSortedSuppliers.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {suppliers.length}
              </span>{" "}
              suppliers
            </div>
            {/* Basic Pagination Placeholder - Implement with server-side fetching for large datasets */}
            <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" >Next</Button>
                </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
