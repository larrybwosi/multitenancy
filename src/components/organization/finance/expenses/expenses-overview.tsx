"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PlusIcon, FilterIcon, DownloadIcon, SearchIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ExpensesList } from "./expenses-list"
import { ExpensesStats } from "./expenses-stats"
import { CreateExpenseSheet } from "./create-expense-sheet"
import { ExpensesNavigation } from "./expenses-navigation"

export function ExpensesOverview() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(true)
  const [expenses, setExpenses] = useState<any[]>([]) // Initialize as empty array
  const [pagination, setPagination] = useState<any>({})
  const [categories, setCategories] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [vendors, setVendors] = useState<string[]>([])
  const [approvalStatuses, setApprovalStatuses] = useState<string[]>([])
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  // Filter states
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [department, setDepartment] = useState(searchParams.get("department") || "")
  const [vendor, setVendor] = useState(searchParams.get("vendor") || "")
  const [approvalStatus, setApprovalStatus] = useState(searchParams.get("approvalStatus") || "")
  const [taxDeductible, setTaxDeductible] = useState(searchParams.get("taxDeductible") || "")
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? new Date(searchParams.get("startDate") as string) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate") as string) : undefined,
  )
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [page, setPage] = useState(Number.parseInt(searchParams.get("page") || "1"))

  useEffect(() => {
    fetchExpenses()
  }, [category, department, vendor, approvalStatus, taxDeductible, startDate, endDate, search, page])

  const fetchExpenses = async () => {
    setIsLoading(true)
    try {
      // For demo purposes, let's use mock data
      // In a real application, you would fetch from your API
      setTimeout(() => {
        const mockExpenses = [
          {
            id: "1",
            description: "Office Supplies",
            amount: 250.75,
            date: "2023-05-15",
            category: "Office Supplies",
            paymentMethod: "Credit Card",
            status: "Paid",
            vendor: "Office Depot",
            isRecurring: false,
            taxDeductible: true,
            department: "Administration",
            createdBy: { name: "John Doe" },
          },
          {
            id: "2",
            description: "Software Subscription",
            amount: 99.99,
            date: "2023-05-10",
            category: "Software",
            paymentMethod: "Credit Card",
            status: "Paid",
            vendor: "Adobe",
            isRecurring: true,
            recurringFrequency: "Monthly",
            taxDeductible: true,
            department: "IT",
            createdBy: { name: "Jane Smith" },
          },
          {
            id: "3",
            description: "Client Lunch",
            amount: 125.5,
            date: "2023-05-08",
            category: "Meals & Entertainment",
            paymentMethod: "Corporate Card",
            status: "Pending",
            vendor: "Restaurant XYZ",
            isRecurring: false,
            taxDeductible: true,
            department: "Sales",
            createdBy: { name: "Mike Johnson" },
          },
          {
            id: "4",
            description: "Office Rent",
            amount: 2500.0,
            date: "2023-05-01",
            category: "Rent",
            paymentMethod: "Bank Transfer",
            status: "Paid",
            vendor: "ABC Properties",
            isRecurring: true,
            recurringFrequency: "Monthly",
            taxDeductible: true,
            department: "Administration",
            createdBy: { name: "John Doe" },
          },
        ]

        setExpenses(mockExpenses)
        setPagination({
          totalExpenses: mockExpenses.length,
          totalPages: 1,
          currentPage: 1,
        })
        setCategories(["Office Supplies", "Software", "Meals & Entertainment", "Rent"])
        setDepartments(["Administration", "IT", "Sales"])
        setVendors(["Office Depot", "Adobe", "Restaurant XYZ", "ABC Properties"])
        setApprovalStatuses(["Approved", "Pending", "Rejected"])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error fetching expenses:", error)
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    updateQueryParams()
  }

  const handleReset = () => {
    setCategory("")
    setDepartment("")
    setVendor("")
    setApprovalStatus("")
    setTaxDeductible("")
    setStartDate(undefined)
    setEndDate(undefined)
    setSearch("")
    setPage(1)
    router.push(`/finance/expenses`)
  }

  const updateQueryParams = () => {
    const params = new URLSearchParams()
    if (category) params.append("category", category)
    if (department) params.append("department", department)
    if (vendor) params.append("vendor", vendor)
    if (approvalStatus) params.append("approvalStatus", approvalStatus)
    if (taxDeductible) params.append("taxDeductible", taxDeductible)
    if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])
    if (endDate) params.append("endDate", endDate.toISOString().split("T")[0])
    if (search) params.append("search", search)
    params.append("page", page.toString())

    router.push(`/finance/expenses?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    updateQueryParams()
  }

  const handleExpenseCreated = () => {
    setIsCreateSheetOpen(false)
    fetchExpenses()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (category) count++
    if (department) count++
    if (vendor) count++
    if (approvalStatus) count++
    if (taxDeductible) count++
    if (startDate) count++
    if (endDate) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground mt-1">Track, manage, and analyze your organization&lsquo;s expenses</p>
        </div>
        <Button onClick={() => setIsCreateSheetOpen(true)} className="sm:w-auto w-full">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <ExpensesNavigation />

      {isLoading && !expenses.length ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          <ExpensesStats expenses={expenses} />

          <div className="space-y-4">
            <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
              <CardHeader className="bg-muted/50 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Expense Filters</CardTitle>
                    <CardDescription>Filter expenses by various criteria</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                      className="w-full sm:w-auto"
                    >
                      <FilterIcon className="mr-2 h-4 w-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleReset} className="w-full sm:w-auto">
                        <XIcon className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent
                className={`transition-all duration-300 ${isFilterExpanded ? "py-4" : "py-0 h-0 overflow-hidden"}`}
              >
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1 relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search expenses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                        Apply Filters
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={vendor} onValueChange={setVendor}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Vendors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Vendors</SelectItem>
                        {vendors.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={approvalStatus} onValueChange={setApprovalStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Approval Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Approval Statuses</SelectItem>
                        {approvalStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={taxDeductible} onValueChange={setTaxDeductible}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tax Deductible" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Tax Deductible</SelectItem>
                        <SelectItem value="false">Non-Deductible</SelectItem>
                      </SelectContent>
                    </Select>

                    <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />

                    <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" />
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="transition-all hover:bg-muted">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            </div>

            <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
              <CardHeader className="bg-muted/50 pb-3">
                <CardTitle>All Expenses</CardTitle>
                <CardDescription>
                  {pagination?.totalExpenses
                    ? `Showing ${expenses.length} of ${pagination.totalExpenses} expenses`
                    : "Manage all your organization expenses"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ExpensesList
                  expenses={expenses}
                  isLoading={isLoading}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <CreateExpenseSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        categories={categories}
        departments={departments}
        vendors={vendors}
        onExpenseCreated={handleExpenseCreated}
      />
    </div>
  )
}
