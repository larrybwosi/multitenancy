'use client'
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types based on your Prisma schema
type Supplier = {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  totalSpent: number;
  lastOrderDate: string | null;
};

type Transaction = {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: "completed" | "pending" | "cancelled";
};

// Mock data - replace with actual data fetching
const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Global Foods Inc.",
    contactPerson: "John Smith",
    email: "john@globalfoods.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, New York, NY 10001",
    createdAt: "2023-10-15T09:30:00Z",
    totalSpent: 12500.75,
    lastOrderDate: "2023-12-15T14:30:00Z",
  },
  {
    id: "2",
    name: "Tech Supplies Co.",
    contactPerson: "Sarah Johnson",
    email: "sarah@techsupplies.co",
    phone: "+1 (555) 987-6543",
    address: "456 Tech Ave, San Francisco, CA 94107",
    createdAt: "2023-09-22T14:15:00Z",
    totalSpent: 8750.25,
    lastOrderDate: "2023-11-28T10:15:00Z",
  },
  {
    id: "3",
    name: "Office Essentials Ltd.",
    contactPerson: null,
    email: "info@officeessentials.com",
    phone: "+1 (555) 456-7890",
    address: "789 Business Blvd, Chicago, IL 60601",
    createdAt: "2023-11-05T11:20:00Z",
    totalSpent: 4200.5,
    lastOrderDate: "2023-12-10T16:45:00Z",
  },
];

const mockTransactions: Record<string, Transaction[]> = {
  "1": [
    {
      id: "101",
      date: "2023-12-15T14:30:00Z",
      productName: "Premium Coffee Beans",
      quantity: 50,
      unitPrice: 12.5,
      total: 625,
      status: "completed",
    },
    {
      id: "102",
      date: "2023-11-28T09:15:00Z",
      productName: "Organic Sugar",
      quantity: 100,
      unitPrice: 8.75,
      total: 875,
      status: "completed",
    },
    {
      id: "103",
      date: "2023-10-10T11:45:00Z",
      productName: "Glass Bottles",
      quantity: 200,
      unitPrice: 2.5,
      total: 500,
      status: "completed",
    },
  ],
  "2": [
    {
      id: "201",
      date: "2023-11-28T10:15:00Z",
      productName: "Wireless Keyboards",
      quantity: 25,
      unitPrice: 45.99,
      total: 1149.75,
      status: "completed",
    },
    {
      id: "202",
      date: "2023-10-15T13:20:00Z",
      productName: "Ergonomic Mice",
      quantity: 30,
      unitPrice: 32.5,
      total: 975,
      status: "completed",
    },
  ],
  "3": [
    {
      id: "301",
      date: "2023-12-10T16:45:00Z",
      productName: "Desk Organizers",
      quantity: 15,
      unitPrice: 18.5,
      total: 277.5,
      status: "completed",
    },
    {
      id: "302",
      date: "2023-11-22T14:10:00Z",
      productName: "Notebooks",
      quantity: 100,
      unitPrice: 3.25,
      total: 325,
      status: "completed",
    },
  ],
};

