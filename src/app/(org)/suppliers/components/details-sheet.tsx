import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  ShoppingBag,
  DollarSign,
  FileText,
  AlertTriangle,
  Package,
  BarChart4,
  ArrowUpRight,
  Search,
  ChevronRight,
  ChevronLeft,
  Download,
  Printer,
  Filter,
  History,
  Boxes,
  CircleDollarSign,
  Info
} from 'lucide-react';
import { SupplierInfo, SupplierStockHistoryItem, SupplierStockHistoryResponse } from '@/lib/types/suppliers';

// Props interface for the component
interface SupplierDetailsSheetProps {
  supplier: SupplierInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fetch supplier stock history
const fetchSupplierStockHistory = async (supplierId: string, page = 1, pageSize = 10) => {
  if (!supplierId) return null;
  
  const response = await fetch(`/api/suppliers/${supplierId}/stock-history?page=${page}&pageSize=${pageSize}`);
  if (!response.ok) {
    throw new Error('Failed to fetch supplier stock history');
  }
  return response.json() as Promise<SupplierStockHistoryResponse>;
};

export function SupplierDetailsSheet({ supplier, open, onOpenChange }: SupplierDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset page when supplier changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
  }, [supplier?.id]);

  // Fetch supplier stock history
  const { data, isLoading, error } = useQuery({
    queryKey: ['supplierStockHistory', supplier?.id, currentPage, pageSize, searchTerm],
    queryFn: () => (supplier?.id ? fetchSupplierStockHistory(supplier.id, currentPage, pageSize) : null),
    enabled: !!supplier?.id && open,
  });
