'use client'
import { useState, useEffect } from "react"
import { PlusIcon, FilterIcon, DownloadIcon, SearchIcon, XIcon, CalendarIcon } from "lucide-react"
import { useQueryState } from 'nuqs'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { RecurringExpensesList } from "./recurring-expenses-list"
import { ExpensesNavigation } from "./expenses-navigation"

export function RecurringExpensesPage() {

  const [isLoading, setIsLoading] = useState(true)
  const [expenses, setExpenses] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>({
    page: 1,
    limit: 10,
    totalExpenses: 0,
    totalPages: 1,
  })
  const [categories, setCategories] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [vendors, setVendors] = useState<string[]>([])
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  // Replace useSearchParams with nuqs
  const [category, setCategory] = useQueryState('category', { defaultValue: '' })
  const [department, setDepartment] = useQueryState('department', { defaultValue: '' })
  const [vendor, setVendor] = useQueryState('vendor', { defaultValue: '' })
  const [frequency, setFrequency] = useQueryState('frequency', { defaultValue: '' })
  const [search, setSearch] = useQueryState('search', { defaultValue: '' })
  const [page, setPage] = useQueryState('page', { defaultValue: '1', parse: Number })

  useEffect(() => {
    fetchRecurringExpenses()
  }, [category, department, vendor, frequency, search, page])

  const fetchRecurringExpenses = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.append("category", category)
      if (department) params.append("department", department)
      if (vendor) params.append("vendor", vendor)
      if (frequency) params.append("frequency", frequency)
      if (search) params.append("search", search)
      params.append("isRecurring", "true")
      params.append("page", page.toString())
      params.append("limit", "10")

      const response = await fetch(`/api/finance/expenses?${params.toString()}`)
      const data = await response.json()


      setExpenses(data.expenses || [])
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        totalExpenses: data.length,
        totalPages: 1,
      })
      setCategories(["Rent", "Software", "Utilities"])
      setDepartments(["Operations", "IT", "Marketing"])
      setVendors(["ABC Properties", "SaaS Co", "ISP Inc"])
    } catch (error) {
      console.error("Error fetching recurring expenses:", error)
      // Initialize with empty arrays in case of error
      setExpenses([])
      setPagination({
        page: 1,
        limit: 10,
        totalExpenses: 0,
        totalPages: 1,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleReset = async () => {
    await Promise.all([
      setCategory(''),
      setDepartment(''),
      setVendor(''),
      setFrequency(''),
      setSearch(''),
      setPage(1)
    ])
  }

  const handlePageChange = async (newPage: number) => {
    await setPage(newPage)
  }

  const handleExpenseCreated = () => {
    setIsCreateSheetOpen(false)
    fetchRecurringExpenses()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (category) count++
    if (department) count++
    if (vendor) count++
    if (frequency) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  // Ensure expenses is an array before filtering
  const safeExpenses = Array.isArray(expenses) ? expenses : []

  // Calculate upcoming payments - with safety checks
  const upcomingPayments = safeExpenses
    .filter(
      (expense) =>
        expense.recurringDetails &&
        expense.recurringDetails.nextDate &&
        new Date(expense.recurringDetails.nextDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    )
    .sort((a, b) => {
      if (!a.recurringDetails?.nextDate) return 1
      if (!b.recurringDetails?.nextDate) return -1
      return new Date(a.recurringDetails.nextDate).getTime() - new Date(b.recurringDetails.nextDate).getTime()
    })
    .slice(0, 5)

  // Calculate total monthly recurring expenses - with safety checks
  const totalMonthlyRecurring = safeExpenses
    .filter((expense) => expense.recurringDetails?.frequency === "Monthly")
    .reduce((sum, expense) => sum + (expense.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Expenses</h1>
          <p className="text-muted-foreground mt-1">Manage your recurring expenses and subscriptions</p>
        </div>
        <Button onClick={() => setIsCreateSheetOpen(true)} className="sm:w-auto w-full">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Recurring Expense
        </Button>
      </div>

      <ExpensesNavigation />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Monthly Recurring</CardTitle>
                <CardDescription>Total monthly recurring expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalMonthlyRecurring)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {safeExpenses.filter((e) => e.recurringDetails?.frequency === "Monthly").length} monthly subscriptions
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Upcoming Payments</CardTitle>
                <CardDescription>Next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingPayments.length > 0 ? (
                  <ul className="space-y-2">
                    {upcomingPayments.map((expense) => (
                      <li key={expense.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {expense.recurringDetails?.nextDate
                              ? new Date(expense.recurringDetails.nextDate).toLocaleDateString()
                              : "N/A"}
                          </span>
                          <span className="ml-2">{expense.description}</span>
                        </div>
                        <span className="font-medium">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                            expense.amount || 0,
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming payments in the next 30 days</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
              <CardHeader className="bg-muted/50 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Recurring Expense Filters</CardTitle>
                    <CardDescription>Filter recurring expenses by various criteria</CardDescription>
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
                        placeholder="Search recurring expenses..."
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

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
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

                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Frequencies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Frequencies</SelectItem>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
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
                <CardTitle>Recurring Expenses</CardTitle>
                <CardDescription>
                  {pagination?.totalExpenses
                    ? `Showing ${safeExpenses.length} of ${pagination.totalExpenses} recurring expenses`
                    : "Manage all your recurring expenses and subscriptions"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <RecurringExpensesList
                  expenses={safeExpenses}
                  isLoading={isLoading}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* <CreateExpenseSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        categories={categories}
        departments={departments}
        vendors={vendors}
        onExpenseCreated={handleExpenseCreated}
      /> */}
    </div>
  )
}
