"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Define the Expense interface
interface Expense {
  id: string
  date: string
  amount: number
  category: string
  department: string
  description: string
  status: string
}

interface ExpenseAnalyticsProps {
  expenses: Expense[]
  activeTab: string
  timeframe: string
}

export function ExpenseAnalytics({ expenses, activeTab, timeframe }: ExpenseAnalyticsProps) {
  // Simple comment to reference that we're using these props
  console.log(`Rendering expense analytics for ${activeTab} with ${timeframe} timeframe`);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc: Record<string, number>, expense) => {
    const category = expense.category
    if (!acc[category]) {
      acc[category] = 0
    }
    acc[category] += expense.amount
    return acc
  }, {})

  const categoryData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value)

  // Group expenses by department
  const expensesByDepartment = expenses.reduce((acc: Record<string, number>, expense) => {
    const department = expense.department
    if (!acc[department]) {
      acc[department] = 0
    }
    acc[department] += expense.amount
    return acc
  }, {})

  const departmentData = Object.entries(expensesByDepartment)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value)

  // Group expenses by month for trend analysis
  const expensesByMonth: Record<string, number> = {}
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  expenses.forEach((expense) => {
    const date = new Date(expense.date)
    const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`

    if (!expensesByMonth[monthKey]) {
      expensesByMonth[monthKey] = 0
    }
    expensesByMonth[monthKey] += expense.amount
  })

  // Convert to array and sort by date
  const trendData = Object.entries(expensesByMonth)
    .map(([month, amount]) => ({
      month,
      amount,
    }))
    .sort((a, b) => {
      const [aMonth, aYear] = a.month.split(" ")
      const [bMonth, bYear] = b.month.split(" ")

      if (aYear !== bYear) {
        return Number.parseInt(aYear) - Number.parseInt(bYear)
      }

      return months.indexOf(aMonth) - months.indexOf(bMonth)
    })

  // Mock data for year-over-year comparison
  const yearOverYearData = [
    { month: "Jan", current: 12500, previous: 10200 },
    { month: "Feb", current: 13200, previous: 11000 },
    { month: "Mar", current: 14100, previous: 12500 },
    { month: "Apr", current: 12800, previous: 11800 },
    { month: "May", current: 13500, previous: 12200 },
    { month: "Jun", current: 15200, previous: 13100 },
    { month: "Jul", current: 14800, previous: 13500 },
    { month: "Aug", current: 15500, previous: 14200 },
    { month: "Sep", current: 16200, previous: 14800 },
    { month: "Oct", current: 15800, previous: 14500 },
    { month: "Nov", current: 16500, previous: 15200 },
    { month: "Dec", current: 17200, previous: 15800 },
  ]

  // Colors for pie charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FFC658",
    "#8DD1E1",
    "#A4DE6C",
    "#D0ED57",
  ]

  return (
    <>
      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Expense Trend</CardTitle>
              <CardDescription>Monthly expense trend over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Area type="monotone" dataKey="amount" stroke="#8884d8" fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Top Expense Categories</CardTitle>
              <CardDescription>Distribution of expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Year-over-Year Comparison</CardTitle>
            <CardDescription>Compare current year expenses with previous year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearOverYearData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="current" name="Current Year" fill="#8884d8" />
                <Bar dataKey="previous" name="Previous Year" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="categories" className="space-y-6">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Detailed breakdown of expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatCurrency} />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>Percentage breakdown of expense categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Category Trends</CardTitle>
              <CardDescription>How expense categories change over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={[
                    { month: "Jan", Payroll: 15000, Rent: 8000, Utilities: 3000, Marketing: 5000 },
                    { month: "Feb", Payroll: 15500, Rent: 8000, Utilities: 3200, Marketing: 6000 },
                    { month: "Mar", Payroll: 16000, Rent: 8000, Utilities: 3100, Marketing: 7000 },
                    { month: "Apr", Payroll: 15800, Rent: 8000, Utilities: 3300, Marketing: 4500 },
                    { month: "May", Payroll: 16200, Rent: 8500, Utilities: 3400, Marketing: 5500 },
                    { month: "Jun", Payroll: 16500, Rent: 8500, Utilities: 3600, Marketing: 6500 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="Payroll" stroke="#8884d8" />
                  <Line type="monotone" dataKey="Rent" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="Utilities" stroke="#ffc658" />
                  <Line type="monotone" dataKey="Marketing" stroke="#ff8042" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="departments" className="space-y-6">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Expenses by Department</CardTitle>
            <CardDescription>Detailed breakdown of expenses by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={departmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatCurrency} />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
              <CardDescription>Percentage breakdown of department expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Department Budget Utilization</CardTitle>
              <CardDescription>Actual expenses vs. budget by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: "Administration", actual: 45000, budget: 50000 },
                    { name: "Sales", actual: 38000, budget: 35000 },
                    { name: "Marketing", actual: 32000, budget: 30000 },
                    { name: "Operations", actual: 52000, budget: 55000 },
                    { name: "IT", actual: 28000, budget: 30000 },
                    { name: "HR", actual: 22000, budget: 25000 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="actual" name="Actual" fill="#8884d8" />
                  <Bar dataKey="budget" name="Budget" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="trends" className="space-y-6">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Monthly Expense Trend</CardTitle>
            <CardDescription>How expenses have changed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Line type="monotone" dataKey="amount" name="Expenses" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Expense Growth Rate</CardTitle>
              <CardDescription>Month-over-month expense growth rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { month: "Jan", rate: 0 },
                    { month: "Feb", rate: 5.2 },
                    { month: "Mar", rate: 3.8 },
                    { month: "Apr", rate: -1.5 },
                    { month: "May", rate: 4.2 },
                    { month: "Jun", rate: 6.1 },
                    { month: "Jul", rate: 2.3 },
                    { month: "Aug", rate: 3.5 },
                    { month: "Sep", rate: 1.8 },
                    { month: "Oct", rate: -0.5 },
                    { month: "Nov", rate: 3.2 },
                    { month: "Dec", rate: 4.5 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="rate" name="Growth Rate" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Recurring vs. One-time Expenses</CardTitle>
              <CardDescription>Comparison of recurring and one-time expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={[
                    { month: "Jan", recurring: 12000, oneTime: 8000 },
                    { month: "Feb", recurring: 12500, oneTime: 10000 },
                    { month: "Mar", recurring: 13000, oneTime: 7500 },
                    { month: "Apr", recurring: 13200, oneTime: 5000 },
                    { month: "May", recurring: 13500, oneTime: 9000 },
                    { month: "Jun", recurring: 14000, oneTime: 11000 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="recurring"
                    name="Recurring"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                  />
                  <Area type="monotone" dataKey="oneTime" name="One-time" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </>
  )
}
