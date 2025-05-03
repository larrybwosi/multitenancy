"use client";

import { useState, useEffect } from "react";
import { Customer } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomBadge } from "@/components/ui/CustomBadge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  PlusCircle,
  Users,
  Award,
  Calendar,
  Loader2,
  FileText,
  Grid,
  List,
  User,
  Mail,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { CustomerActions } from "./CustomerActions";
import { formatDate } from "@/lib/utils";
import { CustomerDetailView } from "./CustomerDetailView";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FilterControls } from "@/components/file-controls";
import { Pagination } from "@/components/pagination";
import { CustomerModal } from "./CustomerForm";

interface CustomerTableProps {
  initialCustomers: Customer[];
  total: number;
  totalPages: number;
}

export function CustomerTable({
  initialCustomers: customers,
  total,
  totalPages: initialTotalPages,
}: CustomerTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("query") || "");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all"
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sortBy") || "name"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sortOrder") as "asc" | "desc") || "asc"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [pageSize, setPageSize] = useState(10);

  // Simulate loading state for UI improvements
  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [currentPage, statusFilter, sortBy, sortOrder, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    updateUrl({ query: value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateUrl({ status: value, page: 1 });
  };

  const handleSort = (newSortBy: string, newSortOrder: "asc" | "desc") => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    updateUrl({ sortBy: newSortBy, sortOrder: newSortOrder });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrl({ page: newPage });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    // You might want to reset to first page when changing page size
    setCurrentPage(1);
    updateUrl({ pageSize: size, page: 1 });
  };

  const updateUrl = (params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
    });
    router.push(`?${newParams.toString()}`);
  };

  const handleOpenSheet = (customer: Customer | null = null) => {
    setEditingCustomer(customer);
  };

  const handleCloseSheet = () => {
    setEditingCustomer(null);
  };

  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-amber-500",
      "bg-teal-500",
      "bg-indigo-500",
      "bg-rose-500",
    ];

    const hash = name.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    return colors[hash % colors.length];
  };

  const handleExportPdf = () => {
    // PDF export logic
  };

  const handleExportExcel = () => {
    // Excel export logic
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-end">
        <CustomerModal customer={editingCustomer}  />
      </div>

      <FilterControls
        variant="default"
        searchPlaceholder="Search categories..."
        filters={[
          {
            name: 'status',
            label: 'Status',
            defaultValue: statusFilter,
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
            onChange: value => handleStatusChange(value),
          },
          {
            name: 'view',
            label: 'View',
            options: [
              {
                value: 'table',
                label: 'List',
                icon: <List className="h-4 w-4" />,
              },
              {
                value: 'grid',
                label: 'Grid',
                icon: <Grid className="h-4 w-4" />,
              },
            ],
            onChange: value => setViewMode(value as 'table' | 'cards'),
          },
          {
            name: 'sort',
            label: 'Sort',
            options: [
              {
                value: 'name',
                label: 'Name',
                icon: <User className="mr-2 h-4 w-4" />,
              },
              {
                value: 'email',
                label: 'Email',
                icon: <Mail className="mr-2 h-4 w-4" />,
              },
              {
                value: 'created',
                label: 'Date Created',
                icon: <Calendar className="mr-2 h-4 w-4" />,
              },
              {
                value: 'loyaltyPoints',
                label: 'Loyalty Points',
                icon: <Award className="mr-2 h-4 w-4" />,
              },
            ],
            onChange: value => handleSort(value, 'asc'),
          },
        ]}
        onSearch={e => handleSearch(e)}
        onFilterButtonClick={() => console.log('Opening advanced filters modal...')}
        exportActions={[
          {
            label: 'PDF',
            onClick: handleExportPdf,
            icon: <FileText className="mr-2 h-4 w-4" />,
          },
          {
            label: 'Exel',
            onClick: handleExportExcel,
            icon: <Grid className="mr-2 h-4 w-4" />,
          },
        ]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <Card className="border-none shadow-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableHead className="font-bold">Customer</TableHead>
                    <TableHead className="font-bold">Contact</TableHead>
                    <TableHead className="text-center font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Loyalty Points</TableHead>
                    <TableHead className="font-bold">Created On</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.length > 0 ? (
                    customers.map(customer => (
                      <TableRow
                        key={customer.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className={`h-8 w-8 ${getAvatarColor(customer.name)}`}>
                              <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{customer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div>{customer.email || '-'}</div>
                          <div>{customer.phone || '-'}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <CustomBadge
                            variant={customer.isActive ? 'active' : 'inactive'}
                            className={`${customer.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'} text-xs font-medium px-2.5 py-1 rounded-full`}
                          >
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </CustomBadge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <div className="flex items-center justify-end">
                            <Award
                              className={`h-4 w-4 mr-1 ${customer.loyaltyPoints > 50 ? 'text-amber-500' : 'text-slate-400'}`}
                            />
                            <span className={customer.loyaltyPoints > 50 ? 'text-amber-500 font-bold' : ''}>
                              {customer.loyaltyPoints}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1.5 text-indigo-400" />
                            {formatDate(customer.createdAt, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                            <CustomerActions
                              customer={customer}
                              onEdit={() => handleOpenSheet(customer)}
                              onView={() => handleViewCustomer(customer)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="h-12 w-12 mb-2 text-slate-200" />
                          <p>
                            No customers found
                            {searchTerm ? ' matching your search' : ''}.
                          </p>
                          <Button variant="link" onClick={() => handleOpenSheet()} className="text-indigo-500 mt-2">
                            <PlusCircle className="mr-1 h-4 w-4" />
                            Add your first customer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.length > 0 ? (
                customers.map(customer => (
                  <Card
                    key={customer.id}
                    className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleViewCustomer(customer)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-12 w-12 ${getAvatarColor(customer.name)}`}>
                            <AvatarFallback className="text-white text-lg">{getInitials(customer.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-lg">{customer.name}</h3>
                            <p className="text-sm text-muted-foreground">{customer.email || 'No email'}</p>
                          </div>
                        </div>
                        <CustomBadge
                          variant={customer.isActive ? 'active' : 'inactive'}
                          className={`${customer.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'} text-xs font-medium px-2.5 py-1 rounded-full`}
                        >
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </CustomBadge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">Phone</span>
                          <span className="font-medium">{customer.phone || '-'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">Created</span>
                          <span className="font-medium">
                            {formatDate(customer.createdAt, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Award
                            className={`h-5 w-5 mr-2 ${customer.loyaltyPoints > 50 ? 'text-amber-500' : 'text-slate-400'}`}
                          />
                          <div>
                            <span className="text-xs text-muted-foreground block">Loyalty Points</span>
                            <span className={`font-bold ${customer.loyaltyPoints > 50 ? 'text-amber-500' : ''}`}>
                              {customer.loyaltyPoints}
                            </span>
                          </div>
                        </div>

                        <div onClick={e => e.stopPropagation()}>
                          <CustomerActions
                            customer={customer}
                            onEdit={() => handleOpenSheet(customer)}
                            onView={() => handleViewCustomer(customer)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground bg-slate-50 rounded-lg">
                  <Users className="h-16 w-16 mb-4 text-slate-200" />
                  <p className="text-lg">
                    No customers found
                    {searchTerm ? ' matching your search' : ''}.
                  </p>
                  <Button variant="link" onClick={() => handleOpenSheet()} className="text-indigo-500 mt-2">
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Add your first customer
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex-1 flex-grow" />
      {/* Custom Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalPages={initialTotalPages}
        pageSize={pageSize}
        totalItems={total}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        className="mt-6"
      />

      {/* View Customer Sheet */}
      <Sheet open={!!viewingCustomer} onOpenChange={() => setViewingCustomer(null)}>
        <SheetContent className="sm:max-w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
              {viewingCustomer && (
                <>
                  <Avatar className={`h-8 w-8 ${viewingCustomer ? getAvatarColor(viewingCustomer.name) : ''}`}>
                    <AvatarFallback className="text-white">
                      {viewingCustomer ? getInitials(viewingCustomer.name) : ''}
                    </AvatarFallback>
                  </Avatar>
                  {viewingCustomer.name}
                </>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="py-6">
            {viewingCustomer && (
              <CustomerDetailView customerId={viewingCustomer.id} onOpenChange={() => setViewingCustomer(null)} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
