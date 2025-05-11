'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useTaxRecords } from './hooks';
import { useOrganization } from '@/hooks/use-organization';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Search, Plus, Download, Edit, Trash } from 'lucide-react';
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

import TaxSchedule from './components/TaxSchedule';
import TaxReturns from './components/TaxReturns';
import VATCalculation from './components/VATCalculation';

const taxFormSchema = z.object({
  type: z.enum(['VAT', 'Income Tax', 'Corporate Tax']),
  amount: z.number().min(0),
  status: z.enum(['Paid', 'Pending', 'Overdue']),
  description: z.string().min(1),
  date: z.date(),
});

export default function TaxesPage() {
  const { organization } = useOrganization();
  
  if (!organization) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tax Management</h1>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vat">VAT Calculation</TabsTrigger>
          <TabsTrigger value="schedule">Payment Schedule</TabsTrigger>
          <TabsTrigger value="returns">Tax Returns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="space-y-6">
            <TaxOverview />
          </div>
        </TabsContent>
        
        <TabsContent value="vat">
          <VATCalculation />
        </TabsContent>
        
        <TabsContent value="schedule">
          <TaxSchedule />
        </TabsContent>
        
        <TabsContent value="returns">
          <TaxReturns />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Tax Overview component
function TaxOverview() {
  const { taxRecords, loading, error } = useTaxRecords();
  const { organization } = useOrganization();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
  
  if (loading) return <div>Loading tax records...</div>;
  if (error) return <div>Error loading tax records: {error}</div>;

  // Tax summary data
  const vatTotal = taxRecords
    .filter(record => record.type === 'VAT')
    .reduce((sum, record) => sum + record.amount, 0);
  
  const incomeTaxTotal = taxRecords
    .filter(record => record.type === 'Income Tax')
    .reduce((sum, record) => sum + record.amount, 0);
  
  const corporateTaxTotal = taxRecords
    .filter(record => record.type === 'Corporate Tax')
    .reduce((sum, record) => sum + record.amount, 0);
  
  const totalTaxDue = vatTotal + incomeTaxTotal + corporateTaxTotal;

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

  return (
    <>
      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total VAT" amount={vatTotal} change="+20.1%" />
        <SummaryCard title="Income Tax" amount={incomeTaxTotal} change="+10.5%" />
        <SummaryCard title="Corporate Tax" amount={corporateTaxTotal} change="+5.2%" />
        <SummaryCard title="Total Tax Due" amount={totalTaxDue} dueDate="March 31, 2024" />
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionButton 
            label="Schedule Tax Payment" 
            tab="schedule"
            description="Set up and schedule your tax payments" 
          />
          <QuickActionButton 
            label="Calculate VAT" 
            tab="vat"
            description="Calculate VAT from your sales" 
          />
          <QuickActionButton 
            label="File Tax Return" 
            tab="returns"
            description="Prepare and file your tax returns" 
          />
        </div>
      </div>

      {/* Upcoming Tax Deadlines */}
      <div className="border rounded-md p-4 mb-6">
        <h3 className="text-lg font-medium mb-3">Upcoming Tax Deadlines</h3>
        <div className="space-y-3">
          <DeadlineItem 
            title="VAT Return Q1" 
            date="April 30, 2024" 
            status="Due in 30 days" 
            type="VAT"
          />
          <DeadlineItem 
            title="Corporate Tax Payment" 
            date="June 15, 2024" 
            status="Due in 75 days" 
            type="Corporate Tax"
          />
          <DeadlineItem 
            title="Income Tax Filing" 
            date="July 31, 2024" 
            status="Due in 120 days" 
            type="Income Tax"
          />
        </div>
      </div>

      {/* Tax Records Table */}
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
              <Button variant="outline">
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
    </>
  );
}

// Helper components
function SummaryCard({ title, amount, change, dueDate }: { 
  title: string; 
  amount: number; 
  change?: string;
  dueDate?: string;
}) {
  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold mt-1">${amount.toLocaleString()}</p>
      {change && <p className="text-xs text-muted-foreground mt-1">{change} from last month</p>}
      {dueDate && <p className="text-xs text-muted-foreground mt-1">Due by {dueDate}</p>}
    </div>
  );
}

function QuickActionButton({ label, description, tab }: { 
  label: string; 
  description: string;
  tab: string;
}) {
  return (
    <button 
      className="bg-white rounded-lg border p-4 text-left hover:bg-gray-50 transition-colors"
      onClick={() => {
        const tabEl = document.querySelector(`[data-value="${tab}"]`) as HTMLButtonElement;
        if (tabEl) tabEl.click();
      }}
    >
      <h4 className="font-medium">{label}</h4>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </button>
  );
}

function DeadlineItem({ title, date, status, type }: { 
  title: string; 
  date: string;
  status: string;
  type: 'VAT' | 'Income Tax' | 'Corporate Tax';
}) {
  const colors = {
    'VAT': 'bg-blue-50 text-blue-800 border-blue-200',
    'Income Tax': 'bg-green-50 text-green-800 border-green-200',
    'Corporate Tax': 'bg-purple-50 text-purple-800 border-purple-200',
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-md border p-3">
      <div>
        <span className={`inline-block px-2 py-1 text-xs rounded-full ${colors[type]}`}>
          {type}
        </span>
        <h4 className="font-medium mt-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <div>
        <span className="px-3 py-1 bg-yellow-50 text-yellow-800 rounded-full text-xs">
          {status}
        </span>
      </div>
    </div>
  );
}
