"use client";
import { useState, useRef, useEffect } from "react";
import { useDebounceValue } from 'usehooks-ts';
import { cn } from "@/lib/utils";
import { Search, ChevronDown, Filter } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface ExportAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface FilterControlsProps {
  // Core elements configuration
  searchPlaceholder?: string;
  showSearch?: boolean;
  showFilterButton?: boolean;
  onFilterButtonClick?: () => void;

  // Filters configuration
  filters?: Array<{
    name: string;
    label: string;
    options: FilterOption[];
    defaultValue?: string;
    onChange: (value: string) => void;
  }>;

  // Export actions configuration
  exportActions?: ExportAction[];

  // Handler for search
  onSearch?: (value: string) => void;

  // Advanced styling options
  className?: string;
  filterAreaClassName?: string;
  searchAreaClassName?: string;
  variant?: "default" | "minimal" | "bordered";
}

interface DropdownFilterProps {
  label: string;
  options: FilterOption[];
  onSelect: (value: string) => void;
  defaultValue?: string;
  className?: string;
}

const DropdownFilter = ({
  label,
  options,
  onSelect,
  defaultValue,
  className,
}: DropdownFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find default option or use the label
  const defaultOption = defaultValue
    ? options.find((opt) => opt.value === defaultValue)
    : undefined;

  const [selectedOption, setSelectedOption] = useState(
    defaultOption ? defaultOption.label : label
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option: FilterOption) => {
    setSelectedOption(option.label);
    onSelect(option.value);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate max-w-[150px]">{selectedOption}</span>
        <ChevronDown className="h-4 w-4 flex-shrink-0" />
      </button>

      {isOpen && (
        <div
          className="absolute z-10 mt-1 w-full min-w-[180px] max-h-[300px] overflow-auto bg-white border rounded-md shadow-lg py-1"
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option)}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              role="option"
              aria-selected={selectedOption === option.label}
            >
              {option.icon && (
                <span className="flex-shrink-0">{option.icon}</span>
              )}
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Utility function to get variant-specific classes
const getVariantClasses = (
  variant: FilterControlsProps["variant"] = "default"
) => {
  switch (variant) {
    case "minimal":
      return {
        container: "space-y-3 sm:space-y-0",
        input: "border-gray-200 focus:ring-1 focus:ring-gray-400",
        button: "bg-gray-50 hover:bg-gray-100 border-gray-200",
        dropdown: "bg-gray-50 hover:bg-gray-100 border-gray-200",
      };
    case "bordered":
      return {
        container: "border p-4 rounded-lg shadow-sm",
        input: "border-gray-300 focus:ring-2 focus:ring-blue-500",
        button: "bg-white hover:bg-gray-50 border-gray-300 shadow-sm",
        dropdown: "bg-white hover:bg-gray-50 border-gray-300 shadow-sm",
      };
    case "default":
    default:
      return {
        container: "",
        input: "border-gray-300 focus:ring-1 focus:ring-blue-500",
        button: "bg-white hover:bg-gray-50 border-gray-300",
        dropdown: "bg-white hover:bg-gray-50 border-gray-300",
      };
  }
};

export function FilterControls({
  // Core elements
  searchPlaceholder = "Search...",
  showSearch = true,
  showFilterButton = true,
  onFilterButtonClick,

  // Filters configuration
  filters = [],

  // Export actions
  exportActions = [],

  // Search handler
  onSearch,

  // Styling
  className,
  filterAreaClassName,
  searchAreaClassName,
  variant = "default",
}: FilterControlsProps) {
  const variantClasses = getVariantClasses(variant);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedValue] = useDebounceValue(searchValue, 300);

  useEffect(() => {
    onSearch?.(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6",
        variantClasses.container,
        className
      )}
    >
      {/* Left side - Filters */}
      <div
        className={cn("flex flex-wrap items-center gap-2", filterAreaClassName)}
      >
        {filters.map((filter) => (
          <DropdownFilter
            key={filter.name}
            label={filter.label}
            options={filter.options}
            defaultValue={filter.defaultValue}
            onSelect={filter.onChange}
            className="flex-shrink-0"
          />
        ))}

        {/* Filter button */}
        {showFilterButton && (
          <button
            onClick={onFilterButtonClick}
            className={cn(
              "flex items-center justify-center p-1.5 border rounded-md",
              variantClasses.button
            )}
            aria-label="Filter options"
          >
            <Filter className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Right side - Search and Export buttons */}
      <div
        className={cn("flex flex-wrap items-center gap-2", searchAreaClassName)}
      >
        {/* Search input */}
        {showSearch && (
          <div className="relative flex-shrink-0">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={cn(
                "pl-9 pr-3 py-1.5 w-full min-w-[180px] rounded-md border text-sm focus:outline-none",
                variantClasses.input
              )}
            />
          </div>
        )}

        {/* Export buttons */}
        {exportActions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border",
              variantClasses.button
            )}
          >
            {action.icon ? (
              action.icon
            ) : (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            )}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
