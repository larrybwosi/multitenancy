'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useSalesSummary } from '@/lib/hooks/use-sales';
import { CreditCard, DollarSign, Package, Users, ArrowUp, ArrowDown } from 'lucide-react';

interface SalesStatsCardsProps {
  dateRange?: string;
}

export function SalesStatsCards({ dateRange }: SalesStatsCardsProps) {
  const { data: summary, isLoading, isError } = useSalesSummary(dateRange);

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-12 w-12 mb-4 rounded-full bg-gray-200" />
              <div className="h-7 w-3/4 mb-2 rounded bg-gray-200" />
              <div className="h-5 w-1/2 rounded bg-gray-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error or no data state
  if (isError || !summary) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No sales data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cards configuration
  const cards = [
    {
      title: 'Total Sales',
      value: formatCurrency(summary.totalSales),
      subtitle: `${summary.salesCount} transactions`,
      icon: <DollarSign className="h-7 w-7 text-green-600" />,
      change: summary.salesGrowth,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Total Profit',
      value: formatCurrency(summary.totalProfit),
      subtitle: `${((summary.totalProfit / summary.totalSales) * 100).toFixed(1)}% margin`,
      icon: <CreditCard className="h-7 w-7 text-blue-600" />,
      change: summary.salesGrowth,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Items Sold',
      value: summary.itemsSold.toLocaleString(),
      subtitle: `${formatCurrency(summary.averageSaleValue)} avg. order`,
      icon: <Package className="h-7 w-7 text-purple-600" />,
      change: 0,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Customers',
      value: summary.uniqueCustomers.toLocaleString(),
      subtitle: `${formatCurrency(summary.totalSales / summary.uniqueCustomers)} per customer`,
      icon: <Users className="h-7 w-7 text-amber-600" />,
      change: 0,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>

                {card.change !== 0 && (
                  <div className="flex items-center mt-2">
                    {card.change > 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={card.change > 0 ? 'text-xs text-green-500' : 'text-xs text-red-500'}>
                      {Math.abs(card.change).toFixed(1)}% from previous period
                    </span>
                  </div>
                )}
              </div>
              <div
                className={`h-12 w-12 rounded-full ${card.bgColor} flex items-center justify-center ${card.textColor}`}
              >
                {card.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
