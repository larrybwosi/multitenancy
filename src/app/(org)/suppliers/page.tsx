import { Suspense } from "react";
import { PlusCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SupplierForm } from "./components/create";
import { SupplierTable } from "./components/table";
import { getSuppliers } from "@/actions/supplier";


export const dynamic = "force-dynamic"; // Ensure data is fetched on each request

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your product suppliers.
          </p>
        </div>

        {/* --- Create Supplier Button --- */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-150"
            >
              <PlusCircle className="h-4 w-4" />
              Add Supplier
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg w-[90vw] overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle>Create New Supplier</SheetTitle>
              <SheetDescription>
                Enter the details for the new supplier. Required fields are
                marked with *.
              </SheetDescription>
            </SheetHeader>
            {/* Pass 'create' mode and a potential close handler */}
            {/* You might need a client component wrapper around the sheet if you want */}
            {/* the form's onSuccess to close the sheet directly */}
            <SupplierForm mode="create" />
          </SheetContent>
        </Sheet>
      </div>
      {/* --- Suppliers Table --- */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier List</CardTitle>
          <CardDescription>
            View, edit, and manage supplier details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />{" "}
                Loading Suppliers...
              </div>
            }
          >
            {/* Pass fetched data to the client component table */}
            <SupplierTable suppliers={suppliers.success ? suppliers.data : []} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
