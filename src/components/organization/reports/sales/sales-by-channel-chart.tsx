"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

interface SalesByChannelChartProps {
  data: Array<{
    name: string
    value: number
    percentage: number
    description: string
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export function SalesByChannelChart({ data }: SalesByChannelChartProps) {
  return (
    <div className="relative h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-1">
                      <div className="font-medium">{data.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {data.description}
                      </div>
                      <div className="font-medium">
                        ${data.value.toLocaleString()} ({data.percentage}%)
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <ul className="grid gap-2">
          {data.map((item, index) => (
            <li key={item.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span>{item.name}</span>
              <span className="font-medium">{item.percentage}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
