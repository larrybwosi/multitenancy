"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface CustomerLifetimeValueTableProps {
  data: any[]
}

export function CustomerLifetimeValueTable({ data }: CustomerLifetimeValueTableProps) {
  return (
    <div className="space-y-6">
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="segment" />
            <YAxis tickFormatter={(value) => `$${value}`} />
            <Tooltip
              formatter={(value) => [formatCurrency(value as number), "Lifetime Value"]}
              contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <Bar dataKey="ltv" name="Lifetime Value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Segment</TableHead>
              <TableHead className="text-right">Lifetime Value</TableHead>
              <TableHead className="text-right">Avg. Order Value</TableHead>
              <TableHead className="text-right">Purchase Frequency</TableHead>
              <TableHead className="text-right">Retention Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((segment, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{segment.segment}</TableCell>
                <TableCell className="text-right">{formatCurrency(segment.ltv)}</TableCell>
                <TableCell className="text-right">{formatCurrency(segment.averageOrderValue)}</TableCell>
                <TableCell className="text-right">{segment.purchaseFrequency} per year</TableCell>
                <TableCell className="text-right">{segment.retentionRate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Improving Customer Lifetime Value</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2 text-indigo-500">•</span>
                <span>Increase purchase frequency with targeted email campaigns and loyalty programs</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-indigo-500">•</span>
                <span>Improve average order value through cross-selling and product bundling</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-indigo-500">•</span>
                <span>Enhance retention rates with improved customer service and personalized experiences</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-indigo-500">•</span>
                <span>Reduce customer acquisition costs by focusing on high-value customer segments</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">LTV Calculation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Customer Lifetime Value (LTV) is calculated using the following formula:
            </p>
            <div className="p-3 bg-muted/50 rounded-md text-sm">
              <p className="font-mono">LTV = Average Order Value × Purchase Frequency × Customer Lifespan</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Where Customer Lifespan is derived from the retention rate. Higher retention rates lead to longer customer
              lifespans and higher lifetime values.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
