'use client';
import { format } from 'date-fns';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  FileTextIcon,
  EditIcon,
  TrashIcon,
  ReceiptIcon,
  EyeIcon,
  CreditCardIcon,
  DollarSignIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  DownloadIcon,
  PlusIcon,
  FilterIcon,
  SearchIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Expense } from '@/lib/hooks/use-expenses';
import ExpenseDetails from './details-modal';

interface ExpensesListProps {
  expenses: Expense[];
  isLoading: boolean;
  pagination?: {
    totalPages?: number;
    currentPage?: number;
    totalExpenses?: number;
  };
  onPageChange?: (page: number) => void;
}

export function ExpensesList({ expenses = [], isLoading, pagination, onPageChange }: ExpensesListProps) {
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };


  const getStatusBadgeVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved') return 'success';
    if (statusLower === 'pending') return 'warning';
    if (statusLower === 'rejected') return 'destructive';
    if (statusLower === 'overdue') return 'destructive';
    return 'secondary';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved') return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    if (statusLower === 'pending') return <CheckCircleIcon className="h-4 w-4 text-yellow-500" />;
    if (statusLower === 'rejected') return <XCircleIcon className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getPaymentMethodIcon = (method: string) => {
    if (method === 'CREDIT_CARD') return <CreditCardIcon className="h-4 w-4" />;
    if (method === 'CASH') return <DollarSignIcon className="h-4 w-4" />;
    return <DollarSignIcon className="h-4 w-4" />;
  };

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const handleSelectExpense = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedExpenses);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedExpenses(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = expenses.map(expense => expense.id);
      setSelectedExpenses(new Set(allIds));
    } else {
      setSelectedExpenses(new Set());
    }
  };

  const openDetailsModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDetailsOpen(true);
  };

  const openQuickView = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsQuickViewOpen(true);
  };

  const filteredExpenses = expenses.filter(expense => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      expense.description.toLowerCase().includes(query) ||
      expense.expenseNumber.toLowerCase().includes(query) ||
      expense.category.name.toLowerCase().includes(query) ||
      expense.member?.user?.name?.toLowerCase().includes(query) ||
      false
    );
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-8 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800">
              <TableRow>
                <TableHead className="w-[40px]">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[40px]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!expenses.length) {
    return (
      <div className="border rounded-md py-16 text-center">
        <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No expenses found</h3>
        <p className="text-muted-foreground mb-6">Try adjusting your filters or add a new expense.</p>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add New Expense
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={selectedExpenses.size === expenses.length}
            onCheckedChange={checked => handleSelectAll(!!checked)}
          />
          <label htmlFor="select-all" className="text-sm font-medium">
            {selectedExpenses.size > 0 ? `${selectedExpenses.size} selected` : 'Select all'}
          </label>

          {selectedExpenses.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2">
                  Actions
                  <ChevronLeftIcon className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Approve Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <div className="relative w-full sm:w-[300px]">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              className="pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <FilterIcon className="h-4 w-4" />
          </Button>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            <span>New Expense</span>
          </Button>
        </div>
      </div>

      {/* Spreadsheet table */}
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedExpenses.size === expenses.length && expenses.length > 0}
                    onCheckedChange={checked => handleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead className="font-medium">Expense #</TableHead>
                <TableHead className="font-medium">Amount</TableHead>
                <TableHead className="font-medium">Date</TableHead>
                <TableHead className="font-medium">Description</TableHead>
                <TableHead className="font-medium">Category</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Created By</TableHead>
                <TableHead className="text-right font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map(expense => (
                <TableRow
                  key={expense.id}
                  className={`group transition-colors ${selectedExpenses.has(expense.id) ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                  onClick={() => openQuickView(expense)}
                >
                  <TableCell className="w-[40px]" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedExpenses.has(expense.id)}
                      onCheckedChange={checked => handleSelectExpense(expense.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{expense.expenseNumber}</TableCell>

                  <TableCell className="tabular-nums">
                    <div className="flex items-center gap-1">
                      {getPaymentMethodIcon(expense.paymentMethod)}
                      {formatCurrency(expense.amount)}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(expense.expenseDate)}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {expense.receiptUrl && <ReceiptIcon className="h-3 w-3 text-blue-500" />}
                      <span className="truncate max-w-[200px]">{expense.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">
                      {expense.category.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(expense.status)}
                      <Badge variant={getStatusBadgeVariant(expense.status)}>{expense.status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <UserIcon className="h-3 w-3" />
                      </div>
                      <span className="truncate max-w-[100px]">{expense.member?.user?.name || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8">
                          <MoreHorizontalIcon className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetailsModal(expense)}>
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <EditIcon className="h-4 w-4 mr-2" />
                          Edit Expense
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Expense
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.totalPages && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between py-4 px-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.currentPage || 1) - 1) * 10 + 1} to{' '}
              {Math.min((pagination.currentPage || 1) * 10, pagination.totalExpenses || 0)} of{' '}
              {pagination.totalExpenses || 0} expenses
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange((pagination.currentPage || 1) - 1)}
                disabled={pagination.currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange((pagination.currentPage || 1) + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <ExpenseDetails
       expense={selectedExpense}
       isOpen={isDetailsOpen}
       onClose={()=>setIsDetailsOpen(false)}
      />

      {/* Quick View Slide-over Panel */}
      <Sheet open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
        {selectedExpense && (
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                Quick View
              </SheetTitle>
              <SheetDescription>{selectedExpense.expenseNumber}</SheetDescription>
            </SheetHeader>

            <div className="py-6">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedExpense.description}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{formatDate(selectedExpense.expenseDate)}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(selectedExpense.status)}>{selectedExpense.status}</Badge>
                </div>

                <div className="flex items-baseline justify-between py-2 border-t border-b">
                  <span className="text-sm font-medium">Total Amount</span>
                  <span className="text-2xl font-bold">{formatCurrency(selectedExpense.amount)}</span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <span>{selectedExpense.category.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Payment Method</span>
                    <div className="flex items-center gap-1">
                      {getPaymentMethodIcon(selectedExpense.paymentMethod)}
                      <span>{selectedExpense.paymentMethod.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created By</span>
                    <span>{selectedExpense.member?.user?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Created On</span>
                    <span>{formatDate(selectedExpense.createdAt)}</span>
                  </div>
                </div>

                {selectedExpense.notes && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground italic">{selectedExpense.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <SheetFooter className="flex-col sm:flex-col gap-2 mt-auto pt-4">
              <div className="flex gap-2 w-full">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setIsQuickViewOpen(false);
                    openDetailsModal(selectedExpense);
                  }}
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View Full Details
                </Button>
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1">
                  <EditIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700">
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
              <SheetClose asChild>
                <Button variant="ghost" className="w-full mt-2">
                  Close
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
