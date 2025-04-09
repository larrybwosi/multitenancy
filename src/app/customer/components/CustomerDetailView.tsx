"use client";

import useSWR from "swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomBadge } from "@/components/ui/CustomBadge";
import { formatDate } from "@/lib/utils";
import { LoyaltyAdjustmentForm } from "./LoyaltyAdjustmentForm";
import { LoyaltyHistoryTable } from "./LoyaltyHistoryTable";
import { SalesHistoryTable } from "./SalesHistoryTable";
import {
  Pencil,
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  History,
  Award,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CustomerForm } from "./CustomerForm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getCustomerDetails } from "@/actions/customerActions";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface CustomerDetailViewProps {
  customerId: string;
  onOpenChange?: (open: boolean) => void;
}

export function CustomerDetailView({
  customerId,
  onOpenChange,
}: CustomerDetailViewProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // SWR hook for data fetching with caching and revalidation
  const {
    data: customer,
    error,
    isLoading,
    mutate,
  } = useSWR(`customer-${customerId}`, () => getCustomerDetails(customerId), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const handleLoyaltyUpdate = (newPoints: number) => {
    if (!customer) return;
    // Optimistic UI update
    mutate(
      {
        ...customer,
        loyaltyPoints: newPoints,
      },
      false
    );
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    // Revalidate the data after edit
    mutate();
  };

  // Calculate loyalty tiers and progress
  const getLoyaltyTier = (points: number) => {
    if (points >= 1000)
      return { name: "Platinum", progress: 100, nextTier: null };
    if (points >= 500)
      return {
        name: "Gold",
        progress: (points - 500) / 5,
        nextTier: "Platinum",
      };
    if (points >= 200)
      return { name: "Silver", progress: (points - 200) / 3, nextTier: "Gold" };
    return { name: "Bronze", progress: points, nextTier: "Silver" };
  };

  if (isLoading) {
    return (
      <Sheet open={true} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[620px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold text-primary">
              Customer Details
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            <Card className="border-border bg-card/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-[60px]" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-[150px] mb-2" />
                <Skeleton className="h-4 w-[200px]" />
              </CardContent>
            </Card>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-background">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </TabsList>

              <div className="mt-4 space-y-4">
                <Skeleton className="h-[200px] w-full" />
              </div>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (error || !customer) {
    return (
      <Sheet open={true} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[620px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold text-primary">
              Customer Details
            </SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-destructive">
              Failed to load customer details. Please try again.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const loyaltyTier = getLoyaltyTier(customer.loyaltyPoints);

  return (
    <Sheet open={true} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[680px] overflow-y-auto px-5 bg-gradient-to-b from-background to-background/95">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Customer Profile
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Header Card */}
          <Card className="border border-accent/20 shadow-lg bg-card/95 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-start space-x-4">
                <div className="bg-accent/10 p-3 rounded-full text-accent">
                  <User className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-card-foreground">
                    {customer.name}
                  </CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    {customer.email && (
                      <div className="flex items-center">
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                    {customer.email && customer.phone && (
                      <span className="text-muted-foreground/50">•</span>
                    )}
                    {customer.phone && (
                      <div className="flex items-center">
                        <Phone className="h-3.5 w-3.5 mr-1" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CustomBadge
                  variant={customer.isActive ? "active" : "inactive"}
                  className={`text-xs px-3 py-1 rounded-full ${
                    customer.isActive
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-gray-100 text-gray-800 border border-gray-200"
                  }`}
                >
                  {customer.isActive ? "Active" : "Inactive"}
                </CustomBadge>
                <Dialog
                  open={isEditModalOpen}
                  onOpenChange={setIsEditModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-accent/10 hover:text-accent"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit Customer</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                      <DialogTitle className="text-primary">
                        Edit Customer Details
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <CustomerForm
                        customer={customer}
                        onFormSubmit={handleEditModalClose}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-2 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 mr-2 text-accent" />
                    <span className="text-base font-medium">
                      {loyaltyTier.name} Tier
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-accent">
                    {customer.loyaltyPoints} pts
                  </span>
                </div>
                <Progress
                  value={loyaltyTier.progress}
                  className="h-2 bg-accent/10"
                />
                {loyaltyTier.nextTier && (
                  <div className="mt-1 text-xs text-right text-muted-foreground">
                    {loyaltyTier.nextTier} tier:{" "}
                    {loyaltyTier.progress.toFixed(0)}% progress
                  </div>
                )}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                <span>
                  Member since:{" "}
                  {formatDate(customer.createdAt, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Details, Sales, Loyalty */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-background/50 backdrop-blur-sm rounded-xl p-1">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg transition-all"
              >
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1.5" />
                  <span>Details</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="sales"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg transition-all"
              >
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-1.5" />
                  <span>Sales</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="loyalty_history"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg transition-all"
              >
                <div className="flex items-center">
                  <History className="h-4 w-4 mr-1.5" />
                  <span>Loyalty</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="loyalty_adjust"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground rounded-lg transition-all"
              >
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  <span>Adjust</span>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent
              value="details"
              className="mt-6 animate-in fade-in-50 duration-300"
            >
              <Card className="border-border/40 shadow-sm bg-card/95">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-card-foreground flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <span className="font-medium text-primary block mb-1 flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                        Address
                      </span>
                      <span className="text-card-foreground">
                        {customer.address || "Not provided"}
                      </span>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <span className="font-medium text-primary block mb-1">
                        Internal Notes
                      </span>
                      <span className="text-card-foreground">
                        {customer.notes || "No notes available"}
                      </span>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg flex flex-col">
                      <span className="font-medium text-primary block mb-1 flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        Last Updated
                      </span>
                      <span className="text-card-foreground">
                        {formatDate(customer.updatedAt)}
                      </span>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <span className="font-medium text-primary block mb-1 flex items-center">
                        <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                        Purchase History
                      </span>
                      <span className="text-card-foreground">
                        {customer.sales.length} purchases
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sales History Tab */}
            <TabsContent
              value="sales"
              className="mt-6 animate-in fade-in-50 duration-300"
            >
              <Card className="border-border/40 shadow-sm bg-card/95">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-card-foreground flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" />
                    Recent Sales
                  </CardTitle>
                  <CardDescription>
                    Showing last {customer.sales.length} sales.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SalesHistoryTable sales={customer.sales} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Loyalty History Tab */}
            <TabsContent
              value="loyalty_history"
              className="mt-6 animate-in fade-in-50 duration-300"
            >
              <Card className="border-border/40 shadow-sm bg-card/95">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-card-foreground flex items-center">
                    <History className="h-5 w-5 mr-2 text-primary" />
                    Loyalty Point Transactions
                  </CardTitle>
                  <CardDescription>
                    Showing last {customer.loyaltyTransactions.length}{" "}
                    transactions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LoyaltyHistoryTable
                    transactions={customer.loyaltyTransactions}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Loyalty Adjustment Tab */}
            <TabsContent
              value="loyalty_adjust"
              className="mt-6 animate-in fade-in-50 duration-300"
            >
              <Card className="border-border/40 shadow-sm bg-card/95">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-card-foreground flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-primary" />
                    Adjust Loyalty Points
                  </CardTitle>
                  <CardDescription>
                    Current balance: {customer.loyaltyPoints} points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LoyaltyAdjustmentForm
                    customerId={customer.id}
                    currentPoints={customer.loyaltyPoints}
                    onAdjustmentSuccess={handleLoyaltyUpdate}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
