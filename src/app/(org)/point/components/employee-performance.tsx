"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Command, Plus, Search, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchEmployeeData } from "@/lib/api"
import { EmployeePerformanceSkeleton } from "@/components/skeletons/employee-performance-skeleton"
import { EmployeeDetails } from "@/components/employee-details"
import { KpiPerformance } from "@/components/kpi-performance"
import { RecentActivity } from "@/components/recent-activity"
import { ProjectCompletion } from "@/components/project-completion"
import { AttendanceOverview } from "@/components/attendance-overview"
import { CartComponent } from "@/components/cart-component"
import { PaymentModal } from "@/components/payment-modal"

export function EmployeePerformance() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCart, setShowCart] = useState(false)

  const {
    data: employee,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["employee"],
    queryFn: fetchEmployeeData,
  })

  if (isLoading) return <EmployeePerformanceSkeleton />

  if (error) {
    toast.error("Failed to load employee data")
    return <div>Error loading employee data</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Dashboard</span>
            <span>/</span>
            <span>...</span>
            <span>/</span>
            <span className="text-foreground">{employee.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Command className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Insert command or search text"
              className="w-[300px] rounded-md border border-input bg-background px-9 py-2 text-sm"
            />
          </div>
          <Button variant="ghost" size="icon">
            <span className="relative">
              <span className="absolute -right-1 -top-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </span>
          </Button>
        </div>
      </div>

      {/* Title and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Employee Performance</h1>
          <p className="text-muted-foreground">Manage your employee performance and professional development</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <Avatar className="border-2 border-background">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
              <AvatarFallback>U1</AvatarFallback>
            </Avatar>
            <Avatar className="border-2 border-background">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
              <AvatarFallback>U2</AvatarFallback>
            </Avatar>
            <Avatar className="border-2 border-background">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
              <AvatarFallback>U3</AvatarFallback>
            </Avatar>
            <Avatar className="border-2 border-background">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
              <AvatarFallback>U4</AvatarFallback>
            </Avatar>
          </div>
          <Badge variant="secondary">+2</Badge>
          <Button className="ml-2">
            <Users className="h-4 w-4 mr-2" />
            Invite
          </Button>
          <Button variant="outline" onClick={() => setShowCart(!showCart)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-2"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            Cart
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              Overview
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M12 2v4" />
                <path d="M20 12h-4" />
                <path d="M12 18v4" />
                <path d="M4 12h4" />
                <path d="M16.95 7.05 14.12 9.88" />
                <path d="m14.12 14.12 2.83 2.83" />
                <path d="M7.05 16.95 9.88 14.12" />
                <path d="m9.88 9.88-2.83-2.83" />
              </svg>
              Goals
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
                <path d="m9 16 2 2 4-4" />
              </svg>
              Attendance
            </TabsTrigger>
            <TabsTrigger value="project" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M12 18v-6" />
                <path d="M8 18v-1" />
                <path d="M16 18v-3" />
              </svg>
              Project
            </TabsTrigger>
          </TabsList>
          <Button variant="outline">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Export
          </Button>
        </div>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmployeeDetails employee={employee} />
            <div className="space-y-6">
              <KpiPerformance data={employee.kpiData} />
              <RecentActivity data={employee.activityData} />
              <ProjectCompletion data={employee.projectData} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employee.goals.map((goal, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{goal.title}</h3>
                      <Badge variant={goal.status === "Completed" ? "success" : "default"}>{goal.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                    <div className="flex justify-between text-sm">
                      <span>Due date: {goal.dueDate}</span>
                      <span>Priority: {goal.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Attendance Overview</CardTitle>
              <Select defaultValue="6">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <AttendanceOverview data={employee.attendanceData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Assignments</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Assign Project
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employee.projects.map((project, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{project.name}</h3>
                      <Badge
                        variant={
                          project.status === "Completed"
                            ? "success"
                            : project.status === "In Progress"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                    <div className="flex justify-between text-sm">
                      <span>Start date: {project.startDate}</span>
                      <span>End date: {project.endDate}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${project.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg z-50 overflow-auto">
          <CartComponent
            onClose={() => setShowCart(false)}
            onCheckout={() => {
              setShowCart(false)
              setShowPaymentModal(true)
            }}
          />
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && <PaymentModal onClose={() => setShowPaymentModal(false)} />}
    </div>
  )
}
