'use client';

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateSupplierDialog } from "./components/create";
import { SupplierTable } from "./components/table";
import { useSuppliers } from "@/lib/hooks/use-supplier";



export default function SuppliersPage() {
  const { data: suppliers, isLoading } = useSuppliers()
  
  if(isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> Loading Suppliers...
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">Manage your product suppliers.</p>
        </div>

        {/* --- Create Supplier Button --- */}
        <CreateSupplierDialog />
      </div>
      {/* --- Suppliers Table --- */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier List</CardTitle>
          <CardDescription>View, edit, and manage supplier details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> Loading Suppliers...
              </div>
            }
          >
            {/* Pass fetched data to the client component table */}
            <SupplierTable suppliers={suppliers?.success ? suppliers?.data?.suppliers : []} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