console.log(data);
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is handled via the query key changing
  };

  // Format currency
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get status badge color based on expiry
  const getExpiryStatusBadge = (item: SupplierStockHistoryItem) => {
    if (!item.expiryDate) return null;

    if (item.isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (item.daysUntilExpiry !== null && item.daysUntilExpiry < 30) {
      return <Badge variant="warning">Expiring soon</Badge>;
    }

    return <Badge variant="outline">Valid</Badge>;
  };

  // Get stock status badge
  const getStockStatusBadge = (item: SupplierStockHistoryItem) => {
    if (item.quantityRemaining === null) return null;

    if (item.quantityRemaining === 0) {
      return <Badge variant="destructive">Out of stock</Badge>;
    }

    if (item.quantityRemaining < item.quantityReceived! * 0.2) {
      return <Badge variant="warning">Low stock</Badge>;
    }

    return <Badge variant="outline">In stock</Badge>;
  };

  if (!supplier) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[900px] p-0 overflow-hidden flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex gap-4 items-center">
              <Avatar className="h-16 w-16 bg-primary/10">
                <AvatarFallback className="text-lg font-semibold text-primary">
                  {getInitials(supplier.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-2xl flex items-center gap-2 mb-1">
                  <Building2 className="h-5 w-5 text-primary" />
                  {supplier.name}
                </SheetTitle>
                <SheetDescription className="flex flex-wrap gap-2 mt-1">
                  <Badge variant="outline" className="bg-primary/5 gap-1 flex items-center">
                    <Info className="h-3 w-3" />
                    ID: {supplier.id.substring(0, 8)}
                  </Badge>
                  {supplier.contactPerson && (
                    <Badge variant="outline" className="bg-primary/5 gap-1 flex items-center">
                      <User className="h-3 w-3" />
                      {supplier.contactPerson}
                    </Badge>
                  )}
                </SheetDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </SheetHeader>

        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="px-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="overview" className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                Purchase History
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1">
                <BarChart4 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 overflow-auto p-6 pt-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Supplier Details Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Supplier Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supplier.contactPerson && (
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Contact Person</p>
                        <p className="text-sm text-muted-foreground">{supplier.contactPerson}</p>
                      </div>
                    </div>
                  )}

                  {supplier.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{supplier.email}</p>
                      </div>
                    </div>
                  )}

                  {supplier.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{supplier.phone}</p>
                      </div>
                    </div>
                  )}

                  {supplier.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{supplier.address}</p>
                      </div>
                    </div>
                  )}

                  {supplier.paymentTerms && (
                    <div className="flex items-start gap-3">
                      <CircleDollarSign className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Payment Terms</p>
                        <p className="text-sm text-muted-foreground">{supplier.paymentTerms}</p>
                      </div>
                    </div>
                  )}

                  {supplier.leadTime !== null && supplier.leadTime !== undefined && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Lead Time</p>
                        <p className="text-sm text-muted-foreground">{supplier.leadTime} days</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Overview Metrics Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart4 className="h-4 w-4 text-primary" />
                    Purchasing Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    Array(4)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                      ))
                  ) : error ? (
                    <div className="text-sm text-muted-foreground">Error loading data. Please try again.</div>
                  ) : data ? (
                    <>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Total Spent</p>
                        <p className="text-xl font-semibold">{formatCurrency(data.supplierInfo.totalSpent)}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">Last Order</p>
                        <p className="text-sm font-semibold">{formatDate(data.supplierInfo.lastOrderDate)}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">Total Products Purchased</p>
                        <p className="text-sm font-semibold">{data.summary.totalProducts} products</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">Inventory Status</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-primary/5">
                            {data.summary.totalActiveStock} in stock
                          </Badge>
                          {data.summary.expiredCount > 0 && (
                            <Badge variant="destructive">{data.summary.expiredCount} expired</Badge>
                          )}
                          {data.summary.upcomingExpiryCount > 0 && (
                            <Badge variant="warning">{data.summary.upcomingExpiryCount} expiring soon</Badge>
                          )}
                        </div>
                      </div>

                      {data.summary.highestValueProduct && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Highest Value Product</p>
                          <p className="text-sm font-semibold">
                            {data.summary.highestValueProduct.productName}
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              ({formatCurrency(data.summary.highestValueProduct.totalValue)})
                            </span>
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No data available. Select a supplier to view details.
                    </div>
                  )}
                </CardContent>
                {data && data.summary.byCategory.length > 0 && (
                  <CardFooter className="flex flex-col items-start pt-0">
                    <p className="text-sm font-medium mb-2">Purchases by Category</p>
                    <div className="space-y-3 w-full">
                      {data.summary.byCategory.slice(0, 3).map(category => (
                        <div key={category.category} className="space-y-1 w-full">
                          <div className="flex justify-between text-xs">
                            <span>{category.category}</span>
                            <span>{formatCurrency(category.totalValue)}</span>
                          </div>
                          <Progress value={category.percentage} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </CardFooter>
                )}
              </Card>
            </div>

            {/* Recent Purchases Section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Recent Purchases
              </h3>

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : error ? (
                <div className="text-sm text-muted-foreground">Error loading purchase history. Please try again.</div>
              ) : data && data.items.length > 0 ? (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Purchase #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.slice(0, 5).map(item => (
                        <TableRow key={item.purchaseItemId}>
                          <TableCell className="font-medium">
                            {item.purchaseNumber || `#${item.purchaseId.substring(0, 8)}`}
                          </TableCell>
                          <TableCell>{formatDate(item.purchaseDate)}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantityPurchased}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.totalBuyingPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No purchase history available for this supplier.</div>
              )}

              {data && data.items.length > 5 && (
                <div className="mt-3 text-right">
                  <Button
                    variant="link"
                    className="flex items-center gap-1 ml-auto"
                    onClick={() => setActiveTab('history')}
                  >
                    View all purchases
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Purchase History Tab */}
          <TabsContent value="history" className="flex-1 overflow-hidden flex flex-col p-6 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Purchase History
              </h3>
              <div className="flex items-center gap-2">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Search by product name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="max-w-[200px]"
                  />
                  <Button type="submit" variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="space-y-4 w-full max-w-md">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-lg font-medium">Error Loading Data</p>
                  <p className="text-sm text-muted-foreground">Could not load purchase history. Please try again.</p>
                </div>
              </div>
            ) : data && data.items.length > 0 ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Products</p>
                          <p className="text-lg font-semibold">{data.summary.totalProducts}</p>
                        </div>
                        <Package className="h-8 w-8 text-primary/20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Quantity</p>
                          <p className="text-lg font-semibold">{data.summary.totalQuantityPurchased}</p>
                        </div>
                        <Boxes className="h-8 w-8 text-primary/20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Value</p>
                          <p className="text-lg font-semibold">{formatCurrency(data.summary.totalValuePurchased)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-primary/20" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg. Price/Unit</p>
                          <p className="text-lg font-semibold">{formatCurrency(data.summary.averagePricePerUnit)}</p>
                        </div>
                        <CircleDollarSign className="h-8 w-8 text-primary/20" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Data Table */}
                <div className="flex-1 overflow-auto border rounded-md">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Purchase #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Price/Unit</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.items.map(item => (
                        <TableRow key={item.purchaseItemId}>
                          <TableCell className="font-medium">
                            {item.purchaseNumber || `#${item.purchaseId.substring(0, 8)}`}
                          </TableCell>
                          <TableCell>{formatDate(item.purchaseDate)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              {item.productSku && (
                                <div className="text-xs text-muted-foreground">SKU: {item.productSku}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-primary/5">
                              {item.productCategory}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>{item.quantityPurchased}</div>
                            {item.quantityReceived !== null && item.quantityReceived !== item.quantityPurchased && (
                              <div className="text-xs text-muted-foreground">{item.quantityReceived} received</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.buyingPricePerUnit)}
                            {item.unit && <span className="text-xs text-muted-foreground">/{item.unit}</span>}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.totalBuyingPrice)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getStockStatusBadge(item)}
                              {getExpiryStatusBadge(item)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, data.totalItems)}{' '}
                      of {data.totalItems} items
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!data.hasPreviousPage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                          const pageNumber = i + 1;
                          return (
                            <Button
                              key={pageNumber}
                              variant={pageNumber === currentPage ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(pageNumber)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                        {data.totalPages > 5 && <span className="mx-1">...</span>}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!data.hasNextPage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-lg font-medium">No Purchase History</p>
                  <p className="text-sm text-muted-foreground">
                    There are no purchases recorded for this supplier yet.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="flex-1 overflow-auto p-6 pt-4">
            <div className="grid gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart4 className="h-4 w-4 text-primary" />
                    Purchasing Analytics
                  </CardTitle>
                  <CardDescription>Analysis of purchasing patterns with this supplier</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-48 w-full" />
                      <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="text-lg font-medium">Analytics Unavailable</p>
                      <p className="text-sm text-muted-foreground">Could not load analytics data. Please try again.</p>
                    </div>
                  ) : data ? (
                    <div className="space-y-6">
                      <div className="h-64 bg-muted/50 rounded-md flex items-center justify-center">
                        <p className="text-muted-foreground">Purchasing Trends Chart (Placeholder)</p>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="border rounded-md p-4">
                          <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
                          <p className="text-xl font-semibold mt-1">{formatCurrency(data.summary.averageOrderValue)}</p>
                        </div>
                        <div className="border rounded-md p-4">
                          <p className="text-sm font-medium text-muted-foreground">Avg. Order Frequency</p>
                          <p className="text-xl font-semibold mt-1">
                            Every {data.summary.averageOrderFrequencyDays} days
                          </p>
                        </div>
                        <div className="border rounded-md p-4">
                          <p className="text-sm font-medium text-muted-foreground">On-Time Delivery</p>
                          <p className="text-xl font-semibold mt-1">{data.supplierInfo.leadTime}%</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded-md p-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Top Products by Value</p>
                          <div className="space-y-3">
                            {data.summary?.topProductsByValue?.map((product, i) => (
                              <div key={i} className="flex justify-between">
                                <p className="text-sm">{product.productName}</p>
                                <p className="text-sm font-medium">{formatCurrency(product.totalValue)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="border rounded-md p-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Top Categories</p>
                          <div className="space-y-3">
                            {data.summary.byCategory?.map((category, i) => (
                              <div key={i} className="flex justify-between">
                                <p className="text-sm">{category.category}</p>
                                <p className="text-sm font-medium">{formatCurrency(category.totalValue)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-lg font-medium">No Analytics Data</p>
                      <p className="text-sm text-muted-foreground">Not enough data available to generate analytics.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Supplier Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : error ? (
                    <div className="text-sm text-muted-foreground">Error loading performance data.</div>
                  ) : data ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Product Quality</p>
                        <Badge variant="outline">Good</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Delivery Reliability</p>
                        <Badge variant="outline">92% on-time</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Pricing Competitiveness</p>
                        <Badge variant="outline">Average</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Communication</p>
                        <Badge variant="outline">Responsive</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No performance data available.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}