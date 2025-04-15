"use client"

interface FinancialMetricsGridProps {
  metrics: Array<{
    label: string
    value: string
  }>
}

export function FinancialMetricsGrid({ metrics }: FinancialMetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex flex-col space-y-1">
          <div className="text-sm font-medium text-muted-foreground">{metric.label}</div>
          <div className="text-xl font-bold">{metric.value}</div>
        </div>
      ))}
    </div>
  )
}