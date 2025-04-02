import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  File,
  Box,
  ArrowRightLeft,
  ShoppingCart,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import AttachmentDisplay from "./atachment";
import { StockTransaction } from "../types";

const TransactionDetailsSheet = ({
  transaction,
}: {
  transaction: StockTransaction;
}) => {
  const getTransactionIcon = () => {
    switch (transaction.transactionType) {
      case "PURCHASE":
        return <ShoppingCart className="h-6 w-6 text-blue-600" />;
      case "SALE":
        return <Box className="h-6 w-6 text-green-600" />;
      case "ADJUSTMENT":
        return <ArrowRightLeft className="h-6 w-6 text-amber-600" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const getDirectionColor = () => {
    return transaction.direction === "IN" ? "text-green-600" : "text-red-600";
  };

  return (
    <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
      <SheetHeader className="pb-4">
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg shadow-sm">
          <div className="bg-white p-2 rounded-full shadow-sm">
            {getTransactionIcon()}
          </div>
          <div>
            <SheetTitle className="text-xl">
              Transaction #{transaction.id}
            </SheetTitle>
            <SheetDescription className="capitalize text-base">
              {transaction.transactionType.toLowerCase()} of{" "}
              <span className="font-medium text-black">
                {transaction.productName}
              </span>
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg">
          <div>
            <Label className="text-sm font-medium text-gray-500 mb-1 block">
              Date
            </Label>
            <p className="font-medium">
              {formatDate(transaction.transactionDate)}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500 mb-1 block">
              Type
            </Label>
            <div>
              <Badge
                variant={
                  transaction.transactionType === "PURCHASE"
                    ? "default"
                    : transaction.transactionType === "SALE"
                      ? "secondary"
                      : "outline"
                }
                className="capitalize px-3 py-1 text-sm font-medium"
              >
                {transaction.transactionType.toLowerCase()}
              </Badge>
            </div>
          </div>
        </div>

        <Separator className="my-1" />

        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium text-gray-500 mb-1 block">
              Product
            </Label>
            <p className="font-semibold text-lg">{transaction.productName}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500 mb-1 block">
              Direction
            </Label>
            <div className="flex items-center gap-2">
              {transaction.direction === "IN" ? (
                <ArrowUp className={`h-5 w-5 ${getDirectionColor()}`} />
              ) : (
                <ArrowDown className={`h-5 w-5 ${getDirectionColor()}`} />
              )}
              <span className={`capitalize font-medium ${getDirectionColor()}`}>
                {transaction.direction === "IN" ? "Inbound" : "Outbound"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
          <div>
            <Label className="text-sm font-medium text-gray-500 mb-1 block">
              Quantity
            </Label>
            <p className={`text-lg font-medium ${getDirectionColor()}`}>
              {transaction.direction === "IN" ? "+" : "-"}
              {transaction.quantity}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500 mb-1 block">
              Unit Price
            </Label>
            <p className="text-lg">{formatCurrency(transaction.unitPrice)}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500 mb-1 block">
              Total Amount
            </Label>
            <p className="text-lg font-bold">
              {formatCurrency(transaction.totalAmount)}
            </p>
          </div>
        </div>

        {transaction.supplierName && (
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <Label className="text-sm font-medium text-gray-500 mb-1 block">
              Supplier
            </Label>
            <p className="font-medium">{transaction.supplierName}</p>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg border border-gray-100">
          <Label className="text-sm font-medium text-gray-500 mb-1 block">
            Notes
          </Label>
          <p className="whitespace-pre-wrap p-3 bg-slate-50 rounded-md text-gray-700 mt-1">
            {transaction.notes || "No notes available"}
          </p>
        </div>

        <Separator className="my-1" />

        <div>
          <Label className="text-sm font-medium text-gray-500 mb-2 block">
            Attachments
          </Label>
          {transaction.attachments && transaction.attachments.length > 0 ? (
            <div className="mt-2">
              <AttachmentDisplay attachments={transaction.attachments} />
            </div>
          ) : (
            <p className="text-gray-500 text-sm p-3 bg-slate-50 rounded-md">
              No attachments available
            </p>
          )}
        </div>
      </div>

      <SheetFooter className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center w-full">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            Recorded by:{" "}
            <span className="font-medium">
              {transaction.createdBy || "System"}
            </span>
          </div>
          <Button
            variant="outline"
            className="hover:bg-blue-50 border-blue-200"
            asChild
          >
            <a
              href={`/api/transactions/${transaction.id}/receipt`}
              download
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Receipt
            </a>
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  );
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default TransactionDetailsSheet;