// Zod schema for supplier validation
const supplierFormSchema = z.object({
  name: z.string().min(2, {
    message: "Supplier name must be at least 2 characters.",
  }),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type SortField = "name" | "totalSpent" | "lastOrderDate" | "createdAt";
type SortDirection = "asc" | "desc";

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
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
        ? a.totalSpent - b.totalSpent
        : b.totalSpent - a.totalSpent;
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

  // Form setup
  const form = useForm<z.infer<typeof supplierFormSchema>>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  function onSubmit(values: z.infer<typeof supplierFormSchema>) {
    // In a real app, you would call your API here
    const newSupplier: Supplier = {
      id: Math.random().toString(36).substring(2, 9),
      name: values.name,
      contactPerson: values.contactPerson || null,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      createdAt: new Date().toISOString(),
      totalSpent: 0,
      lastOrderDate: null,
    };

    setSuppliers([...suppliers, newSupplier]);
    form.reset();
  }

  // Get transactions for selected supplier
  const getSupplierTransactions = (supplierId: string) => {
    return mockTransactions[supplierId] || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Suppliers
          </h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s suppliers and vendors
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary">
                Add New Supplier
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="font-medium">
                          Supplier Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter supplier name"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">
                          Contact Person
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter contact person"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter email address"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter phone number"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="font-medium">Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter full address"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                  >
                    Save Supplier
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="bg-gray-200" />

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

          <Badge
            variant="outline"
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border-blue-200"
          >
            {filteredSuppliers.length}{" "}
            {filteredSuppliers.length === 1 ? "Supplier" : "Suppliers"}
          </Badge>
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
                        {supplier.totalSpent.toLocaleString("en-US", {
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
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                              onClick={() => setSelectedSupplier(supplier)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-full sm:w-[600px]">
                            {selectedSupplier && (
                              <div className="space-y-6">
                                <SheetHeader>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 bg-blue-100 text-blue-600">
                                      <AvatarFallback>
                                        {selectedSupplier.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <SheetTitle className="text-2xl font-bold text-gray-900">
                                        {selectedSupplier.name}
                                      </SheetTitle>
                                      <p className="text-sm text-gray-500">
                                        Supplier since{" "}
                                        {new Date(
                                          selectedSupplier.createdAt
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </SheetHeader>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                  <Card className="bg-blue-50 border-blue-100">
                                    <CardHeader className="pb-2">
                                      <p className="text-sm font-medium text-blue-600">
                                        Total Spent
                                      </p>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-2xl font-bold text-blue-800">
                                        $
                                        {selectedSupplier.totalSpent.toLocaleString(
                                          "en-US",
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}
                                      </p>
                                    </CardContent>
                                  </Card>

                                  <Card className="bg-green-50 border-green-100">
                                    <CardHeader className="pb-2">
                                      <p className="text-sm font-medium text-green-600">
                                        Last Order
                                      </p>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-2xl font-bold text-green-800">
                                        {selectedSupplier.lastOrderDate
                                          ? new Date(
                                              selectedSupplier.lastOrderDate
                                            ).toLocaleDateString()
                                          : "No orders"}
                                      </p>
                                    </CardContent>
                                  </Card>
                                </div>

                                <div className="space-y-2">
                                  <h3 className="font-medium text-gray-900">
                                    Contact Information
                                  </h3>
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Contact Person
                                      </p>
                                      <p className="font-medium">
                                        {selectedSupplier.contactPerson || (
                                          <span className="text-gray-400">
                                            Not specified
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Email
                                      </p>
                                      <p className="font-medium">
                                        {selectedSupplier.email || (
                                          <span className="text-gray-400">
                                            Not specified
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Phone
                                      </p>
                                      <p className="font-medium">
                                        {selectedSupplier.phone || (
                                          <span className="text-gray-400">
                                            Not specified
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Address
                                      </p>
                                      <p className="font-medium">
                                        {selectedSupplier.address || (
                                          <span className="text-gray-400">
                                            Not specified
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <Separator className="bg-gray-200" />

                                <div className="space-y-3">
                                  <h3 className="font-medium text-gray-900">
                                    Recent Transactions
                                  </h3>
                                  {getSupplierTransactions(selectedSupplier.id)
                                    .length > 0 ? (
                                    <div className="space-y-2">
                                      {getSupplierTransactions(
                                        selectedSupplier.id
                                      ).map((transaction) => (
                                        <Card
                                          key={transaction.id}
                                          className="border-gray-200 shadow-sm"
                                        >
                                          <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <p className="font-medium">
                                                  {transaction.productName}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                  {new Date(
                                                    transaction.date
                                                  ).toLocaleDateString()}{" "}
                                                  •
                                                  <span className="ml-1">
                                                    {transaction.quantity} × $
                                                    {transaction.unitPrice.toFixed(
                                                      2
                                                    )}
                                                  </span>
                                                </p>
                                              </div>
                                              <div className="text-right">
                                                <p className="font-bold">
                                                  $
                                                  {transaction.total.toFixed(2)}
                                                </p>
                                                <Badge
                                                  variant="outline"
                                                  className={
                                                    transaction.status ===
                                                    "completed"
                                                      ? "bg-green-50 text-green-700 border-green-200"
                                                      : transaction.status ===
                                                          "pending"
                                                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                        : "bg-red-50 text-red-700 border-red-200"
                                                  }
                                                >
                                                  {transaction.status
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    transaction.status.slice(1)}
                                                </Badge>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="py-6 text-center">
                                      <p className="text-gray-500">
                                        No recent transactions
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </SheetContent>
                        </Sheet>
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
                          <PlusIcon className="h-8 w-8 text-gray-400" />
                          <p className="text-gray-500">
                            No suppliers added yet
                          </p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add your first supplier
                              </Button>
                            </DialogTrigger>
                          </Dialog>
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
                  <span className="font-medium">
                    {filteredSuppliers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {filteredSuppliers.length}
                  </span>{" "}
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
    </div>
  );
}
