'use client';

import { useState } from 'react';
import { format, addMonths, startOfMonth } from 'date-fns';
import { useVATSummary } from '../hooks';
import { useOrganization } from '@/hooks/use-organization';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DatePicker } from '@/components/ui/date-picker';
import { Download, TrendingUp, AlertCircle } from 'lucide-react';

export default function VATCalculation() {
  const { organization } = useOrganization();
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  
  const { vatSummary, loading, error } = useVATSummary(selectedMonth.toISOString());

  const chartData = [
    { name: 'Sales', value: vatSummary?.totalSales || 0 },
    { name: 'VAT Collected', value: vatSummary?.totalVAT || 0 },
    { name: 'VAT Paid', value: vatSummary?.totalVatPaid || 0 },
    { name: 'VAT Due', value: vatSummary?.vatDue || 0 },
  ];

  const handleExportVATReport = () => {
    // Implement export logic
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            Loading VAT data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6 text-red-500 flex items-center justify-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error loading VAT data: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>VAT Calculation</CardTitle>
            <CardDescription>
              VAT details based on your sales and purchases
            </CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <DatePicker
              date={selectedMonth}
              onChange={setSelectedMonth}
            />
            <Button variant="outline" onClick={handleExportVATReport}>
              <Download className="mr-2 h-4 w-4" />
              Export VAT Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${vatSummary?.totalSales.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">For {format(selectedMonth, 'MMMM yyyy')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">VAT Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${vatSummary?.totalVAT.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">At rate {vatSummary?.vatRate || '20%'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">VAT Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${vatSummary?.totalVatPaid.toLocaleString() || '0'}</div>
                  <p className="text-xs text-muted-foreground">Payments made</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">VAT Due</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(vatSummary?.vatDue || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${Math.abs(vatSummary?.vatDue || 0).toLocaleString()}
                    {(vatSummary?.vatDue || 0) > 0 ? ' (Payable)' : ' (Refundable)'}
                  </div>
                  <p className="text-xs text-muted-foreground">Due by {format(addMonths(selectedMonth, 1), 'MMMM dd, yyyy')}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="details">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">VAT Information</h3>
                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="text-muted-foreground">VAT Registration Number:</div>
                      <div className="font-medium">GB123456789</div>
                      
                      <div className="text-muted-foreground">VAT Period:</div>
                      <div className="font-medium">{format(selectedMonth, 'MMMM yyyy')}</div>
                      
                      <div className="text-muted-foreground">VAT Rate:</div>
                      <div className="font-medium">{vatSummary?.vatRate || '20%'}</div>
                      
                      <div className="text-muted-foreground">Filing Deadline:</div>
                      <div className="font-medium">{format(addMonths(selectedMonth, 1), 'MMMM dd, yyyy')}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">VAT Breakdown</h3>
                    <div className="grid grid-cols-2 gap-y-2">
                      <div className="text-muted-foreground">Standard Rate Sales:</div>
                      <div className="font-medium">${vatSummary?.totalSales.toLocaleString() || '0'}</div>
                      
                      <div className="text-muted-foreground">Zero Rate Sales:</div>
                      <div className="font-medium">$0</div>
                      
                      <div className="text-muted-foreground">VAT on Standard Rate Sales:</div>
                      <div className="font-medium">${vatSummary?.totalVAT.toLocaleString() || '0'}</div>
                      
                      <div className="text-muted-foreground">Total VAT on Purchases:</div>
                      <div className="font-medium">$0</div>
                      
                      <div className="text-muted-foreground">Net VAT Due:</div>
                      <div className={`font-medium ${(vatSummary?.vatDue || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${Math.abs(vatSummary?.vatDue || 0).toLocaleString()}
                        {(vatSummary?.vatDue || 0) > 0 ? ' (Payable)' : ' (Refundable)'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {(vatSummary?.vatDue || 0) > 0 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 p-4 rounded-md flex items-start">
            <TrendingUp className="h-5 w-5 text-amber-500 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800">VAT Payment Due</h4>
              <p className="text-sm text-amber-700 mt-1">
                You have a VAT payment of ${vatSummary?.vatDue.toLocaleString()} due by {format(addMonths(selectedMonth, 1), 'MMMM dd, yyyy')}.
                Click the button below to schedule this payment.
              </p>
              <Button size="sm" className="mt-2 bg-amber-500 hover:bg-amber-600">Schedule Payment</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 