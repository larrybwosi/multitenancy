"use client";

import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BarChartProps {
  data: Array<{ name: string; value: number }>;
  colors: string[];
  xAxis: string;
  yAxis: string;
  valueFormatter: (value: number) => string;
}

export function BarChart({
  data,
  colors,
  xAxis,
  yAxis,
  valueFormatter,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tickFormatter={valueFormatter} stroke="#888" />
        <YAxis
          dataKey={xAxis}
          type="category"
          width={100}
          stroke="#888"
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            borderRadius: "6px",
            boxShadow:
              "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            border: "none",
          }}
          formatter={(value: number) => [valueFormatter(value), yAxis]}
          labelFormatter={(label) => (
            <span className="font-semibold text-gray-800">{label}</span>
          )}
        />
        <Bar dataKey={yAxis}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              radius={[0, 4, 4, 0]}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
