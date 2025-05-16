import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; // For expense tags
import { Calendar } from '@/components/ui/calendar'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Info, InfoIcon } from 'lucide-react';

// Placeholder for your enum values (ensure these are correctly imported/defined)
const InventoryPolicy = {
  FIFO: 'FIFO',
  LIFO: 'LIFO',
  FEFO: 'FEFO',
};

const MeasurementUnit = {
  CUBIC_METER: 'CUBIC_METER',
  CUBIC_FEET: 'CUBIC_FEET',
  SQUARE_METER: 'SQUARE_METER',
  SQUARE_FEET: 'SQUARE_FEET',
  METER: 'METER',
  FEET: 'FEET',
  COUNT: 'COUNT',
  WEIGHT_KG: 'WEIGHT_KG',
  WEIGHT_LB: 'WEIGHT_LB',
};

export function CreateOrganizationPage() {
  // State management (e.g., React Hook Form with Zod resolver) would handle form data and validation errors

  const expenseTagOptions = ['Travel', 'Office Supplies', 'Software', 'Marketing']; // Example options

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-sky-100 dark:from-slate-900 dark:to-sky-950 flex flex-col items-center py-8 px-4 overflow-y-auto">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Create Your New Organization</CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-1">
            Fill in the details below to get your organization up and running.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4 p-6 border rounded-lg shadow-sm bg-card">
            <h3 className="text-xl font-semibold text-foreground">Basic Information</h3>
            <p className="text-sm text-muted-foreground">
              Start with the essentials. This information will help identify your organization.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Organization Name <span className="text-red-500">*</span>
                </Label>
                <Input id="name" placeholder="e.g., Acme Innovations Inc." className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">The official name of your organization. (Required)</p>
                {/* Validation Error: "Organization name is required." */}
              </div>
              <div>
                <Label htmlFor="slug" className="text-sm font-medium">
                  Organization Slug <span className="text-red-500">*</span>
                </Label>
                <Input id="slug" placeholder="e.g., acme-innovations" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  A unique, URL-friendly identifier (lowercase, numbers, hyphens). Min 2, Max 30 chars. (Required)
                </p>
                {/* Validation Errors: "Slug must be at least 2 characters.", "Slug must not exceed 30 characters.", "Slug can only contain lowercase letters, numbers, and hyphens." */}
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Tell us a bit about your organization (optional, max 500 characters)."
                className="mt-1 min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">A brief summary of what your organization does.</p>
              {/* Validation Error: "Description must not exceed 500 characters." */}
            </div>
            <div>
              <Label htmlFor="logo" className="text-sm font-medium">
                Logo URL
              </Label>
              <Input id="logo" type="url" placeholder="https://example.com/logo.png" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">
                Link to your organization's logo (optional). Must be a valid URL.
              </p>
              {/* Validation Error: "Invalid logo URL." */}
              {/* Consider adding a File Upload component here as an alternative/enhancement */}
            </div>
          </div>

          <Accordion type="multiple" className="w-full space-y-4">
            {/* Section 2: Expense Settings */}
            <AccordionItem value="expense-settings" className="border rounded-lg shadow-sm bg-card overflow-hidden">
              <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:bg-muted/50">
                Expense Settings
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Configure how expenses are managed within your organization.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2 space-y-6 bg-card">
                <div className="flex items-center justify-between space-x-4 p-4 border-b">
                  <div>
                    <Label htmlFor="expenseApprovalRequired" className="text-sm font-medium">
                      Expense Approval Required
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      If enabled, expenses above a certain threshold will require approval. (Default: No)
                    </p>
                  </div>
                  <Switch id="expenseApprovalRequired" defaultChecked={false} />
                </div>
                <div>
                  <Label htmlFor="expenseApprovalThreshold" className="text-sm font-medium">
                    Expense Approval Threshold
                  </Label>
                  <Input id="expenseApprovalThreshold" type="number" placeholder="e.g., 500" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum amount for an expense to require approval (if enabled). Must be a positive number.
                  </p>
                  {/* Validation Error: "Threshold must be a positive number." */}
                </div>
                <div className="flex items-center justify-between space-x-4 p-4 border-b">
                  <div>
                    <Label htmlFor="expenseReceiptRequired" className="text-sm font-medium">
                      Expense Receipt Required
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      If enabled, receipts will be mandatory for expenses, possibly above a threshold. (Default: Yes)
                    </p>
                  </div>
                  <Switch id="expenseReceiptRequired" defaultChecked={true} />
                </div>
                <div>
                  <Label htmlFor="expenseReceiptThreshold" className="text-sm font-medium">
                    Expense Receipt Threshold
                  </Label>
                  <Input id="expenseReceiptThreshold" type="number" placeholder="e.g., 50" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum amount for an expense to require a receipt (if enabled). Must be a positive number.
                  </p>
                  {/* Validation Error: "Threshold must be a positive number." */}
                </div>
                <div>
                  <Label htmlFor="expenseTagOptions" className="text-sm font-medium">
                    Expense Tag Options
                  </Label>
                  {/* This could be an input that allows adding tags, e.g., with pills/badges */}
                  <Input
                    id="expenseTagOptions"
                    placeholder="e.g., Travel, Food, Software (comma-separated)"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Define default tags users can select for expenses. (Enter comma-separated values)
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {/* Example of displaying tags */}
                    {expenseTagOptions.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: General Settings */}
            <AccordionItem value="general-settings" className="border rounded-lg shadow-sm bg-card overflow-hidden">
              <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:bg-muted/50">
                General Settings
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Define global defaults for your organization's operations.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2 space-y-6 bg-card">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="defaultCurrency" className="text-sm font-medium">
                      Default Currency
                    </Label>
                    <Input
                      id="defaultCurrency"
                      defaultValue="USD"
                      maxLength={3}
                      placeholder="e.g., USD"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Standard currency (3-letter code). (Default: USD)
                    </p>
                    {/* Validation Error: min(3), max(3) */}
                  </div>
                  <div>
                    <Label htmlFor="defaultTimezone" className="text-sm font-medium">
                      Default Timezone
                    </Label>
                    {/* Consider using a Select component populated with common timezones */}
                    <Input
                      id="defaultTimezone"
                      defaultValue="UTC"
                      placeholder="e.g., America/New_York"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Primary timezone for operations. (Default: UTC)
                    </p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="defaultTaxRate" className="text-sm font-medium">
                    Default Tax Rate (0-1)
                  </Label>
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="e.g., 0.07 for 7%"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Standard tax rate as a decimal (e.g., 0.05 for 5%). Optional.
                  </p>
                  {/* Validation Error: "Tax rate must be between 0 and 1." */}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 4: Inventory Settings */}
            <AccordionItem value="inventory-settings" className="border rounded-lg shadow-sm bg-card overflow-hidden">
              <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:bg-muted/50">
                Inventory Settings
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Customize how inventory is tracked and managed.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2 space-y-6 bg-card">
                <div>
                  <Label htmlFor="inventoryPolicy" className="text-sm font-medium">
                    Inventory Policy
                  </Label>
                  <Select defaultValue={InventoryPolicy.FEFO}>
                    <SelectTrigger id="inventoryPolicy" className="mt-1">
                      <SelectValue placeholder="Select inventory policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={InventoryPolicy.FIFO}>FIFO (First-In, First-Out)</SelectItem>
                      <SelectItem value={InventoryPolicy.LIFO}>LIFO (Last-In, First-Out)</SelectItem>
                      <SelectItem value={InventoryPolicy.FEFO}>FEFO (First-Expired, First-Out)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Method for valuing and moving inventory. (Default: FEFO)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="lowStockThreshold" className="text-sm font-medium">
                      Low Stock Threshold
                    </Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      defaultValue={10}
                      min="0"
                      placeholder="e.g., 10"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Alert level for low inventory items. Must be a non-negative integer. (Default: 10)
                    </p>
                    {/* Validation Error: "Threshold must be a non-negative integer." */}
                  </div>
                  <div className="flex items-center space-x-4 pt-6">
                    <Label htmlFor="negativeStock" className="text-sm font-medium whitespace-nowrap">
                      Allow Negative Stock
                    </Label>
                    <Switch id="negativeStock" defaultChecked={false} />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Permit stock levels to go below zero. (Default: No)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 5: Spatial Settings */}
            <AccordionItem value="spatial-settings" className="border rounded-lg shadow-sm bg-card overflow-hidden">
              <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:bg-muted/50">
                Spatial & Measurement Settings
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Configure settings related to physical space and units of measurement.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2 space-y-6 bg-card">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                  <div className="flex items-center justify-between space-x-2 p-3 rounded-md border">
                    <div>
                      <Label htmlFor="enableCapacityTracking" className="text-sm font-medium">
                        Enable Capacity Tracking
                      </Label>
                      <p className="text-xs text-muted-foreground">Track storage capacity. (Default: No)</p>
                    </div>
                    <Switch id="enableCapacityTracking" defaultChecked={false} />
                  </div>
                  <div className="flex items-center justify-between space-x-2 p-3 rounded-md border">
                    <div>
                      <Label htmlFor="enforceSpatialConstraints" className="text-sm font-medium">
                        Enforce Spatial Constraints
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Strictly enforce location capacities. (Default: No)
                      </p>
                    </div>
                    <Switch id="enforceSpatialConstraints" defaultChecked={false} />
                  </div>
                  <div className="flex items-center justify-between space-x-2 p-3 rounded-md border">
                    <div>
                      <Label htmlFor="enableProductDimensions" className="text-sm font-medium">
                        Enable Product Dimensions
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Allow specifying dimensions for products. (Default: No)
                      </p>
                    </div>
                    <Switch id="enableProductDimensions" defaultChecked={false} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div>
                    <Label htmlFor="defaultMeasurementUnit" className="text-sm font-medium">
                      Default Measurement Unit
                    </Label>
                    <Select defaultValue={MeasurementUnit.METER}>
                      <SelectTrigger id="defaultMeasurementUnit" className="mt-1">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(MeasurementUnit).map(unit => (
                          <SelectItem key={unit} value={unit}>
                            {unit
                              .replace(/_/g, ' ')
                              .toLowerCase()
                              .replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      General unit for measurements. (Default: Meter)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="defaultDimensionUnit" className="text-sm font-medium">
                      Default Dimension Unit
                    </Label>
                    <Select defaultValue={MeasurementUnit.METER}>
                      <SelectTrigger id="defaultDimensionUnit" className="mt-1">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          MeasurementUnit.CUBIC_METER,
                          MeasurementUnit.CUBIC_FEET,
                          MeasurementUnit.SQUARE_METER,
                          MeasurementUnit.SQUARE_FEET,
                          MeasurementUnit.METER,
                          MeasurementUnit.FEET,
                        ].map(unit => (
                          <SelectItem key={unit} value={unit}>
                            {unit
                              .replace(/_/g, ' ')
                              .toLowerCase()
                              .replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Unit for product/location dimensions. (Default: Meter)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="defaultWeightUnit" className="text-sm font-medium">
                      Default Weight Unit
                    </Label>
                    <Select defaultValue={MeasurementUnit.WEIGHT_KG}>
                      <SelectTrigger id="defaultWeightUnit" className="mt-1">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {[MeasurementUnit.WEIGHT_KG, MeasurementUnit.WEIGHT_LB].map(unit => (
                          <SelectItem key={unit} value={unit}>
                            {unit
                              .replace(/_/g, ' ')
                              .toLowerCase()
                              .replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Unit for product weights. (Default: KG)</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter className="flex flex-col items-center pt-8">
          {/* Optional: Display a summary of critical validation errors here if any */}
          {/* <div className="mb-4 text-sm text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="inline h-4 w-4 mr-1" /> Please correct the errors above.
          </div> */}
          <Button size="lg" className="w-full max-w-xs text-lg">
            Create Organization
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            By clicking "Create Organization", you agree to our{' '}
            <a href="/terms" className="underline hover:text-primary">
              Terms of Service
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
export default CreateOrganizationPage