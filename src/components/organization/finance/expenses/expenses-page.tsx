"use client"; // Required for hooks and event handlers

import type React from "react";
import { useState } from "react"; // Keep useState for local UI state like isCreateSheetOpen
import {
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsIsoDate,
} from "nuqs";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query"; // Import tanstack query hooks
import { PlusIcon, DownloadIcon, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpensesList } from "./expenses-list";
import { ExpensesStats } from "./expenses-stats";
import { RecurringExpensesList } from "./recurring-expenses-list";
import { CreateExpenseSheet } from "./create-expense-sheet";
import { ExpenseAnalytics } from "./expense-analytics";

// Define the shape of the API response (optional but recommended)
interface ExpenseData {
  expenses: any[];
  pagination: any;
  categories?: string[];
  departments?: string[];
  vendors?: string[];
  approvalStatuses?: string[];
}

// The Query Function for TanStack Query
const fetchExpensesData = async ({
  queryKey,
}: {
  queryKey: any;
}): Promise<ExpenseData> => {
  const [_key, params] = queryKey; // Destructure the key
  const apiParams = new URLSearchParams();

  // Append params only if they have a value
  if (params.category) apiParams.append("category", params.category);
  if (params.department) apiParams.append("department", params.department);
  if (params.vendor) apiParams.append("vendor", params.vendor);
  if (params.approvalStatus)
    apiParams.append("approvalStatus", params.approvalStatus);
  // Assuming API expects string 'true'/'false' or nothing for 'all'
  if (params.taxDeductible === "true" || params.taxDeductible === "false") {
    apiParams.append("taxDeductible", params.taxDeductible);
  }
  if (params.startDate)
    apiParams.append("startDate", params.startDate.toISOString().split("T")[0]);
  if (params.endDate)
    apiParams.append("endDate", params.endDate.toISOString().split("T")[0]);
  if (params.search) apiParams.append("search", params.search);
  if (params.tab === "recurring") apiParams.append("isRecurring", "true");
  apiParams.append("page", params.page.toString());
  apiParams.append("limit", "10"); // Keep limit consistent

  const response = await fetch(`/api/finance/expenses?${apiParams.toString()}`);
  if (!response.ok) {
    // Handle non-2xx responses
    const errorData = await response.json().catch(() => ({})); // Try to parse error details
    throw new Error(
      `Network response was not ok: ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }
  return response.json(); // TanStack Query expects a promise that resolves with data or throws an error
};

export function ExpensesPage() {
  const queryClient = useQueryClient();
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  // Manage URL search params state with nuqs
  const [queryStates, setQueryStates] = useQueryStates(
    {
      tab: parseAsString.withDefault("all"),
      category: parseAsString.withDefault(""),
      department: parseAsString.withDefault(""),
      vendor: parseAsString.withDefault(""),
      approvalStatus: parseAsString.withDefault(""),
      taxDeductible: parseAsString.withDefault(""), // Use '' for 'all'
      startDate: parseAsIsoDate,
      endDate: parseAsIsoDate,
      search: parseAsString.withDefault(""),
      page: parseAsInteger.withDefault(1),
    },
    {
      // Optional: Debounce search input updates to the URL
      // search: parseAsString.withDefault('').withOptions({ history: 'push', shallow: false, debounceMs: 300 })
      // Optional: Use shallow routing for filters if API fetch depends only on URL state managed by useQuery
      shallow: false, // Keep false to trigger full navigation for data fetching via queryKey change
    }
  );

  // Define the query key based on the current filters from nuqs
  // The query will automatically refetch when any value in queryStates changes
  const queryKey = ["expenses", { ...queryStates }];

  // Use TanStack Query to fetch and manage data
  const {
    data,
    isLoading, // True on initial load or when no data is present
    isFetching, // True whenever a fetch is in progress (including background refetches)
    isError,
    error,
  } = useQuery<ExpenseData, Error>({
    // Add types for data and error
    queryKey: queryKey,
    queryFn: fetchExpensesData,
    placeholderData: keepPreviousData, // Keep previous data visible while loading new data
    // staleTime: 5 * 60 * 1000, // Optional: Cache data as fresh for 5 minutes
    // gcTime: 10 * 60 * 1000, // Optional: Garbage collect inactive data after 10 minutes
  });

  // Extract data, providing defaults for initial render or error states
  const expenses = data?.expenses || [];
  const pagination = data?.pagination || {};
  const categories = data?.categories || [];
  const departments = data?.departments || [];
  const vendors = data?.vendors || [];
  const approvalStatuses = data?.approvalStatuses || [];

  // Handlers using setQueryStates from nuqs
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger potential debounced search and reset page
    setQueryStates({ page: 1 });
  };

  const handleReset = () => {
    setQueryStates({
      category: "",
      department: "",
      vendor: "",
      approvalStatus: "",
      taxDeductible: "",
      startDate: null,
      endDate: null,
      search: "",
      page: 1,
      // Keep the current tab
      tab: queryStates.tab,
    });
  };

  const handlePageChange = (newPage: number) => {
    setQueryStates({ page: newPage });
  };

  const handleTabChange = (value: string) => {
    // Reset page to 1 when changing tabs and update tab state
    setQueryStates({ tab: value, page: 1 });
  };

  const handleExpenseCreated = () => {
    setIsCreateSheetOpen(false);
    // Invalidate the 'expenses' query to trigger a refetch of data
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
  };

  // Derived loading state for initial skeleton
  const showSkeleton = isLoading && !data;

  if (isError) {
    // Basic error display, consider a more user-friendly component
    return <div>Error loading expenses: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Expense Management
        </h1>
        <Button onClick={() => setIsCreateSheetOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {showSkeleton ? (
        <div className="space-y-6">
          <Skeleton className="h-[100px] w-full" /> {/* Skeleton for stats */}
          <Skeleton className="h-[50px] w-full" /> {/* Skeleton for tabs */}
          <Skeleton className="h-[250px] w-full" />{" "}
          {/* Skeleton for filter card */}
          <Skeleton className="h-[400px] w-full" /> {/* Skeleton for list */}
        </div>
      ) : (
        <>
          {/* Pass fetched expenses, potentially show loading state if needed */}
          <ExpensesStats
            expenses={expenses}
            isLoading={isFetching && expenses.length > 0}
          />

          <Tabs
            value={queryStates.tab}
            onValueChange={handleTabChange}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Expenses</TabsTrigger>
              <TabsTrigger value="recurring">Recurring Expenses</TabsTrigger>
              <TabsTrigger value="analytics">Expense Analytics</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Filters</CardTitle>
                  <CardDescription>
                    Filter expenses by various criteria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Form submit is optional if inputs update URL directly, but useful for explicit 'Apply' action */}
                  <form onSubmit={handleSearchSubmit} className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="flex-1">
                        <Input
                          placeholder="Search expenses..."
                          value={queryStates.search}
                          // Update nuqs state on change
                          onChange={(e) =>
                            setQueryStates({ search: e.target.value, page: 1 })
                          }
                          className="w-full"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* Submit button might not be needed if search updates live */}
                        {/* <Button type="submit" variant="secondary" disabled={isFetching}>
                          <FilterIcon className="mr-2 h-4 w-4" />
                          {isFetching ? 'Applying...' : 'Apply Filters'}
                        </Button> */}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleReset}
                          disabled={isFetching}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {/* Select components now use queryStates and setQueryStates */}
                      <Select
                        value={queryStates.category}
                        onValueChange={(value) =>
                          setQueryStates({
                            category: value === "all" ? "" : value,
                            page: 1,
                          })
                        }
                        disabled={isFetching}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Categories</SelectItem>{" "}
                          {/* Use "" for 'all' */}
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={queryStates.department}
                        onValueChange={(value) =>
                          setQueryStates({
                            department: value === "all" ? "" : value,
                            page: 1,
                          })
                        }
                        disabled={isFetching}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Departments</SelectItem>{" "}
                          {/* Use "" for 'all' */}
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={queryStates.vendor}
                        onValueChange={(value) =>
                          setQueryStates({
                            vendor: value === "all" ? "" : value,
                            page: 1,
                          })
                        }
                        disabled={isFetching}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Vendors" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Vendors</SelectItem>{" "}
                          {/* Use "" for 'all' */}
                          {vendors.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={queryStates.approvalStatus}
                        onValueChange={(value) =>
                          setQueryStates({
                            approvalStatus: value === "all" ? "" : value,
                            page: 1,
                          })
                        }
                        disabled={isFetching}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Approval Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">
                            All Approval Statuses
                          </SelectItem>{" "}
                          {/* Use "" for 'all' */}
                          {approvalStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={queryStates.taxDeductible} // Should be '', 'true', or 'false'
                        onValueChange={(value) =>
                          setQueryStates({
                            taxDeductible: value === "all" ? "" : value,
                            page: 1,
                          })
                        }
                        disabled={isFetching}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tax Deductible" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>{" "}
                          {/* Represent 'all' with empty string */}
                          <SelectItem value="true">Tax Deductible</SelectItem>
                          <SelectItem value="false">Non-Deductible</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* DatePickers use queryStates and setQueryStates */}
                      <DatePicker
                        date={queryStates.startDate || undefined}
                        setDate={(date) =>
                          setQueryStates({ startDate: date, page: 1 })
                        } // Pass null to clear
                        placeholder="Start Date"
                      />

                      <DatePicker
                        date={queryStates.endDate || undefined}
                        setDate={(date) =>
                          setQueryStates({ endDate: date, page: 1 })
                        } // Pass null to clear
                        placeholder="End Date"
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* These buttons might trigger separate actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" disabled={isFetching}>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export to CSV
                </Button>
                <Button variant="outline" size="sm" disabled={isFetching}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Calendar View
                </Button>
              </div>

              {/* Pass data and loading state from useQuery */}
              <TabsContent value="all" className="mt-0">
                <ExpensesList
                  expenses={expenses}
                  // Use isFetching for loading indicator within the list when data already exists
                  isLoading={isFetching}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </TabsContent>

              <TabsContent value="recurring" className="mt-0">
                {/* API handles filtering, so pass expenses directly */}
                <RecurringExpensesList
                  expenses={expenses} // Assumes API returns only recurring when tab=recurring
                  isLoading={isFetching}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                {/* Pass data directly, analytics component might have its own loading/processing */}
                <ExpenseAnalytics expenses={expenses} isLoading={isFetching} />
              </TabsContent>
            </div>
          </Tabs>
        </>
      )}

      {/* Pass necessary data and callbacks to the Create sheet */}
      <CreateExpenseSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        categories={categories}
        departments={departments}
        vendors={vendors}
        onExpenseCreated={handleExpenseCreated} // This will trigger query invalidation
      />
    </div>
  );
}
