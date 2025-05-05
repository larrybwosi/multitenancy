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
import { Users, FileText, FolderKanban, Building } from "lucide-react"
import { ExpenseStatus, InvitationStatus } from "@/prisma/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "@/lib/auth/authClient"

interface DashboardData {
  organization: {
    name: string
    logo: string | null
    type: string
    role: string
  }
  metrics: {
    totalStaff: number
    staffGrowth: number
    totalApplications: number
    applicationsGrowth: number
    totalProjects: number
    projectsGrowth: number
    totalDepartments: number
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
    return <div>Error loading dashboard data</div>
  }

  const { organization, metrics, applications, payroll, income, paymentVouchers, budgetHistory } = dashboardData!

  return (
    <div className="space-y-6 container px-6 mx-auto py-10">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {organization.logo ? (
                <AvatarImage src={organization.logo} alt={organization.name} />
              ) : (
                <AvatarFallback>
                  {organization.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
              {/* <p className="text-gray-500">{organization.type}</p> */}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full">
              {session?.user.role === "ADMIN" ? "Admin" : "User"}
            </span>
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 pt-4 border-t">
          <p className="text-muted-foreground">
            Here&apos;s an overview of your organization&apos;s metrics and activities
          </p>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total number of staff"
          value={metrics.totalStaff}
          change={metrics.staffGrowth}
          changeText={`${metrics.staffGrowth}% more than last quarter`}
          icon={<Users className="h-6 w-6 text-white" />}
          iconBg="bg-orange-500"
        />

        <MetricCard
          title="Total application"
          value={metrics.totalApplications}
          change={metrics.applicationsGrowth}
          changeText={`${metrics.applicationsGrowth}% more than last quarter`}
          icon={<FileText className="h-6 w-6 text-white" />}
          iconBg="bg-red-500"
        />

        <MetricCard
          title="Total projects"
          value={metrics.totalProjects}
          change={metrics.projectsGrowth}
          changeText={`${metrics.projectsGrowth}% more than last quarter`}
          icon={<FolderKanban className="h-6 w-6 text-white" />}
          iconBg="bg-purple-500"
        />

        <MetricCard
          title="Total departments"
          value={metrics.totalDepartments}
          change={0}
          changeText="Without changes"
          icon={<Building className="h-6 w-6 text-white" />}
          iconBg="bg-blue-500"
          changeType="neutral"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StaffApplicationsCard data={applications} />
        <PayrollSummaryCard data={payroll.summary} />
        <TotalIncomeCard data={income} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PaymentVouchersCard data={paymentVouchers} />
        <BudgetHistoryCard data={budgetHistory} />
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 container px-6 mx-auto py-10">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="grid w-full grid-cols-1 gap-4 pt-4 border-t">
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Top metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-[200px] w-full rounded-md" />
          </Card>
        ))}
      </div>
    </div>
  )
}