import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerAuthContext } from "@/actions/auth"

export async function GET() {
  const { organizationId } = await getServerAuthContext()
  try {
    // Get start dates
    const now = new Date()
    const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    const previousQuarterStart = new Date(currentQuarterStart)
    previousQuarterStart.setMonth(previousQuarterStart.getMonth() - 3)

    // Fetch metrics data
    const [
      organization,
      totalStaff,
      totalPrevStaff,
      totalApplications,
      totalPrevApplications,
      totalProjects,
      totalPrevProjects,
      totalDepartments,
      staffApplications,
      payrollSummary,
      incomeData,
      paymentVouchers,
      budgetHistory,
      recentActivities
    ] = await Promise.all([
      db.organization.findUnique({
        where: { id: organizationId },
        select: {
          name: true,
          logo: true,
          slug: true,
          description: true,
        }
      }),
      // Current quarter staff count
      db.member.count({
        where: {
          organizationId,
          isActive: true,
          createdAt: { gte: currentQuarterStart }
        }
      }),
      // Previous quarter staff count
      db.member.count({
        where: {
          organizationId,
          isActive: true,
          createdAt: {
            gte: previousQuarterStart,
            lt: currentQuarterStart
          }
        }
      }),
      // Current quarter applications
      db.invitation.count({
        where: {
          organizationId,
          createdAt: { gte: currentQuarterStart }
        }
      }),
      // Previous quarter applications
      db.invitation.count({
        where: {
          organizationId,
          createdAt: {
            gte: previousQuarterStart,
            lt: currentQuarterStart
          }
        }
      }),
      // Current quarter projects (using budgets as proxy)
      db.budget.count({
        where: {
          organizationId,
          createdAt: { gte: currentQuarterStart }
        }
      }),
      // Previous quarter projects
      db.budget.count({
        where: {
          organizationId,
          createdAt: {
            gte: previousQuarterStart,
            lt: currentQuarterStart
          }
        }
      }),
      // Total departments (using expense categories)
      db.expenseCategory.count({
        where: {
          organizationId,
          isActive: true
        }
      }),
      // Staff applications over time
      db.invitation.findMany({
        where: {
          organizationId,
          createdAt: { gte: previousQuarterStart }
        },
        select: {
          createdAt: true,
          status: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),
      // Payroll summary
      db.expense.groupBy({
        by: ['expenseDate'],
        where: {
          organizationId,
          category: {
            name: 'Payroll'
          },
          createdAt: { gte: previousQuarterStart }
        },
        _sum: {
          amount: true
        },
        orderBy: {
          expenseDate: 'asc'
        }
      }),
      // Total income
      db.sale.groupBy({
        by: ['saleDate'],
        where: {
          organizationId,
          createdAt: { gte: previousQuarterStart }
        },
        _sum: {
          finalAmount: true
        },
        orderBy: {
          saleDate: 'asc'
        }
      }),
      // Payment vouchers
      db.expense.findMany({
        where: {
          organizationId,
          createdAt: { gte: previousQuarterStart }
        },
        select: {
          expenseNumber: true,
          description: true,
          amount: true,
          expenseDate: true,
          status: true
        },
        orderBy: {
          expenseDate: 'desc'
        },
        take: 5
      }),
      // Budget history
      db.budget.findMany({
        where: {
          organizationId,
          isActive: true
        },
        select: {
          name: true,
          amount: true,
          amountUsed: true,
          periodStart: true,
          periodEnd: true
        },
        orderBy: {
          periodStart: 'desc'
        },
        take: 5
      }),
      // Recent activities - This is a new query
      // db.activity.findMany({
      //   where: {
      //     organizationId,
      //   },
      //   select: {
      //     id: true,
      //     type: true,
      //     description: true,
      //     createdAt: true,
      //     user: {
      //       select: {
      //         name: true,
      //         image: true
      //       }
      //     }
      //   },
      //   orderBy: {
      //     createdAt: 'desc'
      //   },
      //   take: 5
      // }).catch(() => {
        // If the activity table doesn't exist, return an empty array
        // This makes the enhancement backward compatible
        []
      // })
    ])

    // Calculate financial metrics
    const totalIncome = incomeData.reduce((sum, item) => sum + Number(item._sum.finalAmount), 0)
    const totalExpenses = payrollSummary.reduce((sum, item) => sum + Number(item._sum.amount), 0) + 
                         paymentVouchers.reduce((sum, item) => sum + Number(item.amount), 0)
    const cashFlow = totalIncome - totalExpenses

    // Calculate growth percentages
    const staffGrowth = totalPrevStaff > 0 
      ? ((totalStaff - totalPrevStaff) / totalPrevStaff) * 100 
      : 0

    const applicationsGrowth = totalPrevApplications > 0
      ? ((totalApplications - totalPrevApplications) / totalPrevApplications) * 100
      : 0

    const projectsGrowth = totalPrevProjects > 0
      ? ((totalProjects - totalPrevProjects) / totalPrevProjects) * 100
      : 0

    // Format recent activities if they exist
    const formattedActivities = recentActivities.length > 0 ? recentActivities.map(activity => ({
      id: activity.id,
      type: activity.type || 'general',
      description: activity.description,
      createdAt: activity.createdAt.toISOString(),
      user: {
        name: activity.user?.name || 'System',
        avatar: activity.user?.image || null
      }
    })) : null

    return NextResponse.json({
      organization: {
        name: organization?.name,
        logo: organization?.logo,
        description: organization?.description,
        slug: organization?.slug,
      },
      metrics: {
        totalStaff,
        staffGrowth: Math.round(staffGrowth),
        totalApplications,
        applicationsGrowth: Math.round(applicationsGrowth),
        totalProjects,
        projectsGrowth: Math.round(projectsGrowth),
        totalDepartments,
        totalIncome,
        totalExpenses,
        cashFlow
      },
      applications: staffApplications,
      payroll: {
        summary: payrollSummary,
      },
      income: incomeData,
      paymentVouchers,
      budgetHistory,
      recentActivities: formattedActivities
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
