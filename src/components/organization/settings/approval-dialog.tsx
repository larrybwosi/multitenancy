'use client';
import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, ArrowDown, ArrowUp, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApprovalWorkflowInputSchema, type ApprovalWorkflowInput } from "@/lib/validations/approval";
import { ApprovalActionType, ApprovalMode, ConditionType, MemberRole } from "../../../types/prisma";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useCreateApprovalWorkflow, useUpdateApprovalWorkflow } from "@/lib/hooks/use-approval-workflows";
import { useExpenseCategories } from "@/lib/hooks/use-expense-categories";
import { useLocations } from "@/lib/hooks/use-supplier";
import { on } from "events";

interface WorkflowDialogProps {
  workflowId?: string;
  initialData?: ApprovalWorkflowInput;
  id: string;
}

export function WorkflowDialog({
  workflowId,
  initialData,
  id,
}: WorkflowDialogProps) {
  const [open, setOpen] = useState(false);
  
  const createMutation = useCreateApprovalWorkflow();
  const updateMutation = useUpdateApprovalWorkflow();
  
  const { data: expenseCategories = [], isLoading: loadingCategories } = useExpenseCategories();
  const { data: locations = [] } = useLocations();
  const members = [{ id: '123', name: 'John Doe' }, { id: '456', name: 'Jane Doe' }]
  // const { data: members = [] } = useMembers(); creat
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  
  const form = useForm({
    resolver: zodResolver(ApprovalWorkflowInputSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      isActive: true,
      steps: [
        {
          stepNumber: 1,
          name: '',
          description: '',
          allConditionsMustMatch: true,
          conditions: [{ type: ConditionType.AMOUNT_RANGE, minAmount: null, maxAmount: null }],
          actions: [{ type: ApprovalActionType.ROLE, approverRole: null, approvalMode: ApprovalMode.ANY_ONE }],
        },
      ],
    },
  });

  const { fields: steps, append: appendStep, remove: removeStep, move: moveStep } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const onSubmit = async (data: ApprovalWorkflowInput) => {
    try {
      if (workflowId) {
        await updateMutation.mutateAsync({ workflowId, data });
      } else {
        await createMutation.mutateAsync({ organizationId: id, data });
      }
      setOpen(false);
    } catch (error) {
      console.error("Error submitting workflow:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={workflowId ? 'outline' : 'default'} className="gap-2">
          {workflowId ? 'Edit Workflow' : 'Create Workflow'}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[1500px] h-[90vh]">
        <DialogHeader>
          <DialogTitle>{workflowId ? 'Edit Approval Workflow' : 'Create Approval Workflow'}</DialogTitle>
          <DialogDescription>
            Configure the approval workflow with multiple steps, conditions, and actions to streamline your
            organization&#39;s expense approval process.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Workflow Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Workflow Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a descriptive name for this workflow" {...field} />
                          </FormControl>
                          <FormDescription>
                            Choose a clear name that identifies the purpose of this workflow.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Active Status</FormLabel>
                            <FormDescription>Enable or disable this workflow</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the purpose of this workflow"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Add details to help others understand when this workflow should be used.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Steps Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Approval Steps</h3>
                    <Button
                      type="button"
                      onClick={() =>
                        appendStep({
                          stepNumber: steps.length + 1,
                          name: '',
                          description: '',
                          allConditionsMustMatch: true,
                          conditions: [{ type: ConditionType.AMOUNT_RANGE, minAmount: null, maxAmount: null }],
                          actions: [
                            { type: ApprovalActionType.ROLE, approverRole: null, approvalMode: ApprovalMode.ANY_ONE },
                          ],
                        })
                      }
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="mr-1 h-4 w-4" /> Add Step
                    </Button>
                  </div>

                  {steps.map((step, stepIndex) => (
                    <ApprovalStepCard
                      key={step.id}
                      stepIndex={stepIndex}
                      form={form}
                      expenseCategories={expenseCategories}
                      locations={locations}
                      members={members}
                      removeStep={() => {
                        if (steps.length > 1) {
                          removeStep(stepIndex);
                        } else {
                          toast.error('Workflow must have at least one step');
                        }
                      }}
                      moveUp={() => stepIndex > 0 && moveStep(stepIndex, stepIndex - 1)}
                      moveDown={() => stepIndex < steps.length - 1 && moveStep(stepIndex, stepIndex + 1)}
                    />
                  ))}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {workflowId ? 'Updating...' : 'Creating...'}
                  </>
                ) : workflowId ? (
                  'Update Workflow'
                ) : (
                  'Create Workflow'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface ApprovalStepCardProps {
  stepIndex: number;
  form: ReturnType<typeof useForm<ApprovalWorkflowInput>>;
  expenseCategories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  members: { id: string; name: string }[];
  removeStep: () => void;
  moveUp: () => void;
  moveDown: () => void;
}

function ApprovalStepCard({ 
  stepIndex, 
  form, 
  expenseCategories,
  locations,
  members,
  removeStep, 
  moveUp, 
  moveDown 
}: ApprovalStepCardProps) {
  const { fields: conditions, append: appendCondition, remove: removeCondition } = useFieldArray({
    control: form.control,
    name: `steps.${stepIndex}.conditions`,
  });

  const { fields: actions, append: appendAction, remove: removeAction } = useFieldArray({
    control: form.control,
    name: `steps.${stepIndex}.actions`,
  });

  return (
    <Card key={stepIndex} className="relative">
      <Badge 
        variant="outline" 
        className="absolute top-2 right-2"
      >
        Step {stepIndex + 1}
      </Badge>
      <CardContent className="pt-6">
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={`steps.${stepIndex}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Step Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a name for this step" {...field} />
                  </FormControl>
                  <FormDescription>
                    Example: &#34;Manager Approval&#34; or &#34;Finance Review&#34;
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name={`steps.${stepIndex}.stepNumber`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Step Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      placeholder="Enter step order number"
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>
                    Defines the execution sequence of the approval steps
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name={`steps.${stepIndex}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe what happens in this step" 
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Add details to help approvers understand their responsibilities
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`steps.${stepIndex}.allConditionsMustMatch`}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <FormLabel>Condition Logic</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>&quot;AND&quot; requires all conditions to match for the step to apply. &quot;OR&quot; requires any one condition to match.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormDescription>
                    {field.value ? "All conditions must match (AND logic)" : "Any condition can match (OR logic)"}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Tabs defaultValue="conditions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="conditions" className="space-y-4 pt-4">
              {conditions.map((condition, conditionIndex) => (
                <ConditionCard 
                  key={condition.id} 
                  stepIndex={stepIndex}
                  conditionIndex={conditionIndex}
                  form={form}
                  expenseCategories={expenseCategories}
                  locations={locations}
                  canDelete={conditions.length > 1}
                  onDelete={() => removeCondition(conditionIndex)}
                />
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => 
                  appendCondition({ 
                    type: ConditionType.AMOUNT_RANGE, 
                    minAmount: null, 
                    maxAmount: null 
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add Condition
              </Button>
            </TabsContent>
            
            <TabsContent value="actions" className="space-y-4 pt-4">
              {actions.map((action, actionIndex) => (
                <ActionCard 
                  key={action.id} 
                  stepIndex={stepIndex}
                  actionIndex={actionIndex}
                  form={form}
                  members={members}
                  canDelete={actions.length > 1}
                  onDelete={() => removeAction(actionIndex)}
                />
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => 
                  appendAction({ 
                    type: ApprovalActionType.ROLE, 
                    approverRole: null, 
                    approvalMode: ApprovalMode.ANY_ONE 
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add Action
              </Button>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeStep}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Remove Step
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={moveUp}
              disabled={stepIndex === 0}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={moveDown}
              disabled={stepIndex === form.getValues().steps.length - 1}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ConditionCardProps {
  stepIndex: number;
  conditionIndex: number;
  form: ReturnType<typeof useForm<ApprovalWorkflowInput>>;
  expenseCategories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  canDelete: boolean;
  onDelete: () => void;
}

function ConditionCard({ 
  stepIndex, 
  conditionIndex, 
  form, 
  expenseCategories,
  locations,
  canDelete, 
  onDelete 
}: ConditionCardProps) {
  const conditionType = form.watch(`steps.${stepIndex}.conditions.${conditionIndex}.type`);
  
  return (
    <div className="border rounded-md p-4 relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={() => {
          if (canDelete) {
            onDelete();
          } else {
            toast.error("Each step must have at least one condition");
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <FormField
        control={form.control}
        name={`steps.${stepIndex}.conditions.${conditionIndex}.type`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Condition Type</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a condition type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={ConditionType.AMOUNT_RANGE}>Amount Range</SelectItem>
                <SelectItem value={ConditionType.LOCATION}>Location</SelectItem>
                <SelectItem value={ConditionType.EXPENSE_CATEGORY}>Expense Category</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {conditionType === ConditionType.AMOUNT_RANGE && "Trigger approval based on expense amount range"}
              {conditionType === ConditionType.LOCATION && "Trigger approval based on location"}
              {conditionType === ConditionType.EXPENSE_CATEGORY && "Trigger approval based on expense category"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {conditionType === ConditionType.AMOUNT_RANGE && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            control={form.control}
            name={`steps.${stepIndex}.conditions.${conditionIndex}.minAmount`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Leave empty for no minimum amount
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`steps.${stepIndex}.conditions.${conditionIndex}.maxAmount`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="No limit"
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Leave empty for no maximum limit
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {conditionType === ConditionType.LOCATION && (
        <FormField
          control={form.control}
          name={`steps.${stepIndex}.conditions.${conditionIndex}.locationId`}
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Location</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the location that will trigger this approval step
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {conditionType === ConditionType.EXPENSE_CATEGORY && (
        <FormField
          control={form.control}
          name={`steps.${stepIndex}.conditions.${conditionIndex}.expenseCategoryId`}
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Expense Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the expense category that will trigger this approval step
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}

interface ActionCardProps {
  stepIndex: number;
  actionIndex: number;
  form: ReturnType<typeof useForm<ApprovalWorkflowInput>>;
  members: { id: string; name: string }[];
  canDelete: boolean;
  onDelete: () => void;
}

function ActionCard({ 
  stepIndex, 
  actionIndex, 
  form, 
  members,
  canDelete, 
  onDelete 
}: ActionCardProps) {
  const actionType = form.watch(`steps.${stepIndex}.actions.${actionIndex}.type`);
  
  return (
    <div className="border rounded-md p-4 relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={() => {
          if (canDelete) {
            onDelete();
          } else {
            toast.error("Each step must have at least one action");
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      
      <FormField
        control={form.control}
        name={`steps.${stepIndex}.actions.${actionIndex}.type`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Approver Type</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select approver type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={ApprovalActionType.ROLE}>By Role</SelectItem>
                <SelectItem value={ApprovalActionType.SPECIFIC_MEMBER}>Specific Member</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {actionType === ApprovalActionType.ROLE && "Select a role for approval (e.g., Manager, Finance)"}
              {actionType === ApprovalActionType.SPECIFIC_MEMBER && "Select a specific person for approval"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {actionType === ApprovalActionType.ROLE && (
        <FormField
          control={form.control}
          name={`steps.${stepIndex}.actions.${actionIndex}.approverRole`}
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(MemberRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Members with this role will be responsible for approval
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {actionType === ApprovalActionType.SPECIFIC_MEMBER && (
        <FormField
          control={form.control}
          name={`steps.${stepIndex}.actions.${actionIndex}.specificMemberId`}
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Member</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                This specific person will be responsible for approval
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name={`steps.${stepIndex}.actions.${actionIndex}.approvalMode`}
        render={({ field }) => (
          <FormItem className="mt-4">
            <FormLabel>Approval Mode</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select approval mode" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={ApprovalMode.ANY_ONE}>Any One</SelectItem>
                <SelectItem value={ApprovalMode.ALL}>All Required</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {field.value === ApprovalMode.ANY_ONE && "Any one person can approve"}
              {field.value === ApprovalMode.ALL && "All people must approve"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}