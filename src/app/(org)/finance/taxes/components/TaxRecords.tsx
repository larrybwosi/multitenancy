'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useTaxRecords } from '../hooks';
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
import { Search, Download, Plus, Edit, Trash } from 'lucide-react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const taxFormSchema = z.object({
  type: z.enum(['VAT', 'Income Tax', 'Corporate Tax']),
  amount: z.number().min(0),
  status: z.enum(['Paid', 'Pending', 'Overdue']),
  description: z.string().min(1),
  date: z.date(),
});

export default function TaxRecords() {
  const { organization } = useOrganization();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const { taxRecords, loading, error } = useTaxRecords();

  const form = useForm<z.infer<typeof taxFormSchema>>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      type: 'VAT',
      amount: 0,
      status: 'Pending',
      description: '',
      date: new Date(),
    },
  });

  const handleAddTaxRecord = async (values: z.infer<typeof taxFormSchema>) => {
    if (!organization) return;

    try {
      const response = await fetch('/api/taxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          organizationId: organization.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tax record');
      }

      // Close modal and reset form
      setIsAddModalOpen(false);
      form.reset();
      
      // You might want to refresh the tax records here
      window.location.reload();
    } catch (error) {
      console.error('Error adding tax record:', error);
    }
  };

  const handleExportTaxReport = () => {
    // Implement export logic
  };

  // Filter tax records based on search query
  const filteredRecords = taxRecords.filter((record) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      record.type.toLowerCase().includes(query) ||
      record.description.toLowerCase().includes(query) ||
      record.status.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <div>Loading tax records...</div>;
  }

  if (error) {
    return <div>Error loading tax records: {error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Tax Records</CardTitle>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DatePicker
              date={selectedMonth}
              onChange={setSelectedMonth}
            />
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tax Record
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Tax Record</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddTaxRecord)} className="space-y-4">
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
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <FormControl>
                            <select
                              className="w-full p-2 border rounded-md"
                              {...field}
                            >
                              <option value="Paid">Paid</option>
                              <option value="Pending">Pending</option>
                              <option value="Overdue">Overdue</option>
                            </select>
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
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
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
                    <Button type="submit" className="w-full">Add Record</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleExportTaxReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRecords.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            {searchQuery 
              ? "No tax records match your search criteria." 
              : "No tax records found. Add your first tax record."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(record.date, 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell>${record.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      record.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
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