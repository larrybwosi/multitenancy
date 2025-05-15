'use client'
import { use, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { 
  Edit, 
  Trash2, 
  UserPlus,
  AlertCircle,
  DollarSign, 
  ChevronRight, 
  MoreHorizontal,
  Check,
  X,
  Calendar,
  FileText,
  Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { DepartmentDetails, useGetFullDepartment, useRemoveDepartmentMember, useUpdateDepartmentMember } from '@/lib/hooks/use-departments';
import { DepartmentMemberRole } from '@/prisma/client';
import { formatCurrency } from '@/lib/utils';

// Member Role Management Modal Component
const MemberRoleModal = ({ 
  isOpen, 
  onClose, 
  member, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  member: DepartmentDetails['members'][0] | null;
  onSave: (updatedMember: Partial<DepartmentDetails['members'][0]>) => void;
}) => {
  const [role, setRole] = useState(member?.role || '');
  const [canApproveExpenses, setCanApproveExpenses] = useState(member?.canApproveExpenses || false);
  const [canManageBudget, setCanManageBudget] = useState(member?.canManageBudget || false);

  const handleSave = () => {
    onSave({
      id: member?.id,
      role,
      canApproveExpenses,
      canManageBudget
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{member?.userName?.[0] || member?.userEmail[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{member?.userName || 'Unknown'}</p>
              <p className="text-sm text-gray-500">{member?.userEmail}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <input 
              type="text" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="approveExpenses" 
              checked={canApproveExpenses} 
              onChange={() => setCanApproveExpenses(!canApproveExpenses)}
              className="rounded border-gray-300"
            />
            <label htmlFor="approveExpenses" className="text-sm">Can approve expenses</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="manageBudget" 
              checked={canManageBudget} 
              onChange={() => setCanManageBudget(!canManageBudget)}
              className="rounded border-gray-300"
            />
            <label htmlFor="manageBudget" className="text-sm">Can manage budget</label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Workflow Modal Component
const WorkflowModal = ({
  isOpen,
  onClose,
  workflow,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  workflow: DepartmentDetails['workflows'][0] | null;
  onSave: (updatedWorkflow: Partial<DepartmentDetails['workflows'][0]>) => void;
}) => {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [isActive, setIsActive] = useState(workflow?.isActive || false);
  const [isDefault, setIsDefault] = useState(workflow?.isDefault || false);

  const handleSave = () => {
    onSave({
      id: workflow?.id,
      name,
      description,
      isActive,
      isDefault
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{workflow ? 'Edit Workflow' : 'Add Workflow'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea 
              value={description || ''} 
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-24"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="isActive" 
              checked={isActive} 
              onChange={() => setIsActive(!isActive)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="isDefault" 
              checked={isDefault} 
              onChange={() => setIsDefault(!isDefault)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isDefault" className="text-sm">Default workflow</label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Loading skeleton component
const DepartmentSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="relative w-full h-48 rounded-xl bg-gray-200 animate-pulse">
        <div className="absolute -bottom-12 left-8">
          <div className="w-24 h-24 rounded-full bg-gray-300 border-4 border-white"></div>
        </div>
      </div>
      
      <div className="pt-16 px-8 space-y-4">
        <div className="h-8 bg-gray-200 w-1/3 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 w-1/2 rounded animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-lg bg-gray-100 p-4 animate-pulse">
            <div className="h-6 bg-gray-200 w-1/2 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 w-full rounded mb-2"></div>
            <div className="h-4 bg-gray-200 w-3/4 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

type Params = Promise<{ id: string }>;
export default function DepartmentPage(props: { params: Params }) {
  const params = use(props.params);
  const { data: department, isLoading: loading, error } = useGetFullDepartment(params.id);
  const { mutateAsync: updateMember, isPending: updating} = useUpdateDepartmentMember()
  const { mutateAsync: removeMember, isPending: removingMember } = useRemoveDepartmentMember();
  
  // For modals and editing states
  const [editingMember, setEditingMember] = useState<DepartmentDetails['members'][0] | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<DepartmentDetails['workflows'][0] | null>(null);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Handle member role updates
  const handleMemberUpdate = async(updatedMember: DepartmentDetails['members'][0]) => {
    if (!department || updatedMember.id) return;
    await updateMember({
      departmentId: params.id,
      memberId: updatedMember.id,
      updates: {
        ...updatedMember,
        role: updatedMember.role as DepartmentMemberRole
      },
    });
  };

  // Handle member deletion
  const handleDeleteMember = async(memberId: string) => {
    if (!department) return;
    
    if (window.confirm("Are you sure you want to remove this member from the department?")) {
      await removeMember({
        departmentId: params.id,
        memberId
      })
      console.log("Deleted member:", memberId);
    }
  };

  // Handle workflow updates
  const handleWorkflowUpdate = (updatedWorkflow: Partial<DepartmentDetails['workflows'][0]>) => {
    if (!department) return;
    
    let updatedWorkflows;
    
    if (!updatedWorkflow.id) {
      // Adding a new workflow
      const newWorkflow = {
        id: `wf${Date.now()}`, // Generate temporary ID
        name: updatedWorkflow.name || 'New Workflow',
        description: updatedWorkflow.description || null,
        isActive: updatedWorkflow.isActive || false,
        isDefault: updatedWorkflow.isDefault || false
      };
      
      updatedWorkflows = [...department.workflows, newWorkflow];
    } else {
      // Updating existing workflow
      updatedWorkflows = department.workflows.map(workflow => 
        workflow.id === updatedWorkflow.id 
          ? { ...workflow, ...updatedWorkflow } 
          : workflow
      );
    }
    
    // Here you would typically call an API to update the workflow
    console.log("Updated workflow:", updatedWorkflow);
  };

  // Handle workflow deletion
  const handleDeleteWorkflow = (workflowId: string) => {
    if (!department) return;
    
    if (window.confirm("Are you sure you want to delete this workflow?")) {
      
      
      // Here you would typically call an API to delete the workflow
      console.log("Deleted workflow:", workflowId);
    }
  };
  

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // If loading, show skeleton
  if (loading) {
    return <DepartmentSkeleton />;
  }

  // If error, show error message
  if (error || !department) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.message || "Failed to load department data. Please try again."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Department Header with Banner */}
      <div className="relative">
        <div className="h-48 w-full bg-gradient-to-r from-blue-500 to-purple-600 overflow-hidden">
          {department.banner && (
            <div className="absolute inset-0">
              <Image
                src={department.banner}
                alt={`${department.name} banner`}
                fill
                className="object-cover opacity-70"
              />
            </div>
          )}
        </div>

        {/* Department Logo/Avatar */}
        <div className="absolute -bottom-12 left-8">
          <Avatar className="h-24 w-24 border-4 border-white">
            {department.image ? (
              <AvatarImage src={department.image} alt={department.name} />
            ) : (
              <AvatarFallback className="bg-blue-600 text-white text-2xl">{department.name.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
        </div>
      </div>

      {/* Department Info */}
      <div className="pt-16 px-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{department.name}</h1>
            {department.description && <p className="text-gray-600 mt-1 max-w-2xl">{department.description}</p>}
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <span>Created {formatDate(department.createdAt)}</span>
              <span className="mx-2">•</span>
              <span>Last updated {formatDate(department.updatedAt)}</span>
            </div>
          </div>

          <Button>
            <Edit className="h-4 w-4 mr-2" /> Edit Department
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="mt-8 px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-4 md:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Department Head Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Department Head</CardTitle>
                </CardHeader>
                <CardContent>
                  {department.head ? (
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>{department.head.userName?.[0] || department.head.userEmail[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{department.head.userName || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{department.head.userEmail}</p>
                        <Badge variant="outline" className="mt-1">
                          {department.head.role}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">No department head assigned</div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-4 w-4 mr-2" /> Change Head
                  </Button>
                </CardFooter>
              </Card>

              {/* Active Budget Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Active Budget</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {department.activeBudget ? (
                    <>
                      <div>
                        <h3 className="font-medium">{department.activeBudget.name}</h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(department.activeBudget.periodStart)} -{' '}
                          {formatDate(department.activeBudget.periodEnd)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Budget Used</span>
                          <span className="font-medium">
                            {formatCurrency(department.activeBudget.amountUsed)} /{' '}
                            {formatCurrency(department.activeBudget.amount)}
                          </span>
                        </div>
                        <Progress value={(department.activeBudget.amountUsed / department.activeBudget.amount) * 100} />
                      </div>
                      <div className="pt-2">
                        <p className="text-sm font-medium">
                          Remaining: {formatCurrency(department.activeBudget.amountRemaining)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 italic">No active budget</div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" /> Manage Budget
                  </Button>
                </CardFooter>
              </Card>

              {/* Active Workflows Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {department.workflows.filter(w => w.isActive).length > 0 ? (
                      department.workflows
                        .filter(w => w.isActive)
                        .slice(0, 3)
                        .map(workflow => (
                          <div key={workflow.id} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{workflow.name}</p>
                              {workflow.isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">No active workflows</div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('workflows')}>
                    <FileText className="h-4 w-4 mr-2" /> All Workflows
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Stats and Team Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>{department.members.length} members in this department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {department.members.slice(0, 5).map(member => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{member.userName?.[0] || member.userEmail[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.userName || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          {member.canApproveExpenses && (
                            <Badge variant="secondary" className="text-xs">
                              Approve Expenses
                            </Badge>
                          )}
                          {member.canManageBudget && (
                            <Badge variant="secondary" className="text-xs">
                              Manage Budget
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}

                    {department.members.length > 5 && (
                      <Button variant="ghost" className="w-full text-gray-500" onClick={() => setActiveTab('members')}>
                        View all {department.members.length} members
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Fields Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {department.customFields &&
                      Object.entries(department.customFields).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 gap-2">
                          <p className="text-sm font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                          <p className="text-sm text-right">{value as string}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Department Members</CardTitle>
                    <CardDescription>Manage roles and permissions for department members</CardDescription>
                  </div>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" /> Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {department.members.map(member => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>{member.userName?.[0] || member.userEmail[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.userName || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{member.userEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>{formatDate(member.joinedAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {member.canApproveExpenses && (
                              <Badge variant="outline" className="text-xs">
                                Approve Expenses
                              </Badge>
                            )}
                            {member.canManageBudget && (
                              <Badge variant="outline" className="text-xs">
                                Manage Budget
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingMember(member);
                                  setIsMemberModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteMember(member.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Department Budgets</CardTitle>
                    <CardDescription>Manage financial budgets for the department</CardDescription>
                  </div>
                  <Button>
                    <DollarSign className="h-4 w-4 mr-2" /> Add Budget
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Active Budget Section */}
                {department.activeBudget && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium mb-4">Active Budget</h3>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-xl">{department.activeBudget.name}</h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(department.activeBudget.periodStart)} -{' '}
                              {formatDate(department.activeBudget.periodEnd)}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                              <div>
                                <p className="text-sm text-gray-500">Total Budget</p>
                                <p className="font-semibold text-lg">
                                  {formatCurrency(department.activeBudget.amount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Used</p>
                                <p className="font-semibold text-lg">
                                  {formatCurrency(department.activeBudget.amountUsed)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Remaining</p>
                                <p className="font-semibold text-lg text-green-600">
                                  {formatCurrency(department.activeBudget.amountRemaining)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Budget Utilization</span>
                            <span>
                              {Math.round((department.activeBudget.amountUsed / department.activeBudget.amount) * 100)}%
                            </span>
                          </div>
                          <Progress
                            value={(department.activeBudget.amountUsed / department.activeBudget.amount) * 100}
                            className="h-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Budget History Table */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Budget History</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {department.budgets.map(budget => {
                        const isActive = department.activeBudget?.id === budget.id;
                        const isPast = new Date(budget.periodEnd) < new Date();

                        return (
                          <TableRow key={budget.id}>
                            <TableCell className="font-medium">{budget.name}</TableCell>
                            <TableCell>{formatCurrency(budget.amount)}</TableCell>
                            <TableCell>
                              {formatDate(budget.periodStart)} - {formatDate(budget.periodEnd)}
                            </TableCell>
                            <TableCell>
                              {isActive ? (
                                <Badge>Active</Badge>
                              ) : isPast ? (
                                <Badge variant="outline">Completed</Badge>
                              ) : (
                                <Badge variant="secondary">Upcoming</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Budget
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Department Workflows</CardTitle>
                    <CardDescription>Manage and configure workflows for department processes</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingWorkflow(null);
                      setIsWorkflowModalOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" /> Add Workflow
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {department.workflows.map(workflow => (
                    <Card
                      key={workflow.id}
                      className={`border-l-4 ${workflow.isActive ? 'border-l-green-500' : 'border-l-gray-300'}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">{workflow.name}</h3>
                            {workflow.isDefault && <Badge className="mt-1">Default</Badge>}
                            {!workflow.isActive && (
                              <Badge variant="outline" className="mt-1 ml-2">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingWorkflow(workflow);
                                  setIsWorkflowModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleWorkflowUpdate({
                                    id: workflow.id,
                                    isActive: !workflow.isActive,
                                  })
                                }
                              >
                                {workflow.isActive ? (
                                  <>
                                    <X className="h-4 w-4 mr-2" /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-2" /> Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteWorkflow(workflow.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {workflow.description && <p className="text-gray-600 text-sm mt-2">{workflow.description}</p>}

                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" /> Configure
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {department.workflows.length === 0 && (
                  <div className="text-center py-10">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No workflows created</h3>
                    <p className="text-gray-500 mt-1">Create your first workflow to get started</p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        setEditingWorkflow(null);
                        setIsWorkflowModalOpen(true);
                      }}
                    >
                      Add Workflow
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <MemberRoleModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        member={editingMember}
        onSave={handleMemberUpdate}
      />

      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        workflow={editingWorkflow}
        onSave={handleWorkflowUpdate}
      />
    </div>
  );
    }