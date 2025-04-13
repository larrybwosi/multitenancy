"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { format } from "date-fns";
import { RotateCw, Trash2, Eye, Download } from "lucide-react";

import { Sale, PaymentMethod } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ExportAction, FilterControls, FilterOption } from "@/components/file-controls";
import { Pagination } from "@/components/pagination";

interface SaleWithCustomer extends Sale {
  customer: {
    name: string;
  };
}
export default function VoidedPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [voidedSales, setVoidedSales] = useState<SaleWithCustomer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filter state with nuqs
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
    throttleMs: 500,
  });
  const [page, setPage] = useQueryState("page", {
    defaultValue: "1",
    parse: (v) => parseInt(v) || 1,
  });
  const [pageSize, setPageSize] = useQueryState("pageSize", {
    defaultValue: "10",
    parse: (v) => parseInt(v) || 10,
  });
  const [paymentMethod, setPaymentMethod] =
    useQueryState<PaymentMethod>("paymentMethod");
  const [dateRange, setDateRange] = useQueryState("dateRange");

  // Fetch voided sales data
  useEffect(() => {
    const fetchVoidedSales = async () => {
      setIsLoading(true);
      try {
        // Construct query params
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (page) params.append("page", page.toString());
        if (pageSize) params.append("pageSize", pageSize.toString());
        if (paymentMethod) params.append("paymentMethod", paymentMethod);
        if (dateRange) params.append("dateRange", dateRange);

        const res = await fetch(`/api/sales/voided?${params.toString()}`);
        const data = await res.json();
        setVoidedSales(data.sales);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error("Failed to fetch voided sales:", error);
        toast.error("Failed to load voided sales");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoidedSales();
  }, [searchQuery, page, pageSize, paymentMethod, dateRange]);

  // Payment method options
  const paymentMethodOptions: FilterOption[] = Object.values(PaymentMethod).map(
    (method) => ({
      value: method,
      label: method.replace("_", " "),
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
      onClick: () => exportVoidedSales("csv"),
    },
  ];

  const exportVoidedSales = async (format: "csv") => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (paymentMethod) params.append("paymentMethod", paymentMethod);
    if (dateRange) params.append("dateRange", dateRange);

    window.open(
      `/api/sales/voided/export?${params.toString()}&format=${format}`,
      "_blank"
    );
  };

  const handleViewSale = (saleId: string) => {
    router.push(`/sales/${saleId}`);
  };

  const handleDeleteSale = async () => {
    if (!selectedSale) return;

    try {
      const response = await fetch(`/api/sales/voided/${selectedSale.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Voided sale permanently deleted");
        setVoidedSales(
          voidedSales.filter((sale) => sale.id !== selectedSale.id)
        );
        setTotalCount(totalCount - 1);
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete voided sale:", error);
      toast.error("Failed to delete voided sale", {
        duration: 5000,
        description: "Please try again.",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSale(null);
    }
  };

  const handleRestoreSale = async (saleId: string) => {
    try {
      const response = await fetch(`/api/sales/voided/${saleId}/restore`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Sale restored successfully");
        setVoidedSales(voidedSales.filter((sale) => sale.id !== saleId));
        setTotalCount(totalCount - 1);
      } else {
        throw new Error("Failed to restore");
      }
    } catch (error) {
      console.error("Failed to restore sale:", error);
      toast.error("Failed to restore sale", {
        duration: 5000,
        description: "Please try again.",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <SectionHeader
        title="Voided Sales"
        subtitle="View and manage voided sales transactions"
        icon={<Trash2 className="h-8 w-8 text-rose-500" />}
      />

      <FilterControls
        searchPlaceholder="Search voided sales..."
        onSearch={setSearchQuery}
        filters={[
          {
            name: "paymentMethod",
            label: "Payment Method",
            options: paymentMethodOptions,
            defaultValue: paymentMethod,
            onChange: setPaymentMethod,
          },
          {
            name: "dateRange",
            label: "Date Range",
            options: dateRangeOptions,
            defaultValue: dateRange,
            onChange: setDateRange,
          },
        ]}
        exportActions={exportActions}
        variant="bordered"
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : voidedSales.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">
            No voided sales found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Voided
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Void Reason
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {voidedSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.saleNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(sale.updatedAt), "MMM dd, yyyy hh:mm a")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(sale.saleDate), "MMM dd, yyyy hh:mm a")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.customerId ? (
                        <span className="text-primary hover:underline cursor-pointer">
                          {sale.customer?.name || "Customer"}
                        </span>
                      ) : (
                        "Walk-in"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${sale.finalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.paymentMethod.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.voidReason || "No reason provided"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewSale(sale.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreSale(sale.id)}
                      >
                        <RotateCw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedSale(sale);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={Number(page)}
            totalPages={Math.ceil(totalCount / Number(pageSize))}
            pageSize={Number(pageSize)}
            totalItems={totalCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            className="mt-6"
          />
        </>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Permanently delete this voided sale?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              sale record from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteSale}
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
