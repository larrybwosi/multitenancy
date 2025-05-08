"use client";

import { Suspense, useState } from "react";
import { useQueryState } from "nuqs";
import { Download, ExternalLink, Eye, FilePlus2 } from "lucide-react";
import useSWR from "swr";
import { Sale, PaymentMethod, PaymentStatus, Prisma } from "@/prisma/client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { FilterControls } from "@/components/file-controls";
import { Pagination } from "@/components/pagination";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SaleDetailsSheet } from "./components/sheet";

interface FilterOption {
  value: string;
  label: string;
}

interface ExportAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface Customer {
  id: string;
  name: string;
}

interface SaleWithCustomer extends Sale {
  customer?: Customer;
  items?: {
    product: {
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
  }[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());


export function SalesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Function to format currency
  const formatCurrency = (amount: number| Prisma.Decimal) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseInt(amount.toString()));
  };

  // Simple date formatter function without date-fns
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";

    return {
      date: `${month} ${day}, ${year}`,
      time: `${hours}:${minutes} ${ampm}`,
    };
  };

  // Filter state with nuqs
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
    throttleMs: 500,
  });
  const [page, setPage] = useQueryState("page", {
    defaultValue: "1",
    parse: (v) => parseInt(v) || 1,
    serialize: String
  });
  const [pageSize, setPageSize] = useQueryState('pageSize', {
    defaultValue: '10',
    parse: v => parseInt(v) || 10,
    serialize: String,
  });
  const [paymentMethod, setPaymentMethod] = useQueryState<PaymentMethod | null>('paymentmethod', {
    defaultValue: null,
    serialize: String,
  });
  const [paymentStatus, setPaymentStatus] =
    useQueryState<PaymentStatus>("paymentStatus");
  const [dateRange, setDateRange] = useQueryState("dateRange");

  // Construct query params
  const params = new URLSearchParams();
  if (searchQuery) params.append("search", searchQuery);
  if (page) params.append("page", page.toString());
  if (pageSize) params.append("pageSize", pageSize.toString());
  if (paymentMethod) params.append("paymentMethod", paymentMethod);
  if (paymentStatus) params.append("paymentStatus", paymentStatus);
  if (dateRange) params.append("dateRange", dateRange);

  // Fetch sales data with SWR
  const { data, error, isLoading } = useSWR<{
    sales: SaleWithCustomer[];
    totalCount: number;
  }>(`/api/sales?${params.toString()}`, fetcher);

  // Payment method options
  const paymentMethodOptions: FilterOption[] = Object.values(PaymentMethod).map(
    (method) => ({
      value: method,
      label: method.replace("_", " "),
    })
  );

  // Payment status options
  const paymentStatusOptions: FilterOption[] = Object.values(PaymentStatus).map(
    (status) => ({
      value: status,
      label: status.charAt(0) + status.slice(1).toLowerCase(),
    })
  );

  // Date range options
  const dateRangeOptions: FilterOption[] = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "this_week", label: "This Week" },
    { value: "last_week", label: "Last Week" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "this_year", label: "This Year" },
    { value: "last_year", label: "Last Year" },
    { value: "all_time", label: "All Time" },
  ];

  // Export actions
  const exportActions: ExportAction[] = [
    {
      label: "Export CSV",
      icon: <Download className="h-4 w-4" />,
      onClick: () => exportSales("csv"),
    },
    {
      label: "Export PDF",
      icon: <Download className="h-4 w-4" />,
      onClick: () => exportSales("pdf"),
    },
  ];

  const exportSales = async (format: "csv" | "pdf") => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (paymentMethod) params.append("paymentMethod", paymentMethod);
    if (paymentStatus) params.append("paymentStatus", paymentStatus);
    if (dateRange) params.append("dateRange", dateRange);

    // window.open(
    //   `/api/sales/export?${params.toString()}&format=${format}`,
    //   "_blank"
    // );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <SalesLoadingSkeleton />
      </div>
    );
  }

  return (
    <Suspense fallback={<SalesLoadingSkeleton />}>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <SectionHeader
          title="Sales"
          subtitle="View and manage all sales transactions"
          icon={<FilePlus2 className="h-8 w-8 text-green-500" />}
        />

        <FilterControls
          searchPlaceholder="Search sales..."
          onSearch={setSearchQuery}
          filters={[
            {
              name: 'paymentMethod',
              label: 'Payment Method',
              options: paymentMethodOptions,
              defaultValue: paymentMethod || undefined,
              onChange: value => setPaymentMethod(value as PaymentMethod),
            },
            {
              name: 'paymentStatus',
              label: 'Payment Status',
              options: paymentStatusOptions,
              defaultValue: paymentStatus || undefined,
              onChange: value => setPaymentStatus(value as PaymentStatus),
            },
            {
              name: 'dateRange',
              label: 'Date Range',
              options: dateRangeOptions,
              defaultValue: dateRange || undefined,
              onChange: setDateRange,
            },
          ]}
          exportActions={exportActions}
          variant="bordered"
        />

        {error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <h3 className="text-lg font-medium text-destructive">Error loading sales</h3>
            <p className="mt-2 text-sm text-destructive/80">Please try again later</p>
          </div>
        ) : !data?.sales || data.sales.length === 0 ? (
          <div className="rounded-lg border bg-muted/50 p-6 text-center">
            <h3 className="text-lg font-medium">No sales found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Sale #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sales.map(sale => {
                    const formattedDate = formatDate(sale.saleDate);
                    const truncatedSaleId = `#${sale.saleNumber.slice(0, 8)}${sale.saleNumber.length > 8 ? '...' : ''}`;
                    const dateTimeString = `${formattedDate.date} ${formattedDate.time}`;

                    return (
                      <tr
                        key={sale.id}
                        className={`border-b border-gray-100 transition-all duration-200 ${
                          hoveredRow === sale.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onMouseEnter={() => setHoveredRow(sale.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{truncatedSaleId}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{dateTimeString}</td>
                        <td className="px-4 py-3">
                          {sale.customerId ? (
                            <div className="flex items-center space-x-1">
                              <span className="text-blue-600 font-medium hover:underline cursor-pointer flex items-center">
                                {sale.customer?.name || 'Customer'}
                                <ExternalLink size={14} className="ml-1 text-gray-400" />
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Walk-in</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(sale.finalAmount)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div
                              className={`w-2 h-2 rounded-full mr-2 ${
                                sale.paymentMethod.includes('CREDIT')
                                  ? 'bg-purple-500'
                                  : sale.paymentMethod.includes('CASH')
                                    ? 'bg-green-500'
                                    : 'bg-blue-500'
                              }`}
                            />
                            <span className="capitalize text-gray-700">
                              {sale.paymentMethod.toLowerCase().replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              sale.paymentStatus === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : sale.paymentStatus === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : sale.paymentStatus === 'FAILED' || sale.paymentStatus === 'CANCELLED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {sale.paymentStatus.charAt(0) + sale.paymentStatus.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              hoveredRow === sale.id ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                            onClick={() => setSelectedSaleId(sale.id)}
                          >
                            <Eye size={16} className="mr-1" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Pagination
              currentPage={Number(page)}
              totalPages={Math.ceil(data.totalCount / Number(pageSize))}
              pageSize={Number(pageSize)}
              totalItems={data.totalCount}
              onPageChange={p => setPage(p.toString())}
              onPageSizeChange={p => setPageSize(p.toString())}
            />

            <SaleDetailsSheet saleId={selectedSaleId} onOpenChange={open => !open && setSelectedSaleId(null)} />
          </>
        )}
      </div>
    </Suspense>
  );
}
