'use client';
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  autoUpdate?: string;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  children,
  className,
  icon,
  autoUpdate,
}: SectionHeaderProps) {
  return (
    <div className={cn("space-y-4 mb-8", className)}>
      {/* Header section with title and action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="text-muted-foreground/80 flex-shrink-0">
                {icon}
              </span>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-base text-muted-foreground pl-[calc(1.25rem+8px)]">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action button with subtle hover effect */}
        {actionLabel && (
          <button
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" />
            {actionLabel}
          </button>
        )}
        {children}
      </div>

      {/* Subtle divider with proper spacing */}
      <div className="border-t border-border/50 h-px w-full" />

      {/* Auto-update notice with fade-in animation */}
      {autoUpdate && (
        <p className="text-xs text-muted-foreground animate-in fade-in">
          Auto-updates in {autoUpdate}
        </p>
      )}
    </div>
  );
}
