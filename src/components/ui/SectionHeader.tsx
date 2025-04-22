'use client';
import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function SectionHeader({ title, subtitle, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-start space-x-4">
      {icon && <div className="mt-1">{icon}</div>}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
