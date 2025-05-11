'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useTaxReturns } from '../hooks';
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
import { FileText, Upload, Plus, Download, Eye } from 'lucide-react';
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

const taxReturnFormSchema = z.object({
  period: z.string().min(1, "Period is required"),
  type: z.enum(['VAT Return', 'Income Tax Return', 'Corporate Tax Return']),
  amount: z.number().min(0),
  filingDate: z.date(),
  dueDate: z.date(),
  status: z.enum(['Draft', 'Filed', 'Approved', 'Rejected']),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional(),
});

export default function TaxReturns() {
  const { organization } = useOrganization();
  const { taxReturns, loading, error } = useTaxReturns();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<string | null>(null);

  const form = useForm<z.infer<typeof taxReturnFormSchema>>({
    resolver: zodResolver(taxReturnFormSchema),
    defaultValues: {
      period: `${new Date().getFullYear()} Q${Math.floor(new Date().getMonth() / 3) + 1}`,
      type: 'VAT Return',
      amount: 0,
      filingDate: new Date(),
      dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: 'Draft',
      attachments: [],
    },
  });

  const handleAddTaxReturn = async (values: z.infer<typeof taxReturnFormSchema>) => {
    if (!organization) return;

    try {
      const response = await fetch('/api/taxes/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          organizationId: organization.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tax return');
      }

      // Close modal and reset form
      setIsAddModalOpen(false);
      form.reset();
      
      // You might want to refresh the returns here
      window.location.reload();
    } catch (error) {
      console.error('Error filing tax return:', error);
    }
  };

  const viewTaxReturn = (id: string) => {
    setSelectedReturn(id);
    // Implement viewing logic
  };

  const downloadTaxReturn = (id: string) => {
    // Implement download logic
  };

  if (loading) {
    return <div>Loading tax returns...</div>;
  }

  if (error) {
    return <div>Error loading tax returns: {error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Tax Returns</CardTitle>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                File New Return
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>File Tax Return</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddTaxReturn)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="2024 Q1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return Type</FormLabel>
                        <FormControl>
                          <select
                            className="w-full p-2 border rounded-md"
                            {...field}
                          >
                            <option value="VAT Return">VAT Return</option>
                            <option value="Income Tax Return">Income Tax Return</option>
                            <option value="Corporate Tax Return">Corporate Tax Return</option>
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="filingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Filing Date</FormLabel>
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
                  </div>
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
                            <option value="Draft">Draft</option>
                            <option value="Filed">Filed</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="border rounded p-4">
                    <FormLabel className="block mb-2">Attachments</FormLabel>
                    <div className="py-2 px-4 bg-gray-50 rounded flex items-center justify-center border border-dashed cursor-pointer">
                      <Upload className="mr-2 h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Upload files</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Drag and drop files or click to upload supporting documents
                    </p>
                  </div>
                  <Button type="submit" className="w-full">File Tax Return</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {taxReturns.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No tax returns found. File your first tax return.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Filing Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attachments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxReturns.map((taxReturn) => (
                <TableRow key={taxReturn.id}>
                  <TableCell>{taxReturn.period}</TableCell>
                  <TableCell>{taxReturn.type}</TableCell>
                  <TableCell>${taxReturn.amount.toLocaleString()}</TableCell>
                  <TableCell>{format(taxReturn.filingDate, 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(taxReturn.dueDate, 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      taxReturn.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      taxReturn.status === 'Filed' ? 'bg-blue-100 text-blue-800' :
                      taxReturn.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {taxReturn.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {taxReturn.attachments.length > 0 ? (
                      <div className="flex items-center">
                        <FileText className="mr-1 h-4 w-4 text-muted-foreground" />
                        <span>{taxReturn.attachments.length}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => viewTaxReturn(taxReturn.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => downloadTaxReturn(taxReturn.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
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