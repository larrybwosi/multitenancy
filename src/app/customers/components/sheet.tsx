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
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Gift,
  ShoppingCart,
  Mail,
  Building,
  CalendarDays,
  ImageOff,
  Phone,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { Customer } from "@prisma/client";

// Extended customer interfaces to handle our custom properties
interface ExtendedCustomer extends Customer {
  avatarUrl?: string;
  company?: string;
  status?: string;
  loyaltyPoints: number;
}

// Order-related interfaces that might come from API
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface Order {
  id: string;
  name: string;
  orderDate: Date;
  items: OrderItem[];
  totalAmount: number;
}

interface CustomerWithOrders extends ExtendedCustomer {
  orders?: Order[];
}

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

// Function to get initials for Avatar fallback
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

  // Cast to our extended customer type
  const extCustomer = customer as CustomerWithOrders;

  const getStatusBadgeClass = (status: string = "inactive"): string => {
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

  // Get recent orders if they exist
  const recentOrders = extCustomer.orders?.slice(0, 5) ?? [];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl bg-slate-50 p-0 flex flex-col">
        {/* Header Section */}
        <SheetHeader className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
              <AvatarImage src={extCustomer.avatarUrl} alt={customer.name} />
              <AvatarFallback className="text-xl bg-blue-200 text-blue-800">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-2xl font-bold text-gray-900">
                {customer.name}
              </SheetTitle>
              <SheetDescription className="text-indigo-700">
                Customer ID: {customer.customerId || customer.id.substring(0, 8)}
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
                <InfoItem icon={Mail} label="Email" value={customer.email || "Not provided"} />
                <InfoItem icon={Phone} label="Phone" value={customer.phone || "Not provided"} />
                <InfoItem
                  icon={Building}
                  label="Company"
                  value={extCustomer.company || "Not provided"}
                />
                <InfoItem
                  icon={MapPin}
                  label="Address"
                  value={customer.addressLine1 ? 
                    `${customer.addressLine1}${customer.addressLine2 ? ', ' + customer.addressLine2 : ''}, ${customer.city || ''} ${customer.postalCode || ''}`.trim() : 
                    "No address provided"
                  }
                />
                <InfoItem
                  icon={CalendarDays}
                  label="Registered On"
                  value={customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : "Unknown"}
                />
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium">Status</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadgeClass(extCustomer.status)}`}
                  >
                    {extCustomer.status || "inactive"}
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
                  {(extCustomer.loyaltyPoints || customer.loyaltyPoints || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 pt-1">
                  Current points balance
                </p>
              </CardContent>
            </Card>

            {/* Recent Orders Section - Only shown if there are orders */}
            {recentOrders.length > 0 && (
              <Card className="bg-white shadow-sm border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-blue-600" /> Recent
                    Orders ({recentOrders.length})
                  </CardTitle>
                  <CardDescription>Displaying the last 5 orders.</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Footer - No change */}
        <SheetFooter className="p-6 border-t border-gray-200 flex justify-between">
          <Button variant="outline" size="sm" asChild>
            <SheetClose>Cancel</SheetClose>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              // This would normally handle an action like edit
              console.log("Edit customer:", customer.id);
              alert("Edit functionality not implemented yet");
            }}
          >
            Edit Customer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Helper component for displaying customer info items
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
  <div className="flex items-center justify-between">
    <div className="flex items-center text-gray-600">
      <Icon className="h-4 w-4 mr-2" />
      <span className="font-medium">{label}</span>
    </div>
    <div className="text-gray-900">
      {children || value || "Not available"}
    </div>
  </div>
);
