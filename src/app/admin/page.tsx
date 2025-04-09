// app/admin/page.tsx
import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  getOrganizationData,
  getOrganizationMembers,
  getAuditLogs,
} from "@/actions/admin-actions";

import { OrganizationSettingsForm } from "./components/organization-settings-form";
import { MembersTable } from "./components/members-table";
import { AuditLogTable } from "./components/audit-log-table";
import { Skeleton } from "@/components/ui/skeleton";

// Assume you get the organization ID from the user's session or context
// Replace 'YOUR_ORGANIZATION_ID' with the actual way you retrieve it
const ORGANIZATION_ID = "04cc6426-aa9a-41fe-95af-4ee82bf63e3b"; // Example Placeholder

export default async function AdminDashboardPage() {
  // Fetch data server-side
  const organization = await getOrganizationData(ORGANIZATION_ID);
  const members = await getOrganizationMembers(ORGANIZATION_ID);
  const auditLogs = await getAuditLogs(ORGANIZATION_ID); // Pass Org ID if logs are org-specific

  if (!organization) {
    return <p>Organization not found or access denied.</p>; // Handle case where org doesn't exist
  }

  // Type assertion for members (useful for passing to client components)
  // Prisma sometimes returns complex nested types, adjust as needed
  type MemberWithUser = Awaited<
    ReturnType<typeof getOrganizationMembers>
  >[number];

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Admin Dashboard
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Manage your organization settings, members, and view system logs.
      </p>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Organization</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="reports">Reports & Tax</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Manage Members</CardTitle>
              <CardDescription>
                Invite, manage roles, and ban/unban members.
              </CardDescription>
            </CardHeader>
            <Suspense fallback={<MembersTableSkeleton />}>
              {/* Pass data to Client Component */}
              <MembersTable
                members={members as MemberWithUser[]} // Assert type here
                organizationId={organization.id}
              />
            </Suspense>
          </Card>
        </TabsContent>

        {/* Organization Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Update your organization&apos;s details.
              </CardDescription>
            </CardHeader>
            <Suspense fallback={<SettingsFormSkeleton />}>
              {/* Pass initial data */}
              <OrganizationSettingsForm organization={organization} />
            </Suspense>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                View recent activities within the system.
              </CardDescription>
            </CardHeader>
            <Suspense fallback={<LogsTableSkeleton />}>
              <AuditLogTable logs={auditLogs} />
            </Suspense>
          </Card>
        </TabsContent>

        {/* Reports & Tax Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Tax</CardTitle>
              <CardDescription>
                View financial reports and manage tax settings/payments.
              </CardDescription>
            </CardHeader>
            <div className="p-6">
              <p className="text-muted-foreground">
                Reporting and tax payment functionalities are under development
                or require specific integration.
              </p>
              {/* Add Placeholder UI or actual components later */}
              {/* Example: Input for Tax Rate */}
              <div className="mt-4 space-y-2">
                <label
                  htmlFor="taxRate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  id="taxRate"
                  name="taxRate"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., 16"
                  // Add state/server action to handle this
                />
              </div>
              <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                Save Tax Rate
              </button>
              <button className="mt-4 ml-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500 dark:hover:bg-gray-700">
                Pay Taxes (Conceptual)
              </button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Loading Skeletons ---

function MembersTableSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function SettingsFormSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-6 w-1/4 mb-1" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-6 w-1/4 mb-1 mt-4" />
      <Skeleton className="h-20 w-1/3" />
      <Skeleton className="h-10 w-24 mt-4" />
    </div>
  );
}

function LogsTableSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
