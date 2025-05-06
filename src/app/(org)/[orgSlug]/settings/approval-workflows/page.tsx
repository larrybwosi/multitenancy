'use client';

import { WorkflowDialog } from "@/components/organization/settings/approval-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clipboard, Star, Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ApprovalWorkflowInput } from "@/lib/validations/approval";
import { useApprovalWorkflows, useDeleteApprovalWorkflow, useSetActiveWorkflow } from "@/lib/hooks/use-approval-workflows";
import { Spinner } from "@/components/ui/spinner";
import type { ApprovalWorkflow } from "@/prisma/client";
import { useOrganization } from "@/hooks/use-organization";

export default function ApprovalWorkflowsPage() {
  const { organization, isLoading: loadingOrganization } = useOrganization()
  const { data: workflows, isLoading, isError } = useApprovalWorkflows();
  
  const { mutateAsync:deleteWorkflow, isPending: deletingWorkflow, variables: workflowVariables } = useDeleteApprovalWorkflow();
  const { mutateAsync:setActiveWorkflow, isPending: settingActiveWorkflow, variables } = useSetActiveWorkflow();

  // Handle setting a workflow as active
  const handleSetActive = async (workflowId: string) => {
    if (!organization) return;
    
    await setActiveWorkflow({ 
      organizationId: organization.id, 
      workflowId 
    });
  };
  
  // Handle deleting a workflow
  const handleDelete = async (workflowId: string) => {
    await deleteWorkflow(workflowId);
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-amber-500 mr-2" />
        <h3 className="text-lg font-medium">Organization not found</h3>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Approval Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Configure approval workflows for expenses and other items that require hierarchical approval.
          </p>
        </div>
        <WorkflowDialog id={organization.id} />
      </div>

      <Separator className="my-6" />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner className="mr-2 h-6 w-6" />
          <span>Loading workflows...</span>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center h-64 text-destructive">
          <AlertTriangle className="h-8 w-8 mr-2" />
          <span>Failed to load workflows. Please try again.</span>
        </div>
      ) : workflows?.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <h3 className="text-lg font-medium mb-2">No approval workflows found</h3>
          <p className="text-muted-foreground mb-6">
            Create your first approval workflow to start managing expense approvals.
          </p>
          <WorkflowDialog id={organization.id} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows?.map((workflow: ApprovalWorkflow & { _count?: { steps: number } }) => (
            <Card key={workflow.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {workflow.name}
                      {organization.activeExpenseWorkflowId === workflow.id && (
                        <Badge variant="secondary" className="ml-2">
                          <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {workflow.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center">
                    <Badge
                      variant={workflow.isActive ? "success" : "destructive"}
                      className="text-xs"
                    >
                      {workflow.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clipboard className="h-4 w-4" />
                  <span>
                    {workflow._count?.steps ?? 0} Step{(workflow._count?.steps ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetActive(workflow.id)}
                  disabled={organization.activeExpenseWorkflowId === workflow.id || settingActiveWorkflow}
                >
                  {settingActiveWorkflow && variables?.workflowId === workflow.id ? (
                    <>
                      <Spinner className="mr-1 h-3 w-3" />
                      Setting active...
                    </>
                  ) : (
                    "Set as Active"
                  )}
                </Button>
                <div className="flex items-center gap-2">
                  <WorkflowDialog
                    workflowId={workflow.id}
                    initialData={workflow as unknown as ApprovalWorkflowInput}
                    id={organization.id}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        disabled={deletingWorkflow && workflowVariables === workflow.id}
                      >
                        {deletingWorkflow && workflowVariables === workflow.id ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Approval Workflow</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this approval workflow? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(workflow.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 