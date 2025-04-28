import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Eye, Edit, Trash, Package, Warehouse as WarehouseIcon, Store, TruckIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';

interface Warehouse {
  id: string;
  name: string;
  description?: string | null;
  locationType: 'WAREHOUSE' | 'RETAIL_SHOP' | 'DISTRIBUTION_CENTER';
  isActive: boolean;
  isDefault: boolean;
  capacityTracking: boolean;
  totalCapacity?: number | null;
  capacityUnit?: string | null;
  capacityUsed?: number | null;
  address?: string | null;
  managerId?: string | null;
  productCount: number;
  stockValue: number;
}

interface WarehouseListProps {
  warehouses: Warehouse[];
}

export function WarehouseList({ warehouses }: WarehouseListProps) {
  // Function to get icon based on location type
  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'WAREHOUSE':
        return <WarehouseIcon className="h-4 w-4 text-blue-500" />;
      case 'RETAIL_SHOP':
        return <Store className="h-4 w-4 text-purple-500" />;
      case 'DISTRIBUTION_CENTER':
        return <TruckIcon className="h-4 w-4 text-amber-500" />;
      default:
        return <WarehouseIcon className="h-4 w-4" />;
    }
  };

  // Function to get capacity percentage
  const getCapacityPercentage = (used?: number | null, total?: number | null) => {
    if (!used || !total || total === 0) return 0;
    return Math.min(100, Math.round((used / total) * 100));
  };

  return (
    <Card className="shadow-sm border border-gray-200 dark:border-gray-800">
      <CardHeader className="bg-gray-50 dark:bg-gray-900/50 pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Package className="mr-2 h-5 w-5 text-primary" />
          Inventory Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-gray-50/50 dark:bg-gray-900/20">
            <TableRow>
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="font-medium">Type</TableHead>
              <TableHead className="font-medium">Address</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Products</TableHead>
              <TableHead className="font-medium">Stock Value</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No warehouses found.
                </TableCell>
              </TableRow>
            ) : (
              warehouses.map(warehouse => {
                const capacityPercentage = getCapacityPercentage(warehouse.capacityUsed, warehouse.totalCapacity);

                return (
                  <TableRow key={warehouse.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/10 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                          {getLocationIcon(warehouse.locationType)}
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center">
                            {warehouse.name}
                            {warehouse.isDefault && (
                              <Badge
                                variant="secondary"
                                className="ml-2 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                              >
                                Default
                              </Badge>
                            )}
                          </div>
                          {warehouse.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {warehouse.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          warehouse.locationType === 'WAREHOUSE'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : warehouse.locationType === 'RETAIL_SHOP'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {getLocationIcon(warehouse.locationType)}
                        {warehouse.locationType === 'WAREHOUSE'
                          ? 'Warehouse'
                          : warehouse.locationType === 'RETAIL_SHOP'
                            ? 'Retail'
                            : 'Distribution'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">
                      {warehouse.address || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={warehouse.isActive ? 'default' : 'secondary'}
                        className={
                          warehouse.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                        }
                      >
                        <span
                          className={`mr-1.5 h-2 w-2 rounded-full ${warehouse.isActive ? 'bg-green-500' : 'bg-gray-500'}`}
                        />
                        {warehouse.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{warehouse.productCount}</span>
                        {warehouse.capacityTracking && warehouse.totalCapacity && (
                          <div className="w-20 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                capacityPercentage > 90
                                  ? 'bg-red-500'
                                  : capacityPercentage > 70
                                    ? 'bg-amber-500'
                                    : 'bg-green-500'
                              }`}
                              style={{ width: `${capacityPercentage}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(warehouse.stockValue)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="cursor-pointer">
                            <Link href={`/warehouses/${warehouse.id}`} className="flex items-center gap-2">
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View</span>s
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Link href={`/warehouses/${warehouse.id}?modal=true`} className="flex items-center gap-2">
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700 dark:text-red-500 dark:focus:text-red-400">
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
