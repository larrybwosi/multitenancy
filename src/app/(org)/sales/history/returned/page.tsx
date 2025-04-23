"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { format } from "date-fns";
import { Download, Eye, PackageCheck, PackageX } from "lucide-react";

import { Return, ReturnStatus, ReturnReason } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ExportAction, FilterControls, FilterOption } from "@/components/file-controls";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Pagination } from "@/components/pagination";

export default function ReturnsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [returns, setReturns] = useState<Return[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

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
  const [status, setStatus] = useQueryState<ReturnStatus>("status",{
    defaultValue: "pending",
    parse: (v) => v as ReturnStatus,
  });
  const [reason, setReason] = useQueryState<ReturnReason>("reason",{
    defaultValue: "other",
    parse: (v) => v as ReturnReason,
  });
  const [dateRange, setDateRange] = useQueryState("dateRange");

  // Fetch returns data
  useEffect(() => {
    const fetchReturns = async () => {
      setIsLoading(true);
      try {
        // Construct query params
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (page) params.append("page", page.toString());
        if (pageSize) params.append("pageSize", pageSize.toString());
        if (status) params.append("status", status);
        if (reason) params.append("reason", reason);
        if (dateRange) params.append("dateRange", dateRange);

        const res = await fetch(`/api/sales/returns?${params.toString()}`);
        const data = await res.json();
        setReturns(data.returns);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error("Failed to fetch returns:", error);
        toast.error("Failed to load returns");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReturns();
  }, [searchQuery, page, pageSize, status, reason, dateRange]);

  // Status options
  const statusOptions: FilterOption[] = Object.values(ReturnStatus).map(
    (status) => ({
      value: status,
      label: status.replace("_", " "),
    })
  );

  // Reason options
  const reasonOptions: FilterOption[] = Object.values(ReturnReason).map(
    (reason) => ({
      value: reason,
      label: reason.replace("_", " "),
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
      onClick: () => exportReturns("csv"),
    },
  ];

  const exportReturns = async (format: "csv") => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (status) params.append("status", status);
    if (reason) params.append("reason", reason);
    if (dateRange) params.append("dateRange", dateRange);

    window.open(
      `/api/returns/export?${params.toString()}&format=${format}`,
      "_blank"
    );
  };

  const handleViewReturn = (returnId: string) => {
    router.push(`/returns/${returnId}`);
  };

  const handleProcessReturn = async () => {
    if (!selectedReturn) return;

    try {
      const endpoint =
        actionType === "approve"
          ? `/api/returns/${selectedReturn.id}/approve`
          : `/api/returns/${selectedReturn.id}/reject`;

      const response = await fetch(endpoint, {
        method: "POST",
      });

      if (response.ok) {
        const updatedReturn = await response.json();
        setReturns(
          returns.map((r) => (r.id === updatedReturn.id ? updatedReturn : r))
        );
        toast.success(
          `Return ${actionType === "approve" ? "approved" : "rejected"} successfully`
        );
      } else {
        throw new Error("Failed to process return");
      }
    } catch (error) {
      console.error("Failed to process return:", error);
      toast.error(
        `Failed to ${actionType === "approve" ? "approve" : "reject"} return`
      );
    } finally {
      setIsProcessDialogOpen(false);
      setSelectedReturn(null);
    }
  };

  const getStatusBadgeVariant = (status: ReturnStatus) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "destructive";
      case "PROCESSED":
        return "default";
      case "REFUNDED":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <SectionHeader
        title="Returns"
        subtitle="View and manage product returns"
        icon={<PackageX className="h-8 w-8 text-gray-600" />}
      />

      <FilterControls
        searchPlaceholder="Search returns..."
        onSearch={setSearchQuery}
        filters={[
          {
            name: "status",
            label: "Status",
            options: statusOptions,
            defaultValue: status,
            onChange: setStatus,
          },
          {
            name: "reason",
            label: "Reason",
            options: reasonOptions,
            defaultValue: reason,
            onChange: setReason,
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
      ) : returns.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">
            No returns found
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
                    Return #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ret.returnNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ret.saleNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(ret.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ret.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ret.items} item(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ret.reason.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(ret.status)}>
                        {ret.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewReturn(ret.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {ret.status === "PENDING" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-success hover:text-success/90"
                            onClick={() => {
                              setSelectedReturn(ret);
                              setActionType("approve");
                              setIsProcessDialogOpen(true);
                            }}
                          >
                            <PackageCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => {
                              setSelectedReturn(ret);
                              setActionType("reject");
                              setIsProcessDialogOpen(true);
                            }}
                          >
                            <PackageX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalCount / Number(pageSize))}
            pageSize={pageSize}
            totalItems={totalCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            className="mt-6"
          />
        </>
      )}

      <AlertDialog
        open={isProcessDialogOpen}
        onOpenChange={setIsProcessDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} this return?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? "This will approve the return and initiate the refund process."
                : "This will reject the return request. The customer will be notified."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                actionType === "approve"
                  ? "bg-success hover:bg-success/90"
                  : "bg-destructive hover:bg-destructive/90"
              }
              onClick={handleProcessReturn}
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
