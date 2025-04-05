
"use client"
import { useState } from "react";
import { Organization } from "@prisma/client";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrganizationList } from "./components/list";
import { CreateOrganizationSheet } from "./components/create-sheet";
import useSWR from "swr";


// --- SWR Fetcher Function ---
// Fetches data from the API route we created
const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const errorInfo = await res.json();
        const error = new Error(errorInfo.message || 'An error occurred while fetching the data.');
        // Attach extra info to the error object.
        // error.info = errorInfo;
        // error.status = res.status;
        throw error;
    }
    const data = await res.json();
    return data.organizations; // Return the actual data array
};
// --- End SWR Fetcher ---


export default function OrganizationDashboard() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // --- Use SWR Hook ---
  const {
    data: organizations,
    error,
    isLoading,
  } = useSWR<Organization[]>("organizations", fetcher, {
    revalidateOnFocus: false, 
    errorRetryCount: 3 // Optional: configure retries
  });
  // --- End Use SWR ---


  const handleCreateSuccess = (newOrg: Organization) => {
    console.log("New Organization Created:", newOrg);
    // Option 1: Refetch all data
    // fetchOrganizations();

    // Option 2: Add the new org to the existing list (optimistic update)
    // setOrganizations((prev) => [newOrg, ...prev]);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage all organization profiles in your system.
          </p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Organization
        </Button>
      </div>

      <Separator />

      {/* Organization List/Grid */}
      <OrganizationList
        organizations={organizations}
        isLoading={isLoading}
        error={error}
      />

      {/* Create Organization Sheet */}
      <CreateOrganizationSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onCreateSuccess={handleCreateSuccess}
      />
    </div>
  );
}
