'use client';
import { useState } from 'react';
import { Plus, X, Upload, Check, AlertCircle, Info, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const OrganizationSettings = () => {
  const [organization, setOrganization] = useState({
    name: 'Acme Corporation',
    logo: 'https://via.placeholder.com/150',
    description: 'Global leader in innovative solutions',
    defaultExpenseCurrency: 'USD',
    expenseApprovalThreshold: 500,
    expenseApprovalRequired: true,
    expenseReceiptRequired: true,
    expenseReceiptThreshold: 25,
  });

  const [categories, setCategories] = useState([
    { id: '1', name: 'Travel', description: 'Business travel expenses', code: 'TRV' },
    { id: '2', name: 'Office Supplies', description: 'Items for office use', code: 'OFF' },
    { id: '3', name: 'Software', description: 'Software licenses and subscriptions', code: 'SFT' },
  ]);

  const [newCategory, setNewCategory] = useState({ name: '', description: '', code: '' });
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setOrganization({
      ...organization,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value,
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.name) {
      // toast({
      //   title: 'Error',
      //   description: 'Category name is required',
      //   variant: 'destructive',
      // });
      return;
    }

    const id = (Math.random() * 1000).toString();
    setCategories([...categories, { id, ...newCategory }]);
    setNewCategory({ name: '', description: '', code: '' });
    setIsAddCategoryOpen(false);
    // toast({
    //   title: 'Success',
    //   description: 'Category added successfully',
    // });
  };

  const handleDeleteCategory = () => {
    setCategories(categories.filter(category => category.id !== categoryToDelete));
    setIsDeleteCategoryOpen(false);
    // toast({
    //   title: 'Success',
    //   description: 'Category removed',
    // });
  };

  const handleCategoryInputChange = e => {
    const { name, value } = e.target;
    setNewCategory({ ...newCategory, [name]: value });
  };

  const handleDragOver = e => {
    e.preventDefault();
    setIsDraggingLogo(true);
  };

  const handleDragLeave = () => {
    setIsDraggingLogo(false);
  };

  const handleDrop = e => {
    e.preventDefault();
    setIsDraggingLogo(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoChange(e.dataTransfer.files[0]);
    }
  };

  const handleLogoUpload = e => {
    if (e.target.files && e.target.files[0]) {
      handleLogoChange(e.target.files[0]);
    }
  };

  const handleLogoChange = async file => {
    setLogoFile(file);
    const preview = URL.createObjectURL(file);
    setOrganization({ ...organization, logo: preview });
    uploadLogo(file);
  };

  const uploadLogo = async file => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulating API response after 1.5 seconds
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockResponse = { url: URL.createObjectURL(file) };

      setOrganization({ ...organization, logo: mockResponse.url });
      // toast({
      //   title: 'Success',
      //   description: 'Logo uploaded successfully',
      // });
    } catch (error) {
      // toast({
      //   title: 'Error',
      //   description: 'Failed to upload logo. Please try again.',
      //   variant: 'destructive',
      // });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    console.log('Saving organization settings:', { organization, categories });
    // toast({
    //   title: 'Success',
    //   description: 'Settings saved successfully',
    // });
  };

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Organization Settings</h1>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="expenses">Expense Settings</TabsTrigger>
            <TabsTrigger value="categories">Expense Categories</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Identity</CardTitle>
                <CardDescription>Update your organization's name, description, and logo.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name</Label>
                      <Input id="name" name="name" value={organization.name} onChange={handleInputChange} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={organization.description}
                        onChange={handleInputChange}
                        rows={4}
                      />
                      <p className="text-sm text-muted-foreground">
                        Brief description of your organization's purpose and activities.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultExpenseCurrency">Default Currency</Label>
                      <Select
                        name="defaultExpenseCurrency"
                        value={organization.defaultExpenseCurrency}
                        onValueChange={value =>
                          setOrganization({
                            ...organization,
                            defaultExpenseCurrency: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(currency => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">Default currency for all expenses in the system.</p>
                    </div>
                  </div>

                  {/* Right column - Logo upload */}
                  <div className="space-y-4">
                    <Label>Organization Logo</Label>
                    <div
                      className={`flex justify-center px-6 pt-5 pb-6 border-2 ${isDraggingLogo ? 'border-primary bg-primary/10' : 'border-dashed border-border'} rounded-lg`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="space-y-4 text-center">
                        {organization.logo ? (
                          <div className="relative">
                            <img
                              src={organization.logo}
                              alt="Organization logo"
                              className="mx-auto h-32 w-32 object-cover rounded-lg"
                            />
                            {isUploading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        )}

                        <div className="flex text-sm text-muted-foreground justify-center">
                          <label
                            htmlFor="logo-upload"
                            className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/90"
                          >
                            <span>Upload a file</span>
                            <input
                              id="logo-upload"
                              name="logo-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              disabled={isUploading}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expense Settings */}
          <TabsContent value="expenses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Policies</CardTitle>
                <CardDescription>
                  Configure your organization's expense approval and receipt requirements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium">Expense Approval</h3>
                      <p className="text-sm text-muted-foreground">Require manager approval for submitted expenses</p>
                    </div>
                    <Switch
                      checked={organization.expenseApprovalRequired}
                      onCheckedChange={checked =>
                        setOrganization({
                          ...organization,
                          expenseApprovalRequired: checked,
                        })
                      }
                    />
                  </div>

                  {organization.expenseApprovalRequired && (
                    <Alert className="ml-6">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Approval Threshold</AlertTitle>
                      <AlertDescription>
                        <p className="mb-3">Expenses above this amount will require approval</p>
                        <div className="relative mt-1 max-w-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-sm text-muted-foreground">
                              {organization.defaultExpenseCurrency === 'USD' ? '$' : ''}
                            </span>
                          </div>
                          <Input
                            type="number"
                            name="expenseApprovalThreshold"
                            value={organization.expenseApprovalThreshold}
                            onChange={handleInputChange}
                            className="pl-7"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-sm text-muted-foreground">
                              {organization.defaultExpenseCurrency !== 'USD' ? organization.defaultExpenseCurrency : ''}
                            </span>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium">Receipt Requirement</h3>
                      <p className="text-sm text-muted-foreground">
                        Require receipt uploads for expense reimbursements
                      </p>
                    </div>
                    <Switch
                      checked={organization.expenseReceiptRequired}
                      onCheckedChange={checked =>
                        setOrganization({
                          ...organization,
                          expenseReceiptRequired: checked,
                        })
                      }
                    />
                  </div>

                  {organization.expenseReceiptRequired && (
                    <Alert className="ml-6">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Receipt Threshold</AlertTitle>
                      <AlertDescription>
                        <p className="mb-3">Receipts required for expenses above this amount</p>
                        <div className="relative mt-1 max-w-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-sm text-muted-foreground">
                              {organization.defaultExpenseCurrency === 'USD' ? '$' : ''}
                            </span>
                          </div>
                          <Input
                            type="number"
                            name="expenseReceiptThreshold"
                            value={organization.expenseReceiptThreshold}
                            onChange={handleInputChange}
                            className="pl-7"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-sm text-muted-foreground">
                              {organization.defaultExpenseCurrency !== 'USD' ? organization.defaultExpenseCurrency : ''}
                            </span>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expense Categories */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Expense Categories</CardTitle>
                    <CardDescription>Manage categories for organizing expenses</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddCategoryOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {categories.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map(category => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>
                            {category.code ? (
                              <Badge variant="outline">{category.code}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {category.description || <span className="text-muted-foreground">No description</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive/90"
                              onClick={() => {
                                setCategoryToDelete(category.id);
                                setIsDeleteCategoryOpen(true);
                              }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <svg
                      className="mx-auto h-12 w-12 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                    </svg>
                    <h3 className="text-sm font-medium">No categories</h3>
                    <p className="text-sm text-muted-foreground">Get started by creating a new expense category.</p>
                    <div className="mt-6">
                      <Button onClick={() => setIsAddCategoryOpen(true)}>
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Create New Category
                      </Button>
                    </div>
                  </div>
                )}

                <Alert className="mt-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>About Expense Categories</AlertTitle>
                  <AlertDescription>
                    Categories help organize expenses and generate accurate reports. Each category can have an optional
                    code for accounting purposes.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Changes are saved automatically</p>
          </div>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </footer>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Create a new expense category for your organization</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name*
              </Label>
              <Input
                id="name"
                name="name"
                value={newCategory.name}
                onChange={handleCategoryInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input
                id="code"
                name="code"
                value={newCategory.code}
                onChange={handleCategoryInputChange}
                className="col-span-3"
                placeholder="e.g. TRV"
                maxLength={5}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={newCategory.description}
                onChange={handleCategoryInputChange}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteCategoryOpen} onOpenChange={setIsDeleteCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteCategoryOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationSettings;
