import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useEffect, useState } from 'react';
import { PlusCircle, Trash2, Edit3 } from 'lucide-react';
import {
  // Import the Zod schema you defined for creating a workflow template
  CreateWorkflowTemplateInput,
  createWorkflowTemplateInputSchema,
  WorkflowStepInput, // Assuming this type is exported if it's part of CreateWorkflowTemplateInput
} from '@/lib/validations/workflowTemplates'; // Adjust path
import { WorkflowTriggerType } from '@/prisma/client'; // Or your local enum/type

// Sub-component for editing a single step (could be another modal or inline form)
// For now, just a placeholder concept
const WorkflowStepEditor = ({
  step,
  index,
  updateStep,
  removeStep,
  allStepNames, // For validating toStepName in transitions
}: {
  step: WorkflowStepInput;
  index: number;
  updateStep: (index: number, data: WorkflowStepInput) => void;
  removeStep: (index: number) => void;
  allStepNames: string[];
}) => {
  // This would contain a form for stepName, description, assigneeLogic, formFields, actions, transitions
  // Each of those could further use useFieldArray for formFields, actions, etc.
  // This is where the complexity really lies.
  return (
    <div className="border p-4 rounded-md space-y-3 mb-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold">
          Step {index + 1}: {step.stepName || 'New Step'}
        </h4>
        <Button variant="ghost" size="sm" onClick={() => removeStep(index)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        (Full step editor UI for name, description, assignees, forms, actions, transitions would go here)
      </p>
      {/* Example: Input for step name */}
      <Input
        defaultValue={step.stepName}
        placeholder="Step Name (unique)"
        onChange={e => updateStep(index, { ...step, stepName: e.target.value })}
      />
      <Input
        type="number"
        defaultValue={step.order}
        placeholder="Order"
        onChange={e => updateStep(index, { ...step, order: parseInt(e.target.value) || index + 1 })}
      />
      {/* ... more fields for description, assigneeLogic (could be complex), etc. ... */}
      <Button variant="outline" size="sm">
        <Edit3 className="mr-2 h-4 w-4" /> Edit Full Step Details
      </Button>
    </div>
  );
};

interface WorkflowTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  departmentId?: string;
  editingWorkflow?: CreateWorkflowTemplateInput & { id?: string }; // Include 'id' if editing
  onSave: (data: CreateWorkflowTemplateInput, id?: string) => Promise<void>;
}

export const WorkflowTemplateModal = ({
  isOpen,
  onClose,
  organizationId,
  departmentId,
  editingWorkflow,
  onSave,
}: WorkflowTemplateModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!editingWorkflow;

  const form = useForm({
    resolver: zodResolver(createWorkflowTemplateInputSchema),
    defaultValues: editingWorkflow || {
      workflowName: '',
      description: '',
      organizationId: organizationId,
      departmentId: departmentId || undefined,
      triggerType: WorkflowTriggerType.MANUAL,
      initialStepName: '',
      steps: [{ stepName: 'step_1', order: 1, description: '', actions: [], formFields: [], transitions: [] }], // Start with one basic step
    },
  });

  const {
    fields: steps,
    append: appendStep,
    remove: removeStep,
    update: updateStepField,
  } = useFieldArray({
    control: form.control,
    name: 'steps',
  });

  useEffect(() => {
    const defaultValues = editingWorkflow || {
      workflowName: '',
      description: '',
      organizationId: organizationId,
      departmentId: departmentId || undefined,
      triggerType: WorkflowTriggerType.MANUAL,
      initialStepName: editingWorkflow?.steps?.[0]?.stepName || '',
      steps:
        editingWorkflow?.steps && editingWorkflow.steps.length > 0
          ? editingWorkflow.steps
          : [{ stepName: 'step_1', order: 1, description: '', actions: [], formFields: [], transitions: [] }],
    };
    form.reset(defaultValues);
  }, [editingWorkflow, form, organizationId, departmentId]);

  const onSubmit = async (data: CreateWorkflowTemplateInput) => {
    setIsLoading(true);
    // console.log("Workflow data to save:", data);
    // Validate that initialStepName exists in steps
    if (!data.steps.find(s => s.stepName === data.initialStepName)) {
      form.setError('initialStepName', {
        type: 'manual',
        message: 'Initial step name must match one of the defined step names.',
      });
      setIsLoading(false);
      return;
    }
    try {
      await onSave(data, editingWorkflow?.id);
      onClose();
    } catch (error) {
      console.error('Failed to save workflow template:', error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentStepNames = form.getValues('steps').map(s => s.stepName);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Workflow Template' : 'Create Workflow Template'}</DialogTitle>
          <DialogDescription>Define the structure, steps, forms, and transitions for this workflow.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          {' '}
          {/* Scrollable area */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="workflowName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workflow Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Document Approval FY25" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="triggerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trigger" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(WorkflowTriggerType).map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief description of the workflow..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Steps Management */}
              <div>
                <FormLabel className="text-lg font-semibold">Workflow Steps</FormLabel>
                <FormDescription>Define the sequence of steps in this workflow.</FormDescription>
                <div className="mt-2 space-y-4">
                  {steps.map((step, index) => (
                    // Replace with a more comprehensive StepEditor component
                    <WorkflowStepEditor
                      key={step.id} // react-hook-form provides id
                      step={form.getValues(`steps.${index}`)} // Pass current form values for the step
                      index={index}
                      updateStep={(idx, data) => {
                        // This is tricky with react-hook-form's update.
                        // It might be better to manage step data in a separate local state
                        // if the StepEditor becomes very complex, and then sync back to the main form.
                        // Or, the StepEditor uses its own form instance for that step and calls a save function.
                        // For simplicity here, conceptual update:
                        const currentSteps = form.getValues('steps');
                        currentSteps[idx] = data as any; // Cast needed because types might not align perfectly
                        form.setValue('steps', currentSteps, { shouldValidate: true, shouldDirty: true });
                      }}
                      removeStep={() => removeStep(index)}
                      allStepNames={currentStepNames}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    appendStep(
                      {
                        stepName: `new_step_${steps.length + 1}`,
                        order: steps.length + 1,
                        description: '',
                        actions: [],
                        formFields: [],
                        transitions: [],
                      },
                      { shouldFocus: false }
                    )
                  }
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Step
                </Button>
              </div>

              <FormField
                control={form.control}
                name="initialStepName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Step Name</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the first step" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.getValues('steps').map(s => (
                          <SelectItem key={s.stepName} value={s.stepName}>
                            {s.stepName || `Step ${s.order}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>This step will start the workflow.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="sticky bottom-0 bg-background py-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                  {isEditing ? 'Save Workflow Changes' : 'Create Workflow'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
