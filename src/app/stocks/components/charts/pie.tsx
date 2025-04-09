'use client';

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PieChartProps {
  data: Array<{ name: string; value: number; reorderPoint?: number }>;
  colors: string[];
  tooltipFormatter: (value: number, name: string, props: any) => string;
}

export function PieChart({
  data,
  colors,
  tooltipFormatter,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              stroke="#fff"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            border: 'none',
          }}
          formatter={(value: number, name: string, props: any) => [
            tooltipFormatter(value, name, props),
            '',
          ]}
        />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          height={36}
          formatter={(value, entry, index) => (
            <span className="text-sm text-gray-600">
              {value} ({data[index].value})
            </span>
          )}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}