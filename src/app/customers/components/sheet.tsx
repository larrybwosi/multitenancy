// src/components/CustomerDetailSheet.tsx
import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"; // Import Card
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Import Accordion
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea for orders
import {
  Gift,
  ShoppingCart,
  Mail,
  Building,
  CalendarDays,
  ImageOff,
} from "lucide-react"; // Import icons
import Image from "next/image";
import { Customer } from "./mock";

// Ensure Card, Accordion, ScrollArea, Separator are added via Shadcn CLI
// npx shadcn-ui@latest add card accordion scroll-area separator

interface CustomerDetailSheetProps {
  customer: Customer | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Helper to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Function to get initials for Avatar fallback (can be moved to utils)
const getInitials = (name: string): string => {
  const names = name.split(" ");
  if (names.length === 0) return "?";
  if (names.length === 1) return names[0][0]?.toUpperCase() ?? "?";
  return (
    (names[0][0]?.toUpperCase() ?? "") +
    (names[names.length - 1][0]?.toUpperCase() ?? "")
  );
};

export function CustomerDetailSheet({
  customer,
  isOpen,
  onOpenChange,
}: CustomerDetailSheetProps) {
  if (!customer) return null;

  const getStatusBadgeClass = (status: Customer["status"]): string => {
    // (Same as in CustomerTable - ideally move to a shared util)
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  // Get the last 5 orders
  const recentOrders = customer.orders?.slice(0, 5) ?? [];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {/* Increased width, different background */}
      <SheetContent className="w-full sm:max-w-2xl bg-slate-50 p-0 flex flex-col">
        {/* Header Section */}
        <SheetHeader className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
              <AvatarImage src={customer.avatarUrl} alt={customer.name} />
              <AvatarFallback className="text-xl bg-blue-200 text-blue-800">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-2xl font-bold text-gray-900">
                {customer.name}
              </SheetTitle>
              <SheetDescription className="text-indigo-700">
                Customer ID: {customer.id}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Main Content */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Customer Info Card */}
            <Card className="bg-white shadow-sm border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <InfoItem icon={Mail} label="Email" value={customer.email} />
                <InfoItem
                  icon={Building}
                  label="Company"
                  value={customer.company}
                />
                <InfoItem
                  icon={CalendarDays}
                  label="Registered On"
                  value={customer.registeredDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium">Status</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadgeClass(customer.status)}`}
                  >
                    {customer.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Points Card */}
            <Card className="bg-white shadow-sm border-gray-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Loyalty Points
                </CardTitle>
                <Gift className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">
                  {customer.loyaltyPoints.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 pt-1">
                  Current points balance
                </p>
              </CardContent>
            </Card>

            {/* Recent Orders Section */}
            <Card className="bg-white shadow-sm border-gray-100">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" /> Recent
                  Orders ({recentOrders.length})
                </CardTitle>
                <CardDescription>Displaying the last 5 orders.</CardDescription>
              </CardHeader>
              <CardContent>
                {recentOrders.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {recentOrders.map((order, index) => (
                      <AccordionItem
                        value={`item-${index}`}
                        key={order.id}
                        className={
                          index === recentOrders.length - 1 ? "border-b-0" : ""
                        }
                      >
                        <AccordionTrigger className="hover:bg-gray-50/70 px-4 py-3 rounded text-sm font-medium">
                          <div className="flex justify-between w-full pr-4">
                            <span>
                              {order.name} -{" "}
                              {order.orderDate.toLocaleDateString()}
                            </span>
                            <span className="text-blue-700 font-semibold">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-gray-50/50 px-4 pt-3 pb-4 space-y-3">
                          <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2">
                            Order Items
                          </h4>
                          {order.items.map((item) => (
                            <div
                              key={item.productId}
                              className="flex items-start space-x-3 text-xs border-b border-gray-200 pb-2 last:border-b-0 last:pb-0"
                            >
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  width={40}
                                  height={40}
                                  alt={item.productName}
                                  className="h-10 w-10 rounded object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center text-gray-400">
                                  <ImageOff size={16} />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">
                                  {item.productName}
                                </p>
                                <p className="text-gray-500">
                                  {item.quantity} x {formatCurrency(item.price)}
                                </p>
                              </div>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(item.quantity * item.price)}
                              </p>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-sm text-center text-gray-500 py-4">
                    No recent orders found for this customer.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer Section */}
        <SheetFooter className="p-4 bg-white border-t border-gray-200 mt-auto">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          {/* Add other actions like 'Edit Customer' if desired */}
          {/* <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Edit Customer</Button> */}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Helper component for consistent info display with icons
interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  children?: React.ReactNode;
}

const InfoItem: React.FC<InfoItemProps> = ({
  icon: Icon,
  label,
  value,
  children,
}) => (
  <div className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0">
    <div className="flex items-center text-gray-600">
      <Icon className="h-4 w-4 mr-2 text-indigo-500" />
      <span className="font-medium">{label}</span>
    </div>
    {children ? (
      <div className="text-gray-900 font-medium text-right">{children}</div>
    ) : (
      <p className="text-gray-900 font-medium break-words text-right">
        {value}
      </p>
    )}
  </div>
);
