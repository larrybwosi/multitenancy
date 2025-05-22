'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Calendar, CreditCard, Download, Package, Printer, Receipt, User } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { useGetSale } from '@/lib/hooks/use-sales';
import { MotionDiv, MotionSpan } from '@/components/motion';
import { formatCurrency } from '@/lib/utils';
import jsPDF from 'jspdf';

// Color palette
const COLORS = {
  primary: '#6366f1', // Indigo
  secondary: '#f43f5e', // Rose
  accent: '#f59e0b', // Amber
  background: '#f8fafc', // Slate-50
  text: '#1e293b', // Slate-800
  muted: '#64748b', // Slate-500
  success: '#10b981', // Emerald
  warning: '#f59e0b', // Amber
  error: '#ef4444', // Red
};

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Helper functions
const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours() % 12 || 12;
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

  return {
    date: `${month} ${day}, ${year}`,
    time: `${hours}:${minutes} ${ampm}`,
  };
};

export function SaleDetailsSheet({
  saleId,
  onOpenChange,
}: {
  saleId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isHoveringPrint, setIsHoveringPrint] = useState(false);
  const [isHoveringDownload, setIsHoveringDownload] = useState(false);

  const { data: saleDetails, isLoading, error } = useGetSale(saleId);

  // Handle errors with toast
  if (error) {
    toast.error('Failed to load sale details', {
      description: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Print function
  const handlePrint = async() => {
    
    const printBuffer = await fetch(`/api/sales/${saleId}/pdf`, {
      method: 'POST',
    });
    const blob = await printBuffer.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  };

  // Download as PDF function
  const handleDownloadPDF = async () => {
    const content = document.getElementById('sale-details-content');
    if (!content) {
      toast.error('Could not generate PDF');
      return;
    }

    try {
      toast.loading('Generating PDF...');
      const html2canvas = await require('html2canvas-pro');
      const canvas = await html2canvas(content, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 190;
      const pageHeight = 290;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Receipt-${saleDetails?.saleNumber || 'sale'}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (err) {
      toast.error('Failed to generate PDF', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  return (
    <Sheet open={!!saleId} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto px-4" style={{ backgroundColor: COLORS.background }}>
        {isLoading ? (
          <MotionDiv initial="hidden" animate="visible" variants={staggerVariants} className="space-y-6">
            <SheetHeader className="pb-4 border-b">
              <Skeleton className="h-8 w-48 rounded-full" style={{ backgroundColor: COLORS.muted + '20' }} />
              <Skeleton className="h-5 w-72 mt-2 rounded-full" style={{ backgroundColor: COLORS.muted + '20' }} />
            </SheetHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <MotionDiv variants={cardVariants}>
                  <Skeleton className="h-20 w-full rounded-xl" style={{ backgroundColor: COLORS.muted + '20' }} />
                </MotionDiv>
                <MotionDiv variants={cardVariants}>
                  <Skeleton className="h-20 w-full rounded-xl" style={{ backgroundColor: COLORS.muted + '20' }} />
                </MotionDiv>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <MotionDiv variants={cardVariants}>
                  <Skeleton className="h-20 w-full rounded-xl" style={{ backgroundColor: COLORS.muted + '20' }} />
                </MotionDiv>
                <MotionDiv variants={cardVariants}>
                  <Skeleton className="h-20 w-full rounded-xl" style={{ backgroundColor: COLORS.muted + '20' }} />
                </MotionDiv>
              </div>

              <MotionDiv variants={cardVariants}>
                <Skeleton className="h-6 w-24 mb-3 rounded-full" style={{ backgroundColor: COLORS.muted + '20' }} />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-20 w-full rounded-xl"
                      style={{ backgroundColor: COLORS.muted + '20' }}
                    />
                  ))}
                </div>
              </MotionDiv>

              <MotionDiv variants={cardVariants} className="border-t pt-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-6 w-full rounded-full"
                      style={{ backgroundColor: COLORS.muted + '20' }}
                    />
                  ))}
                </div>
              </MotionDiv>
            </div>
          </MotionDiv>
        ) : saleDetails ? (
          <AnimatePresence>
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div className="flex justify-between items-center mb-6">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-2xl font-bold flex items-center gap-2" style={{ color: COLORS.text }}>
                    <MotionDiv whileHover={{ rotate: -10 }} whileTap={{ scale: 0.9 }}>
                      <Receipt className="h-5 w-5" style={{ color: COLORS.primary }} />
                    </MotionDiv>
                    Sale #{saleDetails.saleNumber}
                  </SheetTitle>
                  <SheetDescription style={{ color: COLORS.muted }}>
                    View the complete details of this transaction
                  </SheetDescription>
                </SheetHeader>

                <div className="flex gap-2">
                  <MotionDiv
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setIsHoveringPrint(true)}
                    onHoverEnd={() => setIsHoveringPrint(false)}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePrint}
                      disabled={isPrinting}
                      style={{
                        borderColor: COLORS.primary,
                        color: COLORS.primary,
                        backgroundColor: isHoveringPrint ? COLORS.primary + '10' : 'transparent',
                      }}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </MotionDiv>
                  <MotionDiv
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setIsHoveringDownload(true)}
                    onHoverEnd={() => setIsHoveringDownload(false)}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadPDF}
                      style={{
                        borderColor: COLORS.secondary,
                        color: COLORS.secondary,
                        backgroundColor: isHoveringDownload ? COLORS.secondary + '10' : 'transparent',
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Save PDF
                    </Button>
                  </MotionDiv>
                </div>
              </div>

              <Separator className="my-4" style={{ backgroundColor: COLORS.muted + '30' }} />

              <div id="sale-details-content" className="space-y-6">
                {/* Info cards */}
                <MotionDiv
                  className="grid grid-cols-2 gap-6"
                  variants={staggerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <MotionDiv variants={cardVariants}>
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: 'white' }}>
                      <CardHeader className="pb-2">
                        <CardTitle
                          className="text-sm font-medium flex items-center gap-2"
                          style={{ color: COLORS.muted }}
                        >
                          <MotionDiv whileHover={{ rotate: 15 }}>
                            <Calendar className="h-4 w-4" style={{ color: COLORS.accent }} />
                          </MotionDiv>
                          Date & Time
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium" style={{ color: COLORS.text }}>
                          {formatDate(saleDetails.saleDate).date}
                        </p>
                        <p className="text-sm" style={{ color: COLORS.muted }}>
                          {formatDate(saleDetails.saleDate).time}
                        </p>
                      </CardContent>
                    </Card>
                  </MotionDiv>

                  <MotionDiv variants={cardVariants}>
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: 'white' }}>
                      <CardHeader className="pb-2">
                        <CardTitle
                          className="text-sm font-medium flex items-center gap-2"
                          style={{ color: COLORS.muted }}
                        >
                          <MotionDiv whileHover={{ rotate: 15 }}>
                            <User className="h-4 w-4" style={{ color: COLORS.accent }} />
                          </MotionDiv>
                          Customer
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium" style={{ color: COLORS.text }}>
                          {saleDetails.customerId ? saleDetails.customer?.name || 'Customer' : 'Walk-in Customer'}
                        </p>
                        {saleDetails.customer?.email && (
                          <p className="text-sm truncate" style={{ color: COLORS.muted }}>
                            {saleDetails.customer.email}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </MotionDiv>

                  <MotionDiv variants={cardVariants}>
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: 'white' }}>
                      <CardHeader className="pb-2">
                        <CardTitle
                          className="text-sm font-medium flex items-center gap-2"
                          style={{ color: COLORS.muted }}
                        >
                          <MotionDiv whileHover={{ rotate: 15 }}>
                            <CreditCard className="h-4 w-4" style={{ color: COLORS.accent }} />
                          </MotionDiv>
                          Payment Method
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium capitalize" style={{ color: COLORS.text }}>
                          {saleDetails?.paymentMethod?.toLowerCase()?.replace('_', ' ')}
                        </p>
                      </CardContent>
                    </Card>
                  </MotionDiv>

                  <MotionDiv variants={cardVariants}>
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: 'white' }}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium" style={{ color: COLORS.muted }}>
                          Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MotionDiv whileHover={{ scale: 1.05 }}>
                          <Badge
                            className="text-sm py-1"
                            variant={
                              saleDetails.paymentStatus === 'COMPLETED'
                                ? 'default'
                                : saleDetails.paymentStatus === 'PENDING'
                                  ? 'secondary'
                                  : saleDetails.paymentStatus === 'FAILED' || saleDetails.paymentStatus === 'CANCELLED'
                                    ? 'destructive'
                                    : 'outline'
                            }
                            style={{
                              backgroundColor:
                                saleDetails.paymentStatus === 'COMPLETED'
                                  ? COLORS.success
                                  : saleDetails.paymentStatus === 'PENDING'
                                    ? COLORS.warning
                                    : saleDetails.paymentStatus === 'FAILED' ||
                                        saleDetails.paymentStatus === 'CANCELLED'
                                      ? COLORS.error
                                      : undefined,
                            }}
                          >
                            {saleDetails.paymentStatus.charAt(0) + saleDetails.paymentStatus.slice(1).toLowerCase()}
                          </Badge>
                        </MotionDiv>
                      </CardContent>
                    </Card>
                  </MotionDiv>
                </MotionDiv>

                {/* Items section */}
                <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="border-0 shadow-sm overflow-hidden" style={{ backgroundColor: 'white' }}>
                    <CardHeader className="pb-2">
                      <CardTitle
                        className="text-sm font-medium flex items-center gap-2"
                        style={{ color: COLORS.muted }}
                      >
                        <MotionDiv whileHover={{ rotate: 15 }}>
                          <Package className="h-4 w-4" style={{ color: COLORS.accent }} />
                        </MotionDiv>
                        Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="rounded-lg overflow-hidden border" style={{ borderColor: COLORS.muted + '30' }}>
                        {/* Header */}
                        <div
                          className="grid grid-cols-12 px-4 py-3 text-sm font-medium"
                          style={{
                            backgroundColor: COLORS.primary + '10',
                            color: COLORS.primary,
                          }}
                        >
                          <div className="col-span-1"></div>
                          <div className="col-span-5">Product</div>
                          <div className="col-span-2 text-center">Price</div>
                          <div className="col-span-2 text-center">Qty</div>
                          <div className="col-span-2 text-right">Total</div>
                        </div>

                        {/* Items */}
                        {saleDetails.items?.map((item, index) => (
                          <MotionDiv
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 grid grid-cols-12 items-center hover:bg-muted/5 transition-colors border-t"
                            style={{ borderColor: COLORS.muted + '20' }}
                          >
                            <div className="col-span-1">
                              {item.variant?.product.imageUrls ? (
                                <MotionDiv whileHover={{ scale: 1.1 }} className="relative h-10 w-10">
                                  {item.variant.product.imageUrls?.[0] ?
                                    <Image
                                    src={item?.variant.product.imageUrls?.[0]}
                                    alt={item?.variant?.product.name}
                                    fill
                                    className="rounded-md object-cover border"
                                    style={{ borderColor: COLORS.muted + '30' }}
                                  />:(
                                    <div
                                      className="h-10 w-10 rounded-md flex items-center justify-center border"
                                      style={{
                                        backgroundColor: COLORS.muted + '10',
                                        borderColor: COLORS.muted + '30',
                                      }}
                                    >
                                      <Package className="h-5 w-5" style={{ color: COLORS.muted }} />
                                    </div>
                                  )}
                                </MotionDiv>
                              ) : (
                                <div
                                  className="h-10 w-10 rounded-md flex items-center justify-center border"
                                  style={{
                                    backgroundColor: COLORS.muted + '10',
                                    borderColor: COLORS.muted + '30',
                                  }}
                                >
                                  <Package className="h-5 w-5" style={{ color: COLORS.muted }} />
                                </div>
                              )}
                            </div>
                            <div className="col-span-5">
                              <p className="font-medium" style={{ color: COLORS.text }}>
                                {item?.variant?.product.name}
                              </p>
                              <p className="text-xs" style={{ color: COLORS.muted }}>
                                SKU: {item?.variant?.sku}
                              </p>
                            </div>
                            <div className="col-span-2 text-center text-sm" style={{ color: COLORS.text }}>
                              {formatCurrency(item?.variant?.retailPrice)}
                            </div>
                            <div className="col-span-2 text-center">
                              <MotionSpan
                                whileHover={{ scale: 1.1 }}
                                className="inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-full text-sm font-medium"
                                style={{
                                  backgroundColor: COLORS.primary + '10',
                                  color: COLORS.primary,
                                }}
                              >
                                {item.quantity}
                              </MotionSpan>
                            </div>
                            <div className="col-span-2 text-right font-medium" style={{ color: COLORS.text }}>
                              {formatCurrency(item.price || 0)}
                            </div>
                          </MotionDiv>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </MotionDiv>

                {/* Totals section */}
                <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Separator className="my-4" style={{ backgroundColor: COLORS.muted + '30' }} />
                  <div
                    className="space-y-2 max-w-xs ml-auto p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'white',
                      borderColor: COLORS.muted + '30',
                    }}
                  >
                    <div className="flex justify-between text-sm">
                      <span style={{ color: COLORS.muted }}>Subtotal</span>
                      <span style={{ color: COLORS.text }}>{formatCurrency(saleDetails?.subTotal || 0)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span style={{ color: COLORS.muted }}>Tax</span>
                      <span style={{ color: COLORS.text }}>{formatCurrency(saleDetails.taxAmount || 0)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span style={{ color: COLORS.muted }}>Discount</span>
                      <span style={{ color: COLORS.text }}>{formatCurrency(saleDetails.discountAmount || 0)}</span>
                    </div>

                    <Separator className="my-2" style={{ backgroundColor: COLORS.muted + '30' }} />

                    <MotionDiv className="flex justify-between font-medium pt-1" whileHover={{ scale: 1.01 }}>
                      <span style={{ color: COLORS.text }}>Total</span>
                      <span className="text-lg font-bold" style={{ color: COLORS.primary }}>
                        {formatCurrency(saleDetails.finalAmount)}
                      </span>
                    </MotionDiv>
                  </div>
                </MotionDiv>
              </div>
            </MotionDiv>
          </AnimatePresence>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
