
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
  PackagePlus,
  ClipboardList,
  FileLineChart,
  Repeat2,
} from "lucide-react";
import { SectionItem } from "./sidebar";


export const sidebarSectionsData: SectionItem[] = [
  {
    title: "SALES",
    initiallyExpanded: true,
    routes: [
      {
        title: "Point of Sale",
        path: "/pos",
        icon: <ShoppingCart size={18} />,
      },
      {
        title: "Sales History",
        icon: <History size={18} />,
        // path: "/sales", // Optional: Parent path if clickable itself
        children: [
          {
            title: "All Sales",
            path: "/sales", // Child path
            // icon is optional for children, null is fine, or omit it
          },
          {
            title: "Returns",
            path: "/sales/history/returned",
          },
          {
            title: "Voided Sales",
            path: "/sales/history/voided",
          },
        ],
      },
      {
        
        title: "Customers",
        icon: <Users size={18} />, // Using 'Users' (plural) icon
        // path: "/customers", // Optional: Parent path if clickable itself
        children: [
          {
            title: "Customer List",
            path: "/customers",
            icon: <ClipboardList size={18} />,
          },
          {
            title: "Customer Groups",
            icon: <Users size={18} />,
            // path: "/customers/groups",
          },
          {
            title: "Loyalty Program",
            icon: <Users size={18} />,
            // path: "/customers/loyalty",
          },
        ],
      },
    ],
  },
  {
    title: "INVENTORY",
    routes: [
      {
        
        title: "Products",
        path: "/products",
        icon: <Package size={18} />,
        children: [
          { title: "Add Product", path: "/products/add", icon: <PackagePlus size={18} /> },
          { title: "Product List", path: "/products", icon: <ClipboardList size={18} /> },
        ]
      },
      {
        
        title: "Categories",
        path: "/categories",
        icon: <FolderKanban size={18} />,
      },
      {
        title: "Inventory Management",
        icon: <Package size={18} />,
        // path: "/inventory", // Optional: Parent path
        children: [
          {
            title: "Stock Levels",
            path: "/stocks/levels",
            icon: <Layers3 size={18} />,
          },
          {
            title: "Stock Transfers",
            path: "/stocks/transfers",
            icon: <ArrowLeftRight size={18} />,
            
          },
          {
            title: "Adjustments",
            path: "/stocks/adjustments",
            icon: <ClipboardEdit size={18} />,
          },
        ],
      },
      {
        
        title: "Suppliers",
        path: "/suppliers",
        icon: <Truck size={18} />,
      },
      {
        
        title: "Warehouses",
        path: "/warehouses",
        icon: <Boxes size={18} />,
      },
    ],
  },
  {
    title: "FINANCIALS",
    routes: [
      {
        
        title: "Transactions",
        path: "/financials/transactions",
        icon: <CreditCard size={18} />,
      },
      {
        
        title: "Expenses",
        path: "/financials/expenses",
        icon: <DollarSign size={18} />,
        children:[
          {
            title: "Expense Categories",
          },
          {
            title:"Analytics",
            path:"/finance/expenses/analytics",
            icon: <FileLineChart size={18} />,
          },
          {
            title:"Recurring",
            path:"/finance/expenses/recurring",
            icon: <Repeat2 size={18} />,
          },
        ]
      },
      {
        
        title: "Taxes",
        path: "/financials/taxes",
        icon: <Percent size={18} />,
      },
      {
        
        title: "Reports",
        icon: <FileText size={18} />,
        // path: "/financials/reports", // Optional: Parent path
        children: [
          {
            title: "Sales Reports",
            path: "/financials/reports/sales",
          },
          {
            title: "Inventory Reports",
            path: "/financials/reports/inventory",
          },
          {
            title: "Financial Reports",
            path: "/financials/reports/financial",
          },
          {
            title: "Customer Reports",
            path: "/financials/reports/customer",
          },
        ],
      },
    ],
  },
  {
    title: "ADMINISTRATION",
    routes: [
      {
        
        title: "Employees",
        icon: <User size={18} />,
        // path: "/admin/employees", // Optional: Parent path
        children: [
          {
            title: "Employee List",
            path: "/employees/list",
          },
          {
            title: "Roles & Permissions",
            path: "/employees/roles",
          },
          {
            
            title: "Attendance",
            path: "/staff/attendance",
          },
        ],
      },
      {
        
        title: "Invitations",
        path: "/invitations",
        icon: <Mail size={18} />, // Using Mail icon for Invitations
      },
      {
        
        title: "System Settings",
        icon: <Settings size={18} />,
        // path: "/admin/settings", // Optional: Parent path
        children: [
          {
            title: "General Settings",
            path: "/admin/settings/general",
          },
          {
            title: "POS Settings",
            path: "/admin/settings/pos",
          },
          {
            title: "Tax Settings",
            path: "/admin/settings/tax",
          },
          {
            title: "Printer Settings",
            path: "/admin/settings/printer",
          },
          {
            title: "Barcode Settings",
            path: "/admin/settings/barcode",
          },
        ],
      },
      {
        
        title: "Backup & Restore",
        path: "/admin/backup",
        icon: <Database size={18} />,
      },
    ],
  },
];