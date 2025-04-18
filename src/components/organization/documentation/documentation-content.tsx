import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Receipt, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export function DashboardDocs() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" id="dashboard">
          Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          The dashboard provides an overview of your organization's key metrics and activities.
        </p>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p>
          The dashboard is the main landing page of the organization administration system. It displays key metrics,
          recent activities, and important notifications to help you quickly assess the state of your organization.
        </p>
        <div className="rounded-lg border p-4">
          <Image
            src="/placeholder.svg?height=400&width=800"
            alt="Dashboard Screenshot"
            width={800}
            height={400}
            className="rounded-lg"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            The dashboard provides a comprehensive overview of your organization's performance.
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Key Features</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Key Metrics Cards:</strong> Display important numbers like total members, active projects, and
            financial summaries.
          </li>
          <li>
            <strong>Recent Activity:</strong> Shows the latest actions taken within the organization.
          </li>
          <li>
            <strong>Financial Overview:</strong> Provides charts and graphs showing financial performance.
          </li>
          <li>
            <strong>Quick Actions:</strong> Buttons for common tasks like inviting members or creating reports.
          </li>
        </ul>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">How to Use</h2>
        <p>The dashboard is designed to be intuitive and easy to navigate. Here's how to make the most of it:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            <strong>View Key Metrics:</strong> The top section displays cards with important numbers. Click on any card
            to navigate to the relevant section for more details.
          </li>
          <li>
            <strong>Check Recent Activity:</strong> The activity feed shows recent actions. Click on any item to see
            more details.
          </li>
          <li>
            <strong>Analyze Charts:</strong> Hover over chart elements to see detailed information. Use the time period
            selectors to change the data range.
          </li>
          <li>
            <strong>Use Quick Actions:</strong> The quick action buttons provide shortcuts to common tasks.
          </li>
        </ol>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Customization</h2>
        <p>You can customize the dashboard to show the information most relevant to you:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Rearrange Cards:</strong> Drag and drop cards to change their order.
          </li>
          <li>
            <strong>Show/Hide Elements:</strong> Use the settings menu to show or hide specific elements.
          </li>
          <li>
            <strong>Change Time Periods:</strong> Select different time periods for charts and metrics.
          </li>
        </ul>
      </div>
      <div className="flex justify-end">
        <Button asChild>
          <Link href="#members">
            Next: Members
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export function MembersDocs() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" id="members">
          Members
        </h1>
        <p className="text-lg text-muted-foreground">Manage your organization's members, roles, and permissions.</p>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
        <p>
          The Members section allows you to manage all users who have access to your organization. You can view, add,
          edit, and remove members, as well as manage their roles and permissions.
        </p>
        <div className="rounded-lg border p-4">
          <Image
            src="/placeholder.svg?height=400&width=800"
            alt="Members Screenshot"
            width={800}
            height={400}
            className="rounded-lg"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            The members page displays all users with access to your organization.
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Key Features</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Member List:</strong> View all members with their roles and status.
          </li>
          <li>
            <strong>Invite Members:</strong> Send invitations to new users.
          </li>
          <li>
            <strong>Role Management:</strong> Assign and change member roles.
          </li>
          <li>
            <strong>Permission Settings:</strong> Configure what each role can access.
          </li>
          <li>
            <strong>Activity Tracking:</strong> See when members last accessed the system.
          </li>
        </ul>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Member Roles</h2>
        <p>The system supports several predefined roles with different permission levels:</p>
        <Table>
          <TableCaption>Available member roles and their permissions</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Owner</TableCell>
              <TableCell>Organization owner with full access</TableCell>
              <TableCell>All permissions</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Administrator</TableCell>
              <TableCell>Administrative access to most features</TableCell>
              <TableCell>All except billing and organization deletion</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Manager</TableCell>
              <TableCell>Can manage day-to-day operations</TableCell>
              <TableCell>View and edit most data, cannot manage users or settings</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Member</TableCell>
              <TableCell>Regular organization member</TableCell>
              <TableCell>View data, limited edit permissions</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Viewer</TableCell>
              <TableCell>Read-only access</TableCell>
              <TableCell>View only, no edit permissions</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">How to Use</h2>
        <h3 className="text-xl font-medium">Inviting New Members</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Navigate to the Members page</li>
          <li>Click the "Invite Member" button</li>
          <li>Enter the email address of the person you want to invite</li>
          <li>Select the appropriate role for the new member</li>
          <li>Add an optional personal message</li>
          <li>Click "Send Invitation"</li>
        </ol>
        <h3 className="text-xl font-medium">Managing Existing Members</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Find the member in the list</li>
          <li>Click the "Edit" button (or three dots menu) next to their name</li>
          <li>
            From the menu, you can:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Change their role</li>
              <li>Resend their invitation (if pending)</li>
              <li>Remove them from the organization</li>
            </ul>
          </li>
        </ol>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="#dashboard">Previous: Dashboard</Link>
        </Button>
        <Button asChild>
          <Link href="#transactions">
            Next: Transactions
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export function FinanceDocs({ section }: { section: string }) {
  if (section === "transactions") {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight" id="transactions">
            Transactions
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage and track all financial transactions within your organization.
          </p>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p>
            The Transactions module allows you to record, categorize, and track all financial transactions in your
            organization. This includes both income and expenses, providing a complete picture of your financial
            activities.
          </p>
          <div className="rounded-lg border p-4">
            <Image
              src="/placeholder.svg?height=400&width=800"
              alt="Transactions Screenshot"
              width={800}
              height={400}
              className="rounded-lg"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              The transactions page displays all financial transactions with filtering and sorting options.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Key Features</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Transaction Recording:</strong> Record both income and expenses with detailed information.
            </li>
            <li>
              <strong>Categorization:</strong> Assign categories to transactions for better organization and reporting.
            </li>
            <li>
              <strong>Filtering and Sorting:</strong> Find transactions by date, amount, category, and more.
            </li>
            <li>
              <strong>Attachments:</strong> Attach receipts or other documents to transactions.
            </li>
            <li>
              <strong>Recurring Transactions:</strong> Set up recurring transactions for regular income or expenses.
            </li>
            <li>
              <strong>Reporting:</strong> Generate reports based on transaction data.
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Transaction Types</h2>
          <p>The system supports two main types of transactions:</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-green-500" />
                  Income
                </CardTitle>
                <CardDescription>Money coming into your organization</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Examples include:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Sales revenue</li>
                  <li>Service fees</li>
                  <li>Investment returns</li>
                  <li>Grants and donations</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="mr-2 h-5 w-5 text-red-500" />
                  Expense
                </CardTitle>
                <CardDescription>Money going out of your organization</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Examples include:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Vendor payments</li>
                  <li>Payroll</li>
                  <li>Rent and utilities</li>
                  <li>Equipment purchases</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">API Reference</h2>
          <p>The Transactions module provides the following API endpoints:</p>
          <Table>
            <TableCaption>Transaction API Endpoints</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/transactions</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>List all transactions with optional filtering</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/transactions</code>
                </TableCell>
                <TableCell>POST</TableCell>
                <TableCell>Create a new transaction</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/transactions/{"{id}"}</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Get details of a specific transaction</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/transactions/{"{id}"}</code>
                </TableCell>
                <TableCell>PUT</TableCell>
                <TableCell>Update an existing transaction</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/transactions/{"{id}"}</code>
                </TableCell>
                <TableCell>DELETE</TableCell>
                <TableCell>Delete a transaction</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">How to Use</h2>
          <h3 className="text-xl font-medium">Creating a New Transaction</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Navigate to the Transactions page</li>
            <li>Click the "Add Transaction" button</li>
            <li>Select the transaction type (Income or Expense)</li>
            <li>
              Fill in the required details:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Description</li>
                <li>Amount</li>
                <li>Date</li>
                <li>Category</li>
                <li>Payment method</li>
              </ul>
            </li>
            <li>Add any additional information (notes, attachments, etc.)</li>
            <li>Click "Save Transaction"</li>
          </ol>
          <h3 className="text-xl font-medium">Filtering Transactions</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Use the filter controls at the top of the transaction list</li>
            <li>
              Filter by:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Date range</li>
                <li>Transaction type (Income/Expense)</li>
                <li>Category</li>
                <li>Amount range</li>
                <li>Payment method</li>
              </ul>
            </li>
            <li>Click "Apply Filters" to update the list</li>
          </ol>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="#members">Previous: Members</Link>
          </Button>
          <Button asChild>
            <Link href="#expenses">
              Next: Expenses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (section === "expenses") {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight" id="expenses">
            Expenses
          </h1>
          <p className="text-lg text-muted-foreground">Track, categorize, and manage all organizational expenses.</p>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p>
            The Expenses module provides comprehensive tools for tracking and managing all types of organizational
            expenses. It allows you to categorize expenses, set up recurring payments, and generate detailed expense
            reports.
          </p>
          <div className="rounded-lg border p-4">
            <Image
              src="/placeholder.svg?height=400&width=800"
              alt="Expenses Screenshot"
              width={800}
              height={400}
              className="rounded-lg"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              The expenses page provides detailed tracking and categorization of all organizational costs.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Key Features</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Expense Categorization:</strong> Organize expenses into categories like payroll, rent, utilities,
              marketing, etc.
            </li>
            <li>
              <strong>Recurring Expenses:</strong> Set up and manage regular payments with automatic tracking.
            </li>
            <li>
              <strong>Expense Reports:</strong> Generate detailed reports filtered by date, category, department, etc.
            </li>
            <li>
              <strong>Receipt Management:</strong> Attach and store digital copies of receipts and invoices.
            </li>
            <li>
              <strong>Approval Workflows:</strong> Set up approval processes for expenses above certain thresholds.
            </li>
            <li>
              <strong>Budget Tracking:</strong> Compare expenses against budgeted amounts.
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Expense Categories</h2>
          <p>The system comes with predefined expense categories, but you can also create custom categories:</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            <Badge className="justify-center py-2">Payroll</Badge>
            <Badge className="justify-center py-2">Rent</Badge>
            <Badge className="justify-center py-2">Utilities</Badge>
            <Badge className="justify-center py-2">Marketing</Badge>
            <Badge className="justify-center py-2">Office Supplies</Badge>
            <Badge className="justify-center py-2">Travel</Badge>
            <Badge className="justify-center py-2">Insurance</Badge>
            <Badge className="justify-center py-2">Equipment</Badge>
            <Badge className="justify-center py-2">Software</Badge>
            <Badge className="justify-center py-2">Professional Services</Badge>
            <Badge className="justify-center py-2">Taxes</Badge>
            <Badge className="justify-center py-2">Maintenance</Badge>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">API Reference</h2>
          <p>The Expenses module provides the following API endpoints:</p>
          <Table>
            <TableCaption>Expense API Endpoints</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/expenses</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>List all expenses with optional filtering</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/expenses</code>
                </TableCell>
                <TableCell>POST</TableCell>
                <TableCell>Create a new expense</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/expenses/{"{id}"}</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Get details of a specific expense</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/expenses/{"{id}"}</code>
                </TableCell>
                <TableCell>PUT</TableCell>
                <TableCell>Update an existing expense</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/expenses/{"{id}"}</code>
                </TableCell>
                <TableCell>DELETE</TableCell>
                <TableCell>Delete an expense</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/expenses/recurring</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>List all recurring expenses</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/expenses/categories</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>List all expense categories</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">How to Use</h2>
          <h3 className="text-xl font-medium">Recording a New Expense</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Navigate to the Expenses page</li>
            <li>Click the "Add Expense" button</li>
            <li>
              Fill in the required details:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Description</li>
                <li>Amount</li>
                <li>Date</li>
                <li>Category</li>
                <li>Vendor/Payee</li>
                <li>Payment method</li>
                <li>Department/Cost center (if applicable)</li>
              </ul>
            </li>
            <li>Attach any receipts or supporting documents</li>
            <li>For recurring expenses, check the "Recurring" option and set the frequency</li>
            <li>Click "Save Expense"</li>
          </ol>
          <h3 className="text-xl font-medium">Generating Expense Reports</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Navigate to the Expenses page</li>
            <li>Click the "Reports" button</li>
            <li>Select the report type (summary, detailed, by category, etc.)</li>
            <li>Set the date range for the report</li>
            <li>Apply any additional filters (category, department, etc.)</li>
            <li>Click "Generate Report"</li>
            <li>View the report online or export it to PDF, Excel, or CSV</li>
          </ol>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="#transactions">Previous: Transactions</Link>
          </Button>
          <Button asChild>
            <Link href="#taxes">
              Next: Taxes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (section === "taxes") {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight" id="taxes">
            Taxes
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage tax calculations, reporting, and compliance for your organization.
          </p>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p>
            The Taxes module helps you manage all aspects of tax calculation, reporting, and compliance. It provides
            tools for tracking tax liabilities, preparing tax reports, and ensuring compliance with tax regulations.
          </p>
          <div className="rounded-lg border p-4">
            <Image
              src="/placeholder.svg?height=400&width=800"
              alt="Taxes Screenshot"
              width={800}
              height={400}
              className="rounded-lg"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              The taxes page provides tools for managing tax calculations and reporting.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Key Features</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Tax Calculation:</strong> Automatically calculate taxes based on configurable rules and rates.
            </li>
            <li>
              <strong>Tax Categories:</strong> Organize transactions into different tax categories.
            </li>
            <li>
              <strong>Tax Reports:</strong> Generate reports for different tax types and periods.
            </li>
            <li>
              <strong>Tax Calendar:</strong> Track important tax deadlines and filing dates.
            </li>
            <li>
              <strong>Tax Document Storage:</strong> Store tax-related documents securely.
            </li>
            <li>
              <strong>Tax Compliance:</strong> Tools to help ensure compliance with tax regulations.
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Tax Types</h2>
          <p>The system supports various types of taxes that organizations typically need to manage:</p>
          <Table>
            <TableCaption>Common Tax Types</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Tax Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Typical Filing Frequency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Sales Tax / VAT</TableCell>
                <TableCell>Tax on sales of goods and services</TableCell>
                <TableCell>Monthly or Quarterly</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Income Tax</TableCell>
                <TableCell>Tax on business income</TableCell>
                <TableCell>Annually with quarterly estimates</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Payroll Tax</TableCell>
                <TableCell>Taxes related to employee compensation</TableCell>
                <TableCell>Quarterly</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Property Tax</TableCell>
                <TableCell>Tax on owned property</TableCell>
                <TableCell>Annually</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Excise Tax</TableCell>
                <TableCell>Tax on specific goods or activities</TableCell>
                <TableCell>Varies</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">API Reference</h2>
          <p>The Taxes module provides the following API endpoints:</p>
          <Table>
            <TableCaption>Tax API Endpoints</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/taxes</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>List all tax records with optional filtering</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/taxes</code>
                </TableCell>
                <TableCell>POST</TableCell>
                <TableCell>Create a new tax record</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/taxes/{"{id}"}</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Get details of a specific tax record</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/taxes/{"{id}"}</code>
                </TableCell>
                <TableCell>PUT</TableCell>
                <TableCell>Update an existing tax record</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/taxes/calculate</code>
                </TableCell>
                <TableCell>POST</TableCell>
                <TableCell>Calculate tax for a given transaction or period</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/taxes/reports</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Generate tax reports</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/taxes/rates</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Get configured tax rates</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">How to Use</h2>
          <h3 className="text-xl font-medium">Configuring Tax Settings</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Navigate to the Taxes page</li>
            <li>Click the "Settings" or "Configuration" button</li>
            <li>
              Configure tax settings:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Tax rates for different tax types</li>
                <li>Tax categories for transactions</li>
                <li>Tax filing periods and deadlines</li>
                <li>Default tax settings for products or services</li>
              </ul>
            </li>
            <li>Save your settings</li>
          </ol>
          <h3 className="text-xl font-medium">Generating Tax Reports</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Navigate to the Taxes page</li>
            <li>Click the "Reports" button</li>
            <li>Select the report type (sales tax, income tax, payroll tax, etc.)</li>
            <li>Set the reporting period</li>
            <li>Click "Generate Report"</li>
            <li>Review the report and export it if needed</li>
          </ol>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="#expenses">Previous: Expenses</Link>
          </Button>
          <Button asChild>
            <Link href="#financial-reports">
              Next: Financial Reports
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (section === "reports") {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight" id="financial-reports">
            Financial Reports
          </h1>
          <p className="text-lg text-muted-foreground">
            Generate comprehensive financial reports and analytics for your organization.
          </p>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p>
            The Financial Reports module provides powerful tools for generating, viewing, and analyzing various
            financial reports. These reports help you understand your organization's financial health, track performance
            over time, and make informed business decisions.
          </p>
          <div className="rounded-lg border p-4">
            <Image
              src="/placeholder.svg?height=400&width=800"
              alt="Financial Reports Screenshot"
              width={800}
              height={400}
              className="rounded-lg"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              The financial reports page provides comprehensive insights into your organization's finances.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Key Features</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Standard Financial Reports:</strong> Generate common financial statements like profit and loss,
              balance sheet, and cash flow.
            </li>
            <li>
              <strong>Custom Reports:</strong> Create customized reports based on specific criteria and metrics.
            </li>
            <li>
              <strong>Visual Analytics:</strong> View data in charts and graphs for easier interpretation.
            </li>
            <li>
              <strong>Comparative Analysis:</strong> Compare financial performance across different time periods.
            </li>
            <li>
              <strong>Export Options:</strong> Export reports in various formats (PDF, Excel, CSV).
            </li>
            <li>
              <strong>Scheduled Reports:</strong> Set up automatic generation and delivery of reports.
            </li>
          </ul>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Available Reports</h2>
          <p>The system provides the following standard financial reports:</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profit and Loss Statement</CardTitle>
                <CardDescription>Shows revenue, expenses, and profit over a period</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Key components:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Revenue by category</li>
                  <li>Cost of goods sold</li>
                  <li>Gross profit</li>
                  <li>Operating expenses</li>
                  <li>Net profit/loss</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Sample
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <CardDescription>Shows assets, liabilities, and equity at a point in time</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Key components:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Current assets</li>
                  <li>Fixed assets</li>
                  <li>Current liabilities</li>
                  <li>Long-term liabilities</li>
                  <li>Owner's equity</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Sample
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Statement</CardTitle>
                <CardDescription>Shows cash inflows and outflows over a period</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Key components:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Operating activities</li>
                  <li>Investing activities</li>
                  <li>Financing activities</li>
                  <li>Net change in cash</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Sample
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expense Report</CardTitle>
                <CardDescription>Detailed breakdown of expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Key components:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Expense categories</li>
                  <li>Monthly/quarterly trends</li>
                  <li>Percentage of total expenses</li>
                  <li>Comparison to budget</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Sample
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Data Visualization</h2>
          <p>The Financial Reports module uses Recharts to create interactive and informative visualizations:</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Bar Charts</h3>
              <Image
                src="/placeholder.svg?height=200&width=400"
                alt="Bar Chart Example"
                width={400}
                height={200}
                className="rounded-lg"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Used for comparing values across categories, such as monthly revenue or expenses by department.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Line Charts</h3>
              <Image
                src="/placeholder.svg?height=200&width=400"
                alt="Line Chart Example"
                width={400}
                height={200}
                className="rounded-lg"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Used for showing trends over time, such as revenue growth or cash flow.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Pie Charts</h3>
              <Image
                src="/placeholder.svg?height=200&width=400"
                alt="Pie Chart Example"
                width={400}
                height={200}
                className="rounded-lg"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Used for showing composition, such as expense breakdown by category.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Area Charts</h3>
              <Image
                src="/placeholder.svg?height=200&width=400"
                alt="Area Chart Example"
                width={400}
                height={200}
                className="rounded-lg"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Used for showing cumulative values over time, such as cumulative revenue or expenses.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">API Reference</h2>
          <p>The Financial Reports module provides the following API endpoints:</p>
          <Table>
            <TableCaption>Financial Reports API Endpoints</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/reports</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>List available report types</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/reports/profit-loss</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Generate profit and loss statement</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/reports/balance-sheet</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Generate balance sheet</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/reports/cash-flow</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Generate cash flow statement</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/reports/expenses</code>
                </TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Generate expense report</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>/api/organization/finance/reports/custom</code>
                </TableCell>
                <TableCell>POST</TableCell>
                <TableCell>Generate custom report based on provided parameters</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">How to Use</h2>
          <h3 className="text-xl font-medium">Generating a Standard Report</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Navigate to the Financial Reports page</li>
            <li>Select the report type (Profit & Loss, Balance Sheet, etc.)</li>
            <li>Set the reporting period</li>
            <li>Choose any additional options (comparison period, level of detail, etc.)</li>
            <li>Click "Generate Report"</li>
            <li>View the report and use the interactive features to explore the data</li>
            <li>Export the report if needed</li>
          </ol>
          <h3 className="text-xl font-medium">Creating a Custom Report</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Navigate to the Financial Reports page</li>
            <li>Click "Custom Report"</li>
            <li>Select the data points you want to include</li>
            <li>Configure grouping and filtering options</li>
            <li>Choose visualization types</li>
            <li>Set the reporting period</li>
            <li>Click "Generate Report"</li>
            <li>Save the report configuration if you want to use it again</li>
          </ol>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="#taxes">Previous: Taxes</Link>
          </Button>
          <Button asChild>
            <Link href="#warehouses">
              Next: Warehouses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return null
}

export function InventoryDocs({ section }: { section: string }) {
  // Implementation for inventory documentation sections
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" id={section}>
          {section.charAt(0).toUpperCase() + section.slice(1)}
        </h1>
        <p className="text-lg text-muted-foreground">Inventory management documentation</p>
      </div>
      {/* Content would go here */}
    </div>
  )
}

export function SettingsDocs() {
  // Implementation for settings documentation
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" id="settings">
          Settings
        </h1>
        <p className="text-lg text-muted-foreground">Configure your organization settings</p>
      </div>
      {/* Content would go here */}
    </div>
  )
}

export function ApiDocs() {
  // Implementation for API documentation
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" id="api">
          API Reference
        </h1>
        <p className="text-lg text-muted-foreground">
          Complete API documentation for the organization administration system
        </p>
      </div>
      {/* Content would go here */}
    </div>
  )
}

export function GlossaryDocs() {
  // Implementation for glossary
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" id="glossary">
          Glossary
        </h1>
        <p className="text-lg text-muted-foreground">
          Definitions of terms used in the organization administration system
        </p>
      </div>
      {/* Content would go here */}
    </div>
  )
}
