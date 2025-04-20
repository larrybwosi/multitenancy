
import {
  ShoppingCart,
  History,
  Users,
  Package,
  Truck,
  Boxes,
  CreditCard,
  DollarSign,
  Percent,
  FileText,
  User,
  Settings,
  Database,
  FolderKanban,
  Mail,
  ClipboardEdit,
  ArrowLeftRight,
  Layers3,
} from "lucide-react";
import { SectionItem } from "./sidebar";


export const sidebarSectionsData: SectionItem[] = [
  {
    id: "sales",
    title: "SALES",
    initiallyExpanded: true,
    routes: [
      {
        id: "point-of-sale",
        title: "Point of Sale",
        path: "/pos",
        icon: <ShoppingCart size={18} />,
      },
      {
        id: "sales-history",
        title: "Sales History",
        icon: <History size={18} />,
        // path: "/sales", // Optional: Parent path if clickable itself
        children: [
          {
            id: "all-sales",
            title: "All Sales",
            path: "/sales", // Child path
            // icon is optional for children, null is fine, or omit it
          },
          {
            id: "returns",
            title: "Returns",
            path: "/sales/history/returned",
          },
          {
            id: "voided",
            title: "Voided Sales",
            path: "/sales/history/voided",
          },
        ],
      },
      {
        id: "customers",
        title: "Customers",
        icon: <Users size={18} />, // Using 'Users' (plural) icon
        // path: "/customers", // Optional: Parent path if clickable itself
        children: [
          {
            id: "customer-list",
            title: "Customer List",
            path: "/customers", // Child path
          },
          {
            id: "customer-groups",
            title: "Customer Groups",
            // path: "/customers/groups",
          },
          {
            id: "loyalty-program",
            title: "Loyalty Program",
            // path: "/customers/loyalty",
          },
        ],
      },
    ],
  },
  {
    id: "inventory",
    title: "INVENTORY",
    routes: [
      {
        id: "products",
        title: "Products",
        path: "/products",
        icon: <Package size={18} />,
      },
      {
        id: "categories",
        title: "Categories",
        path: "/categories",
        icon: <FolderKanban size={18} />,
      },
      {
        id: "inventory-management",
        title: "Inventory Management",
        icon: <Package size={18} />,
        // path: "/inventory", // Optional: Parent path
        children: [
          {
            id: "stock-levels",
            title: "Stock Levels",
            path: "/stocks/levels",
            icon: <Layers3 size={18} />,
          },
          {
            id: "stock-transfers",
            title: "Stock Transfers",
            path: "/stocks/transfers",
            icon: <ArrowLeftRight size={18} />,
            
          },
          {
            id: "stock-adjustments",
            title: "Adjustments",
            path: "/stocks/adjustments",
            icon: <ClipboardEdit size={18} />,
          },
        ],
      },
      {
        id: "suppliers",
        title: "Suppliers",
        path: "/suppliers",
        icon: <Truck size={18} />,
      },
      {
        id: "warehouses",
        title: "Warehouses",
        path: "/warehouses",
        icon: <Boxes size={18} />,
      },
    ],
  },
  {
    id: "financials",
    title: "FINANCIALS",
    routes: [
      {
        id: "transactions",
        title: "Transactions",
        path: "/financials/transactions",
        icon: <CreditCard size={18} />,
      },
      {
        id: "expenses",
        title: "Expenses",
        path: "/financials/expenses",
        icon: <DollarSign size={18} />,
        children:[
          {
            id: "expense-categories",
            title: "Expense Categories",
          },
          {
            id: "expense-analytics",
            title:"Analytics",
            path:"/finance/expenses/analytics"
          },
          {
            id: "recurring-expense",
            title:"Recurring",
            path:"/finance/expenses/recurring"
          },
        ]
      },
      {
        id: "taxes",
        title: "Taxes",
        path: "/financials/taxes",
        icon: <Percent size={18} />,
      },
      {
        id: "reports",
        title: "Reports",
        icon: <FileText size={18} />,
        // path: "/financials/reports", // Optional: Parent path
        children: [
          {
            id: "sales-reports",
            title: "Sales Reports",
            path: "/financials/reports/sales",
          },
          {
            id: "inventory-reports",
            title: "Inventory Reports",
            path: "/financials/reports/inventory",
          },
          {
            id: "financial-reports",
            title: "Financial Reports",
            path: "/financials/reports/financial",
          },
          {
            id: "customer-reports",
            title: "Customer Reports",
            path: "/financials/reports/customer",
          },
        ],
      },
    ],
  },
  {
    id: "administration",
    title: "ADMINISTRATION",
    routes: [
      {
        id: "employees",
        title: "Employees",
        icon: <User size={18} />,
        // path: "/admin/employees", // Optional: Parent path
        children: [
          {
            id: "employee-list",
            title: "Employee List",
            path: "/employees/list",
          },
          {
            id: "roles-permissions",
            title: "Roles & Permissions",
            path: "/employees/roles",
          },
          {
            id: "attendance",
            title: "Attendance",
            path: "/staff/attendance",
          },
        ],
      },
      {
        id: "invitations",
        title: "Invitations",
        path: "/invitations",
        icon: <Mail size={18} />, // Using Mail icon for Invitations
      },
      {
        id: "settings",
        title: "System Settings",
        icon: <Settings size={18} />,
        // path: "/admin/settings", // Optional: Parent path
        children: [
          {
            id: "general-settings",
            title: "General Settings",
            path: "/admin/settings/general",
          },
          {
            id: "pos-settings",
            title: "POS Settings",
            path: "/admin/settings/pos",
          },
          {
            id: "tax-settings",
            title: "Tax Settings",
            path: "/admin/settings/tax",
          },
          {
            id: "printer-settings",
            title: "Printer Settings",
            path: "/admin/settings/printer",
          },
          {
            id: "barcode-settings",
            title: "Barcode Settings",
            path: "/admin/settings/barcode",
          },
        ],
      },
      {
        id: "backup",
        title: "Backup & Restore",
        path: "/admin/backup",
        icon: <Database size={18} />,
      },
    ],
  },
];