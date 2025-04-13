// app/stocks/components/product-data-table.tsx
"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumnId?: string;
}

export function ProductDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search products...",
  searchColumnId = "name",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  // Get total pages for pagination display
  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className="space-y-4">
      {/* Table Tools Section */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center py-2">
        {/* Search */}
        <div className="relative w-full md:max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchColumnId)?.getFilterValue() as string) ??
              ""
            }
            onChange={(event) =>
              table
                .getColumn(searchColumnId)
                ?.setFilterValue(event.target.value)
            }
            className="pl-10 border-slate-200 bg-white focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {table.getColumn(searchColumnId)?.getFilterValue() && (
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 hover:text-slate-600"
              onClick={() =>
                table.getColumn(searchColumnId)?.setFilterValue("")
              }
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex-shrink-0"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Display
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white border-slate-200 shadow-lg rounded-md p-2"
            >
              <div className="text-sm font-medium text-slate-500 px-2 py-1">
                Toggle Columns
              </div>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const headerText =
                    typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id;

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize text-sm rounded-md"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {headerText}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Page Size Selector */}
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-auto border-slate-200 text-slate-700 hover:bg-slate-50 h-10">
              <div className="flex items-center">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-slate-500" />
                <SelectValue placeholder="Rows" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white">
              {[8, 10, 15, 20, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selection Status Badge */}
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-none">
              <CheckSquare className="h-3.5 w-3.5 mr-1" />
              {table.getFilteredSelectedRowModel().rows.length} selected
            </Badge>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-slate-50 border-b border-slate-200"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-slate-600 font-medium h-10 px-4 text-left whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50 border-b border-slate-100 data-[state=selected]:bg-indigo-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-2.5 text-sm text-slate-700"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="h-8 w-8 text-slate-300" />
                    <div className="text-lg font-medium">No results found</div>
                    <p className="text-sm text-slate-400">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        {/* Status */}
        <div className="text-sm text-slate-500 order-2 sm:order-1">
          {table.getFilteredRowModel().rows.length === 0 ? (
            "No results"
          ) : (
            <>
              Showing{" "}
              <span className="font-medium">
                {table.getRowModel().rows.length}
              </span>{" "}
              of{" "}
              <span className="font-medium">
                {table.getFilteredRowModel().rows.length}
              </span>{" "}
              products
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2 order-1 sm:order-2">
          <div className="text-sm text-slate-400 mr-1">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0 border-slate-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0 border-slate-200"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
