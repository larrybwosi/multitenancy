import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { Expense, useApproveExpense, useRejectExpense } from '@/lib/hooks/use-expenses';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import {
  CalendarIcon,
  CheckCircleIcon,
  CreditCardIcon,
  DollarSignIcon,
  DownloadIcon,
  EditIcon,
  FileTextIcon,
  ReceiptIcon,
  XCircleIcon,
} from 'lucide-react';
import { useState } from 'react';

interface ExpenseDetailsProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpenseDetails({ expense, isOpen, onClose }: ExpenseDetailsProps) {
  const { mutateAsync: approveExpense, isPending: approving } = useApproveExpense();
  const { mutateAsync: rejectExpense, isPending: rejecting } = useRejectExpense();
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusBadgeVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'approved') return 'success';
    if (statusLower === 'pending') return 'warning';
    if (statusLower === 'rejected') return 'destructive';
    if (statusLower === 'overdue') return 'destructive';
    return 'secondary';
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    if (method === 'CREDIT_CARD') return <CreditCardIcon className="h-4 w-4" />;
    if (method === 'CASH') return <DollarSignIcon className="h-4 w-4" />;
    return <DollarSignIcon className="h-4 w-4" />;
  };

  const handleApprove = async () => {
    if (!expense) return;
    setIsSubmitting(true);
    try {
      await approveExpense({ id: expense.id, comments });
      onClose();
    } finally {
      setIsSubmitting(false);
      setIsApprovalModalOpen(false);
      setComments('');
    }
  };

  const handleReject = async () => {
    if (!expense || !comments.trim()) return;
    setIsSubmitting(true);
    try {
      await rejectExpense({ id: expense.id, comments });
      onClose();
    } finally {
      setIsSubmitting(false);
      setIsRejectionModalOpen(false);
      setComments('');
    }
  };

  return (
    <>
      <Dialog open={isOpen}>
        {expense && (
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileTextIcon className="h-5 w-5" />
                Expense Details
              </DialogTitle>
              <DialogDescription>View complete information about this expense</DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 px-1 py-2">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-medium text-muted-foreground">Expense Number</h4>
                    <p className="font-mono">{expense.expenseNumber}</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                    <div className="flex items-center gap-1">
                      <Badge variant={getStatusBadgeVariant(expense.status)}>{expense.status}</Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-medium text-muted-foreground">Created By</h4>
                    <p>{expense.member?.user?.name || '-'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-medium text-muted-foreground">Created On</h4>
                    <p>{formatDateTime(expense.createdAt)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-lg mb-4">Expense Information</h3>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                      <p>{expense.description}</p>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                      <p>{expense.category.name}</p>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-medium text-muted-foreground">Amount</h4>
                      <p className="text-lg font-semibold">{formatCurrency(expense.amount)}</p>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-medium text-muted-foreground">Tax Amount</h4>
                      <p>{expense.taxAmount ? formatCurrency(expense.taxAmount) : '-'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <p>{formatDate(expense.expenseDate)}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-medium text-muted-foreground">Payment Method</h4>
                      <div className="flex items-center gap-1">
                        {getPaymentMethodIcon(expense.paymentMethod)}
                        <p>{expense.paymentMethod.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                      <p className="italic text-muted-foreground">{expense.notes || 'No notes provided'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-medium text-muted-foreground">Billable</h4>
                      <p>{expense.isBillable ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-medium text-muted-foreground">Reimbursable</h4>
                      <p>{expense.isReimbursable ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                {expense.approver && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-lg mb-4">Approval Information</h3>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-medium text-muted-foreground">Approved By</h4>
                        <p>{expense.approver?.user?.name || '-'}</p>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-medium text-muted-foreground">Approval Date</h4>
                        <p>{expense.approvalDate ? formatDateTime(expense.approvalDate) : '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {expense.receiptUrl && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-lg mb-4">Receipt</h3>
                    <div className="border rounded-md p-6 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                      <div className="text-center">
                        <ReceiptIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                        <Button variant="outline" size="sm">
                          <DownloadIcon className="h-4 w-4 mr-2" />
                          Download Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onClose()}>
                Close
              </Button>
              <Button variant="outline">
                <EditIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {expense.status === 'PENDING' && (
                <>
                  <Button variant="destructive" onClick={() => setIsRejectionModalOpen(true)} disabled={rejecting}>
                    {rejecting ? (
                      <>
                        Rejecting
                        <Spinner className="ml-2" />
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                  <Button variant="default" onClick={() => setIsApprovalModalOpen(true)} disabled={approving}>
                    {approving ? (
                      <>
                        Approving
                        <Spinner className="ml-2" />
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Approval Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-success" />
              Approve Expense
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this expense? You can add optional comments below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Optional comments (visible to submitter)"
              value={comments}
              onChange={e => setComments(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  Approving
                  <Spinner className="ml-2" />
                </>
              ) : (
                'Approve Expense'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircleIcon className="h-5 w-5 text-destructive" />
              Reject Expense
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this expense? Please provide a reason below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Required comments (visible to submitter)"
              value={comments}
              onChange={e => setComments(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!comments.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  Rejecting
                  <Spinner className="ml-2" />
                </>
              ) : (
                'Reject Expense'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
