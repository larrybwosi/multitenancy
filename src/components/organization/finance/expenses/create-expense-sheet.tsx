'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Receipt, Map } from 'lucide-react';
import { format } from 'date-fns';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useCreateExpense } from '@/lib/hooks/use-expenses';
import { PaymentMethod } from '../../../../../prisma/src/generated/prisma/client';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MotionDiv, MotionForm } from '@/components/motion';

// Dummy data
const CATEGORIES = [
  { id: '1', name: 'Office Supplies' },
  { id: '2', name: 'Travel' },
  { id: '3', name: 'Meals' },
  { id: '4', name: 'Software' },
  { id: '5', name: 'Hardware' },
];

const LOCATIONS = [
  { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Headquarters' },
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Branch Office' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Remote' },
];

const SUPPLIERS = [
  { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Amazon' },
  { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Office Depot' },
  { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Uber' },
];

const BUDGETS = [
  { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Q2 Marketing' },
  { id: '550e8400-e29b-41d4-a716-446655440007', name: 'IT Infrastructure' },
  { id: '550e8400-e29b-41d4-a716-446655440008', name: 'General Expenses' },
];

const PURCHASES = [
  { id: '550e8400-e29b-41d4-a716-446655440009', name: 'Annual Software License' },
  { id: '550e8400-e29b-41d4-a716-446655440010', name: 'Office Renovation' },
];

const dateSchema = z
  .union([z.date(), z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
  .transform(val => new Date(val));

const CreateExpenseSchema = z
  .object({
    description: z.string().min(1, 'Description is required').max(255),
    amount: z.coerce.number().positive('Amount must be a positive number'),
    expenseDate: dateSchema,
    categoryId: z.string().min(1, 'Category ID is required'),
    paymentMethod: z.nativeEnum(PaymentMethod),
    receiptUrl: z.string().url('Invalid URL format').optional().nullable(),
    notes: z.string().optional().nullable(),
    isReimbursable: z.boolean().optional().default(false),
    locationId: z.string().uuid('Invalid location ID'),
    supplierId: z.string().uuid('Invalid supplier ID').optional().nullable(),
    purchaseId: z.string().uuid('Invalid purchase ID').optional().nullable(),
    budgetId: z.string().uuid('Invalid budget ID').optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
    taxAmount: z.coerce.number().min(0).optional().nullable(),
    mileage: z.number().min(0).optional().nullable(),
    isBillable: z.boolean().optional().default(false),
  })
  .strict();

type ExpenseFormValues = z.infer<typeof CreateExpenseSchema>;

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1,
    },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

export function CreateExpense() {
  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { mutateAsync: createExpense, isPending: creatingExpense } = useCreateExpense();

  const form = useForm({
    resolver: zodResolver(CreateExpenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      expenseDate: new Date(),
      categoryId: '',
      paymentMethod: PaymentMethod.CREDIT_CARD,
      locationId: LOCATIONS[0].id,
      isReimbursable: false,
      isBillable: false,
      tags: [],
    },
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      await createExpense(data);
      form.reset();
      setOpen(false);
      toast.success('Expense created successfully!');
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Error creating expense. Please try again.');
    }
  };

  if (!isClient) {
    return (
      <Button
        className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        disabled
      >
        New Expense
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
            New Expense
          </Button>
        </MotionDiv>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg w-full overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create New Expense
          </SheetTitle>
          <SheetDescription className="text-gray-600">
            Add a new expense record with all relevant details.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <MotionForm
            variants={formVariants}
            initial="hidden"
            animate="visible"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
          >
            {/* Basic Information Section */}
            <MotionDiv variants={fieldVariants} className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800">Basic Information</h3>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <MotionDiv variants={fieldVariants}>
                    <FormItem>
                      <FormLabel className="text-gray-700">Description *</FormLabel>
                      <FormControl>
                        <Input
                          className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Enter expense description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </MotionDiv>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MotionDiv variants={fieldVariants}>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Amount *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-7 border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </MotionDiv>

                <MotionDiv variants={fieldVariants}>
                  <FormField
                    control={form.control}
                    name="expenseDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-gray-700">Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full justify-start text-left font-normal border-gray-300 hover:bg-gray-50 transition-all',
                                  !field.value && 'text-gray-500'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                {field.value ? format(field.value, 'PPP') : 'Select date'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white shadow-lg" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="bg-white rounded-lg"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </MotionDiv>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MotionDiv variants={fieldVariants}>
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            {CATEGORIES.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </MotionDiv>

                <MotionDiv variants={fieldVariants}>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Payment Method *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            {Object.entries(PaymentMethod).map(([key, value]) => (
                              <SelectItem key={key} value={value}>
                                {key.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </MotionDiv>
              </div>

              <MotionDiv variants={fieldVariants}>
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Location *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="flex items-center border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all">
                            <Map className="h-4 w-4 text-gray-500 mr-2" />
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
                          {LOCATIONS.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </MotionDiv>
            </MotionDiv>

            {/* Additional Details Section */}
            <MotionDiv variants={fieldVariants} className="space-y-6 bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800">Additional Details</h3>

              <MotionDiv variants={fieldVariants}>
                <FormField
                  control={form.control}
                  name="receiptUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Receipt URL</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Receipt className="h-4 w-4 text-gray-500 mr-2" />
                          <Input
                            placeholder="https://receipts.example.com/123"
                            className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all"
                            {...field}
                            value={field.value || ''}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </MotionDiv>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MotionDiv variants={fieldVariants}>
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Supplier</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all">
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            <SelectGroup>
                              <SelectLabel>None</SelectLabel>
                              {SUPPLIERS.map(supplier => (
                                <SelectItem key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </MotionDiv>

                <MotionDiv variants={fieldVariants}>
                  <FormField
                    control={form.control}
                    name="budgetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Budget</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all">
                              <SelectValue placeholder="Select budget" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            <SelectGroup>
                              <SelectLabel>None</SelectLabel>
                              {BUDGETS.map(budget => (
                                <SelectItem key={budget.id} value={budget.id}>
                                  {budget.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </MotionDiv>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MotionDiv variants={fieldVariants}>
                  <FormField
                    control={form.control}
                    name="purchaseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Related Purchase</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all">
                              <SelectValue placeholder="Select purchase" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
                            <SelectGroup>
                              <SelectLabel>None</SelectLabel>
                              {PURCHASES.map(purchase => (
                                <SelectItem key={purchase.id} value={purchase.id}>
                                  {purchase.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </MotionDiv>

                <MotionDiv variants={fieldVariants}>
                  <FormField
                    control={form.control}
                    name="taxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Tax Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-7 border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all"
                              {...field}
                              value={field.value || ''}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </MotionDiv>
              </div>

              <MotionDiv variants={fieldVariants}>
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Mileage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          className="border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all"
                          {...field}
                          value={field.value || ''}
                          onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </MotionDiv>

              <MotionDiv variants={fieldVariants}>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes or details"
                          className="resize-none border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </MotionDiv>

              <div className="space-y-4">
                <MotionDiv variants={fieldVariants}>
                  <FormField
                    control={form.control}
                    name="isReimbursable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-4 bg-gray-50 hover:bg-gray-100 transition-all">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-gray-800">Reimbursable Expense</FormLabel>
                          <FormDescription className="text-gray-600">
                            Mark if this expense should be reimbursed
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </MotionDiv>

                <MotionDiv variants={fieldVariants}>
                  <FormField
                    control={form.control}
                    name="isBillable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-4 bg-gray-50 hover:bg-gray-100 transition-all">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-gray-800">Billable to Client</FormLabel>
                          <FormDescription className="text-gray-600">
                            Mark if this expense should be billed to a client
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </MotionDiv>
              </div>
            </MotionDiv>

            <SheetFooter className="gap-2 sm:gap-0">
              <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </Button>
              </MotionDiv>
              <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="submit"
                  disabled={creatingExpense}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  {creatingExpense ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Expense'
                  )}
                </Button>
              </MotionDiv>
            </SheetFooter>
          </MotionForm>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
