import React, { useState } from "react";
import { Eye, UserRound, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

// Note: In a real implementation, you would import the shadcn components from your project.
// For this example, I'm assuming the components are available from these imports.
// In your actual project with Next.js, you would import from '@/components/ui/...'

const EnhancedSalesTable = ({ data, setSelectedSaleId }) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const router = useRouter();

  // Function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Simple date formatter function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";

    return {
      date: `${month} ${day}, ${year}`,
      time: `${hours}:${minutes} ${ampm}`,
    };
  };

  // Function to get customer initials
  const getInitials = (name) => {
    if (!name || name === "Customer") return "CU";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="p-0">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 hover:bg-gray-50">
              <th className="h-10 px-4 text-left align-middle font-medium text-gray-500 w-16">
                Sale #
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-gray-500">
                Date
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-gray-500">
                Customer
              </th>
              <th className="h-10 px-4 text-right align-middle font-medium text-gray-500">
                Amount
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-gray-500">
                Payment Method
              </th>
              <th className="h-10 px-4 text-left align-middle font-medium text-gray-500">
                Status
              </th>
              <th className="h-10 px-4 text-right align-middle font-medium text-gray-500 w-20">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {data.sales.map((sale) => {
              const formattedDate = formatDate(sale.saleDate);
              const isHovered = hoveredRow === sale.id;

              return (
                <tr
                  key={sale.id}
                  className={`border-b border-gray-200 ${isHovered ? "bg-blue-50" : "hover:bg-gray-50"}`}
                  onMouseEnter={() => setHoveredRow(sale.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="p-4 align-middle font-medium text-gray-800">
                    #{sale.saleNumber}
                  </td>
                  <td className="p-4 align-middle">
                    <div className="text-sm font-medium">
                      {formattedDate.date}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formattedDate.time}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    {sale.customerId ? (
                      <div className="flex items-center space-x-2">
                        <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-blue-100 items-center justify-center">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">
                            {getInitials(sale.customer?.name)}
                          </div>
                        </div>
                        <span
                          className="text-blue-600 font-medium hover:underline cursor-pointer"
                          title="View customer details"
                        >
                          {sale.customer?.name || "Customer"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-100 items-center justify-center">
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs">
                            <UserRound size={14} />
                          </div>
                        </div>
                        <span className="text-gray-500">Walk-in</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-middle text-right font-medium">
                    {formatCurrency(sale.finalAmount)}
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center space-x-2">
                      <Wallet
                        size={16}
                        className={
                          sale.paymentMethod.includes("CREDIT")
                            ? "text-purple-500"
                            : sale.paymentMethod.includes("CASH")
                              ? "text-green-500"
                              : "text-blue-500"
                        }
                      />
                      <span className="capitalize text-gray-700">
                        {sale.paymentMethod.toLowerCase().replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        sale.paymentStatus === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : sale.paymentStatus === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : sale.paymentStatus === "FAILED" ||
                                sale.paymentStatus === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {sale.paymentStatus.charAt(0) +
                        sale.paymentStatus.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <button
                      type="button"
                      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 ${
                        isHovered
                          ? "bg-gray-100 text-gray-900"
                          : "hover:bg-gray-100 hover:text-gray-900 text-gray-700"
                      }`}
                      onClick={() => router.push(`/sales/${sale.id}`)}
                    >
                      <Eye size={16} className="mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnhancedSalesTable;
