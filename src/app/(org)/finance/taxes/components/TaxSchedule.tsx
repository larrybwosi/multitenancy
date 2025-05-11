'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useTaxSchedules } from '../hooks';
import { useOrganization } from '@/hooks/use-organization';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Plus } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const scheduleFormSchema = z.object({
  type: z.enum(['VAT', 'Income Tax', 'Corporate Tax']),
  amount: z.number().min(0),
  dueDate: z.date(),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(['Monthly', 'Quarterly', 'Annually']).optional(),
  notificationDate: z.date().optional(),
});

export default function TaxSchedule() {
  const { organization } = useOrganization();
  const { taxSchedules, loading, error } = useTaxSchedules();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const form = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      type: 'VAT',
      amount: 0,
      dueDate: new Date(),
      description: '',
      isRecurring: false,
    },
  });

  const isRecurring = form.watch('isRecurring');

  const handleAddSchedule = async (values: z.infer<typeof scheduleFormSchema>) => {
    if (!organization) return;

    try {
      const response = await fetch('/api/taxes/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          organizationId: organization.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tax schedule');
      }

      // Close modal and reset form
      setIsAddModalOpen(false);
      form.reset();
      
      // You might want to refresh the schedules here
      window.location.reload();
    } catch (error) {
      console.error('Error scheduling tax payment:', error);
    }
  };

  if (loading) {
    return <div>Loading tax schedules...</div>;
  }

  if (error) {
    return <div>Error loading tax schedules: {error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Tax Payment Schedule</CardTitle>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Tax Payment</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddSchedule)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Type</FormLabel>
                        <FormControl>
                          <select
                            className="w-full p-2 border rounded-md"
                            {...field}
                          >
                            <option value="VAT">VAT</option>
                            <option value="Income Tax">Income Tax</option>
                            <option value="Corporate Tax">Corporate Tax</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Recurring Payment</FormLabel>
                          <FormDescription>
                            Set this payment to repeat on a schedule
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  {isRecurring && (
                    <FormField
                      control={form.control}
                      name="recurringFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <FormControl>
                            <select
                              className="w-full p-2 border rounded-md"
                              {...field}
                            >
                              <option value="Monthly">Monthly</option>
                              <option value="Quarterly">Quarterly</option>
                              <option value="Annually">Annually</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="notificationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification Date (Optional)</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Date to receive a reminder about this payment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Schedule Payment</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {taxSchedules.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No scheduled tax payments. Schedule your first payment.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tax Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>{schedule.type}</TableCell>
                  <TableCell>${schedule.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {format(schedule.dueDate, 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>{schedule.description}</TableCell>
                  <TableCell>
                    {schedule.isRecurring ? (
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {schedule.recurringFrequency}
                      </div>
                    ) : (
                      'One-time'
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      schedule.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      schedule.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {schedule.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-600">Cancel</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 