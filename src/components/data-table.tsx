'use client';
import React, { useState } from 'react';

export type ColumnDefinition<T> = {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  width?: string;
  className?: string;
  cellClassName?: string;
  renderCell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  hidden?: boolean;
};

export type ActionItem<T> = {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: T) => void;
  disabled?: (item: T) => boolean;
  hidden?: (item: T) => boolean;
};

export type DataTableProps<T> = {
  data: T[];
  columns: ColumnDefinition<T>[];
  keyField: keyof T;
  actions?: ActionItem<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: (item: T) => string;
  noDataClassName?: string;
  stickyHeader?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
  };
};

const defaultPageSizeOptions = [10, 25, 50, 100];

export function DataTable<T extends object>({
  data,
  columns,
  keyField,
  actions,
  onRowClick,
  emptyMessage = "No data available",
  isLoading = false,
  selectable = false,
  onSelectionChange,
  className = "",
  tableClassName = "",
  headerClassName = "",
  rowClassName = () => "",
  noDataClassName = "",
  stickyHeader = false,
  pagination,
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Local sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc' | null;
  }>({
    key: null,
    direction: null,
  });

  // Handle header checkbox change
  const handleSelectAllChange = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
      onSelectionChange && onSelectionChange([]);
    } else {
      const newSelectedRows = new Set(data.map(item => String(item[keyField])));
      setSelectedRows(newSelectedRows);
      setSelectAll(true);
      onSelectionChange && onSelectionChange([...data]);
    }
  };

  // Handle row checkbox change
  const handleRowSelect = (item: T) => {
    const key = String(item[keyField]);
    const newSelectedRows = new Set(selectedRows);
    
    if (newSelectedRows.has(key)) {
      newSelectedRows.delete(key);
      setSelectAll(false);
    } else {
      newSelectedRows.add(key);
      if (newSelectedRows.size === data.length) {
        setSelectAll(true);
      }
    }
    
    setSelectedRows(newSelectedRows);
    
    if (onSelectionChange) {
      const selectedItems = data.filter(
        dataItem => newSelectedRows.has(String(dataItem[keyField]))
      );
      onSelectionChange(selectedItems);
    }
  };

  // Handle sorting
  const handleSort = (column: ColumnDefinition<T>) => {
    if (!column.sortable || typeof column.accessor !== 'string') return;
    
    const accessor = column.accessor as keyof T;
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === accessor) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 
                 sortConfig.direction === 'desc' ? null : 'asc';
    }
    
    setSortConfig({ key: accessor, direction });
  };

  // Apply sorting to data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Get sort indicator icon
  const getSortIcon = (column: ColumnDefinition<T>) => {
    if (!column.sortable || typeof column.accessor !== 'string') return null;
    const accessor = column.accessor as keyof T;
    
    if (sortConfig.key !== accessor) {
      return <span className="ml-1 text-gray-300">↕</span>;
    }
    
    return sortConfig.direction === 'asc' ? 
      <span className="ml-1 text-gray-700">↑</span> : 
      <span className="ml-1 text-gray-700">↓</span>;
  };

  // Render cell content
  const renderCellContent = (item: T, column: ColumnDefinition<T>) => {
    if (column.renderCell) {
      return column.renderCell(item);
    }
    
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    
    const value = item[column.accessor as keyof T];
    return value as unknown as React.ReactNode;
  };

  // Visible columns (filter out hidden columns)
  const visibleColumns = columns.filter(col => !col.hidden);

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className={`w-full text-sm text-left text-gray-600 ${tableClassName}`}>
          <thead className={`text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200 ${headerClassName} ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {selectable && (
                <th scope="col" className="p-4 w-4">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    checked={selectAll}
                    onChange={handleSelectAllChange}
                  />
                </th>
              )}
              {visibleColumns.map((column, index) => (
                <th 
                  key={index}
                  scope="col" 
                  className={`px-4 py-3 whitespace-nowrap ${column.className || ''} ${column.sortable ? 'cursor-pointer select-none' : ''}`}
                  style={column.width ? { width: column.width } : {}}
                  onClick={column.sortable ? () => handleSort(column) : undefined}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && getSortIcon(column)}
                  </div>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td 
                  colSpan={visibleColumns.length + (selectable ? 1 : sqrt0) + (actions && actions.length > 0 ? 1 : 0)} 
                  className="px-4 py-6 text-center text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={visibleColumns.length + (selectable ? 1 : 0) + (actions && actions.length > 0 ? 1 : 0)} 
                  className={`px-4 py-6 text-center text-gray-500 ${noDataClassName}`}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map(item => {
                const rowKey = String(item[keyField]);
                const isSelected = selectedRows.has(rowKey);
                
                return (
                  <tr 
                    key={rowKey} 
                    className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} ${rowClassName(item)}`}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    style={onRowClick ? { cursor: 'pointer' } : undefined}
                  >
                    {selectable && (
                      <td className="w-4 p-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          checked={isSelected}
                          onChange={() => handleRowSelect(item)}
                        />
                      </td>
                    )}
                    {visibleColumns.map((column, colIndex) => (
                      <td 
                        key={colIndex} 
                        className={`px-4 py-3 ${column.cellClassName || ''}`}
                      >
                        {renderCellContent(item, column)}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {actions
                            .filter(action => !action.hidden || !action.hidden(item))
                            .map((action, actionIndex) => (
                              <button
                                key={actionIndex}
                                className={`p-1 text-gray-500 hover:text-gray-700 ${
                                  action.disabled && action.disabled(item) 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!action.disabled || !action.disabled(item)) {
                                    action.onClick(item);
                                  }
                                }}
                                disabled={action.disabled ? action.disabled(item) : false}
                                title={action.label}
                              >
                                {action.icon || action.label}
                              </button>
                            ))}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <></>
      )}
    </div>
  );
}