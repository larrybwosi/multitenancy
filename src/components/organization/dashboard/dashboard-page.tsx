"use client"

import { useQuery } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MetricCard } from "./metric-card"
import { StaffApplicationsCard } from "./staff-applications-card"
import { PayrollSummaryCard } from "./payroll-summary-card"
import { TotalIncomeCard } from "./total-income-card"
import { PaymentVouchersCard } from "./payment-vouchers-card"
import { BudgetHistoryCard } from "./budget-history-card"
import { Users, FileText, FolderKanban, Building, TrendingUp, AlertTriangle, Award, BarChart3 } from "lucide-react"
import { ExpenseStatus, InvitationStatus } from "@/prisma/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "@/lib/auth/authClient"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface DashboardData {
  organization: {
    name: string
    logo: string | null
    type: string
    role: string
    description: string | null
    slug: string | null
  }
  metrics: {
    totalStaff: number
    staffGrowth: number
    totalApplications: number
    applicationsGrowth: number
    totalProjects: number
    projectsGrowth: number
    totalDepartments: number
    totalIncome?: number
    totalExpenses?: number
    cashFlow?: number
  }
  applications: Array<{
    createdAt: string
    status: InvitationStatus
  }>
  payroll: {
    summary: Array<{
      expenseDate: string
      _sum: {
        amount: number
      }
    }>
  }
  income: Array<{
    saleDate: string
    _sum: {
      finalAmount: number
    }
  }>
  paymentVouchers: Array<{
    expenseNumber: string
    description: string
    amount: number
    expenseDate: string
    status: ExpenseStatus
  }>
  budgetHistory: Array<{
    name: string
    amount: number
    amountUsed: number
    periodStart: string
    periodEnd: string
  }>
  recentActivities?: Array<{
    id: string
    type: string
    description: string
    createdAt: string
    user: {
      name: string
      avatar?: string
    }
  }>
}

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard")
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export function DashboardPage() {
  const { data: session } = useSession()
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 2 * 60 * 1000, // Cache data for 2 minutes
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    console.error("Error fetching dashboard data:", error)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">There was a problem fetching your dashboard data. Please try again later.</p>
        </div>
      </div>
    )
  }

  const { organization, metrics, applications, payroll, income, paymentVouchers, budgetHistory, recentActivities } = dashboardData!

  // Calculate financial summary
  const totalIncome = income.reduce((sum, entry) => sum + entry._sum.finalAmount, 0)
  const totalExpenses = payroll.summary.reduce((sum, entry) => sum + entry._sum.amount, 0) + 
                        paymentVouchers.reduce((sum, entry) => sum + entry.amount, 0)
  const cashFlow = totalIncome - totalExpenses

  // Prepare data for the overall budget progress
  const totalBudget = budgetHistory.reduce((sum, budget) => sum + budget.amount, 0)
  const totalUsed = budgetHistory.reduce((sum, budget) => sum + budget.amountUsed, 0)
  const budgetProgress = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0

  return (
    <div className="space-y-6 container px-6 mx-auto py-10">
      {/* Header with organization info */}
      <div className="flex flex-col gap-4 mb-8 bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              {organization.logo ? (
                <AvatarImage src={organization.logo} alt={organization.name} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {organization.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
                <Badge variant="outline" className="ml-2 border-primary/40 bg-primary/5">
                  {organization.slug || "Organization"}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {organization.description || "Welcome to your organization's dashboard. Here you can manage all aspects of your organization."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="px-3 py-1.5 text-sm bg-primary/80 hover:bg-primary">
              {session?.user.role === "ADMIN" ? "Administrator" : "User"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <Card className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-0 shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Financial Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Total Income</p>
              <h3 className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
              <h3 className="text-2xl font-bold text-red-500">${totalExpenses.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">Net Cash Flow</p>
              <h3 className={`text-2xl font-bold ${cashFlow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                ${Math.abs(cashFlow).toLocaleString()}
                <span className="text-sm ml-1">{cashFlow >= 0 ? 'surplus' : 'deficit'}</span>
              </h3>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Overall Budget Utilization</p>
            <div className="flex items-center gap-4">
              <Progress value={budgetProgress} className="h-2" />
              <span className="text-sm font-medium">{Math.round(budgetProgress)}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="staff">Staff & Projects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* Top metrics - Overview Tab */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Staff"
              value={metrics.totalStaff}
              change={metrics.staffGrowth}
              changeText={`${metrics.staffGrowth}% from last quarter`}
              icon={<Users className="h-6 w-6 text-white" />}
              iconBg="bg-indigo-500"
            />

            <MetricCard
              title="Applications"
              value={metrics.totalApplications}
              change={metrics.applicationsGrowth}
              changeText={`${metrics.applicationsGrowth}% from last quarter`}
              icon={<FileText className="h-6 w-6 text-white" />}
              iconBg="bg-emerald-500"
            />

            <MetricCard
              title="Active Projects"
              value={metrics.totalProjects}
              change={metrics.projectsGrowth}
              changeText={`${metrics.projectsGrowth}% from last quarter`}
              icon={<FolderKanban className="h-6 w-6 text-white" />}
              iconBg="bg-amber-500"
            />

            <MetricCard
              title="Departments"
              value={metrics.totalDepartments}
              change={0}
              changeText="No change"
              icon={<Building className="h-6 w-6 text-white" />}
              iconBg="bg-blue-500"
              changeType="neutral"
            />
          </div>

          {/* Middle row - Overview Tab */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <StaffApplicationsCard data={applications} />
            <PayrollSummaryCard data={payroll.summary} />
            <TotalIncomeCard data={income} />
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 mb-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Recent Activities
              </h3>
              <div className="space-y-4">
                {recentActivities ? (
                  recentActivities.map((activity, i) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Avatar className="h-8 w-8">
                        {activity.user.avatar ? (
                          <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                        ) : (
                          <AvatarFallback>{activity.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={
                        activity.type === 'finance' ? 'default' :
                        activity.type === 'staff' ? 'secondary' :
                        'outline'
                      }>
                        {activity.type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">Activities will appear here as they occur</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial">
          {/* Financial Tab */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <PaymentVouchersCard data={paymentVouchers} />
            <BudgetHistoryCard data={budgetHistory} />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-primary" />
                Budget Allocation by Department
              </h3>
              <div className="space-y-4">
                {budgetHistory.map((budget, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium">{budget.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${budget.amountUsed.toLocaleString()} / ${budget.amount.toLocaleString()}
                            </p>
                          </div>
                          <Progress 
                            value={(budget.amountUsed / budget.amount) * 100} 
                            className={cn(
                              "h-2",
                              (budget.amountUsed / budget.amount) > 0.9 ? "bg-red-200" : ""
                            )}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Period: {new Date(budget.periodStart).toLocaleDateString()} - {new Date(budget.periodEnd).toLocaleDateString()}</p>
                        <p>Utilization: {Math.round((budget.amountUsed / budget.amount) * 100)}%</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          {/* Staff & Projects Tab */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Staff Overview
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{metrics.totalStaff}</p>
                    <p className="text-sm text-muted-foreground">Total Staff Members</p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Users className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Staff Growth</p>
                  <div className="flex items-center gap-2">
                    <Progress value={metrics.staffGrowth > 0 ? metrics.staffGrowth : 0} className="h-2" />
                    <span className="text-sm">
                      {metrics.staffGrowth > 0 ? `+${metrics.staffGrowth}%` : `${metrics.staffGrowth}%`}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FolderKanban className="h-5 w-5 mr-2 text-primary" />
                Projects Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{metrics.totalProjects}</p>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                    <FolderKanban className="h-8 w-8 text-amber-600 dark:text-amber-300" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Project Growth</p>
                  <div className="flex items-center gap-2">
                    <Progress value={metrics.projectsGrowth > 0 ? metrics.projectsGrowth : 0} className="h-2" />
                    <span className="text-sm">
                      {metrics.projectsGrowth > 0 ? `+${metrics.projectsGrowth}%` : `${metrics.projectsGrowth}%`}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <StaffApplicationsCard data={applications} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 container px-6 mx-auto py-10">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 mb-8 bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>

      {/* Financial Summary skeleton */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <Card className="p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-2 w-full" />
          </div>
        </Card>
      </div>

      {/* Tabs skeleton */}
      <div className="mb-6">
        <Skeleton className="h-10 w-72 mb-4" />
        
        {/* Top metrics skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex justify-between">
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </Card>
          ))}
        </div>

        {/* Middle row skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="h-[200px] w-full rounded-md" />
            </Card>
          ))}
        </div>

        {/* Activity skeleton */}
        <div className="grid grid-cols-1 mb-6">
          <Card className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}