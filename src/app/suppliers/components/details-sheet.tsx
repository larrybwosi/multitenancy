import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter, // Optional
  SheetClose, // Optional
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Supplier } from "@prisma/client";
import { format } from "date-fns"; // For date formatting

interface SupplierDetailsSheetProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined | React.ReactNode;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-3 gap-2 py-2 items-start">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm col-span-2">{value}</dd>
    </div>
  );
}

export function SupplierDetailsSheet({
  supplier,
  open,
  onOpenChange,
}: SupplierDetailsSheetProps) {
  if (!supplier) return null; // Or render a loading/error state

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-2xl font-semibold">
            {supplier.name}
          </SheetTitle>
          <SheetDescription>
            Detailed information for this supplier.
            <Badge
              variant={supplier.isActive ? "default" : "destructive"}
              className="ml-2 align-middle"
            >
              {supplier.isActive ? "Active" : "Inactive"}
            </Badge>
          </SheetDescription>
        </SheetHeader>
        <Separator className="mb-4" />
        <div className="space-y-2">
          <DetailItem label="Contact Person" value={supplier.contactName} />
          <DetailItem
            label="Email"
            value={
              supplier.email ? (
                <a
                  href={`mailto:${supplier.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {supplier.email}
                </a>
              ) : (
                "N/A"
              )
            }
          />
          <DetailItem label="Phone" value={supplier.phone} />
          <DetailItem
            label="Address"
            value={
              supplier.address ? (
                <span className="whitespace-pre-wrap">{supplier.address}</span>
              ) : (
                "N/A"
              )
            }
          />
          <Separator className="my-2" />
          <DetailItem label="Payment Terms" value={supplier.paymentTerms} />
          <DetailItem
            label="Lead Time"
            value={supplier.leadTime ? `${supplier.leadTime} days` : "N/A"}
          />
          <Separator className="my-2" />
          <DetailItem
            label="Supplier Since"
            value={format(new Date(supplier.createdAt), "PPP")}
          />
          <DetailItem
            label="Last Updated"
            value={format(new Date(supplier.updatedAt), "PPP p")}
          />
        </div>
        {/* Optional Footer */}
        {/* <SheetFooter className="mt-6">
            <SheetClose asChild>
                <Button variant="outline">Close</Button>
            </SheetClose>
        </SheetFooter> */}
      </SheetContent>
    </Sheet>
  );
}
