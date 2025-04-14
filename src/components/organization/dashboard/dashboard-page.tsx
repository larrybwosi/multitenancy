"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MetricCard } from "./metric-card"
import { StaffApplicationsCard } from "./staff-applications-card"
import { PayrollSummaryCard } from "./payroll-summary-card"
import { TotalIncomeCard } from "./total-income-card"
import { PaymentVouchersCard } from "./payment-vouchers-card"
import { BudgetHistoryCard } from "./budget-history-card"
import { Users, FileText, FolderKanban, Building } from "lucide-react"

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/dashboard")
        const data = await response.json()
        setDashboardData(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        // Keep loading state true to show skeletons
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  const { metrics, applications, payroll, income, paymentVouchers, budgetHistory } = dashboardData

  return (
    <div className="space-y-6">
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
    <div className="space-y-6">
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
