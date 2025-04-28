"use client"

import { Building2, MapPin, User, Calendar, CircleDollarSign, Package } from "lucide-react"
import { useTheme } from "next-themes"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

interface WarehouseDetailsProps {
  id: string
}

export function WarehouseDetails({ id }: WarehouseDetailsProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Mock data for warehouse details
  const warehouse = {
    id: "1",
    name: "Main Warehouse",
    description:
      "Primary storage facility for electronics and consumer goods. Located in the industrial district with easy access to major highways.",
    location: "123 Warehouse Ave, New York, NY 10001",
    type: "WAREHOUSE",
    manager: "John Smith",
    totalCapacity: 10000,
    capacityUnit: "CUBIC_METER",
    capacityUsed: 7500,
    isActive: true,
    createdAt: "2022-01-15T00:00:00Z",
    lastUpdated: "2023-04-10T14:30:00Z",
    totalValue: 2450000,
    currency: "USD",
    operatingHours: "24/7",
    securityLevel: "High",
    temperatureControlled: true,
    temperature: {
      min: 18,
      max: 24,
      unit: "°C",
    },
    humidity: {
      value: 45,
      unit: "%",
    },
  }

  // Mock data for capacity trend
  const capacityTrendData = [
    { month: "Jan", capacity: 45 },
    { month: "Feb", capacity: 52 },
    { month: "Mar", capacity: 49 },
    { month: "Apr", capacity: 58 },
    { month: "May", capacity: 63 },
    { month: "Jun", capacity: 68 },
    { month: "Jul", capacity: 74 },
    { month: "Aug", capacity: 72 },
    { month: "Sep", capacity: 68 },
    { month: "Oct", capacity: 65 },
    { month: "Nov", capacity: 68 },
    { month: "Dec", capacity: 72 },
  ]

  // Calculate capacity percentage
  const capacityPercentage = Math.round((warehouse.capacityUsed / warehouse.totalCapacity) * 100)

  return (
    <Card className="card-hover-effect animate-slide-in-up">
      <CardHeader>
        <CardTitle>Warehouse Information</CardTitle>
        <CardDescription>Detailed information about this warehouse</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Description</h3>
          <p className="text-sm text-muted-foreground">{warehouse.description}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Capacity</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {warehouse.capacityUsed.toLocaleString()} / {warehouse.totalCapacity.toLocaleString()}{" "}
              {warehouse.capacityUnit === "CUBIC_METER" ? "m³" : "units"}
            </span>
            <Badge variant={capacityPercentage > 80 ? "destructive" : capacityPercentage > 60 ? "warning" : "success"}>
              {capacityPercentage}%
            </Badge>
          </div>
          <Progress
            value={capacityPercentage}
            className="h-2"
            indicatorClassName={
              capacityPercentage > 80 ? "bg-destructive" : capacityPercentage > 60 ? "bg-amber-500" : "bg-emerald-500"
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Type:</span>
              <span className="text-muted-foreground">
                {warehouse.type === "WAREHOUSE"
                  ? "Warehouse"
                  : warehouse.type === "RETAIL_SHOP"
                    ? "Retail Shop"
                    : "Distribution Center"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Address:</span>
              <span className="text-muted-foreground">{warehouse.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Manager:</span>
              <span className="text-muted-foreground">{warehouse.manager}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Operating Hours:</span>
              <span className="text-muted-foreground">{warehouse.operatingHours}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Total Value:</span>
              <span className="text-muted-foreground">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: warehouse.currency }).format(
                  warehouse.totalValue,
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Security Level:</span>
              <span className="text-muted-foreground">{warehouse.securityLevel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Temperature:</span>
              <span className="text-muted-foreground">
                {warehouse.temperature.min}-{warehouse.temperature.max}
                {warehouse.temperature.unit}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Humidity:</span>
              <span className="text-muted-foreground">
                {warehouse.humidity.value}
                {warehouse.humidity.unit}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Capacity Trend</h3>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={capacityTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                <XAxis dataKey="month" stroke={isDark ? "#888" : "#888"} tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(value) => `${value}%`}
                  stroke={isDark ? "#888" : "#888"}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Capacity"]}
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#fff",
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                    color: isDark ? "#fff" : "#000",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="capacity"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  name="Capacity Usage"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
