"use client"

import { useState } from "react"
import { Info } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface WarehouseLayoutProps {
  id: string
}

interface Zone {
  id: string
  name: string
  description: string
  capacity: number
  units: number
  color: string
}

export function WarehouseLayout({ id }: WarehouseLayoutProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)

  // Mock data for zones
  const zones: Zone[] = [
    {
      id: "1",
      name: "Zone A",
      description: "Electronics section",
      capacity: 85,
      units: 42,
      color: "#3b82f6", // blue
    },
    {
      id: "2",
      name: "Zone B",
      description: "Home appliances",
      capacity: 62,
      units: 36,
      color: "#10b981", // green
    },
    {
      id: "3",
      name: "Zone C",
      description: "Clothing and accessories",
      capacity: 45,
      units: 28,
      color: "#8b5cf6", // purple
    },
    {
      id: "4",
      name: "Zone D",
      description: "Furniture and home decor",
      capacity: 78,
      units: 50,
      color: "#f59e0b", // amber
    },
  ]

  return (
    <Card className="card-hover-effect animate-slide-in-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Warehouse Layout</CardTitle>
            <CardDescription>Visual representation of warehouse zones</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Click on a zone to see more details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] w-full border rounded-md bg-muted/20 overflow-hidden">
          {/* Warehouse outline */}
          <div className="absolute inset-4 border-2 border-dashed border-muted-foreground/30 rounded-md">
            {/* Zones */}
            <div className="absolute inset-0 p-4 grid grid-cols-2 grid-rows-2 gap-4">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="relative rounded-md transition-all duration-200 cursor-pointer hover:shadow-lg"
                  style={{
                    backgroundColor: `${zone.color}20`,
                    borderColor: zone.color,
                    borderWidth: selectedZone?.id === zone.id ? "3px" : "1px",
                    transform: selectedZone?.id === zone.id ? "scale(1.02)" : "scale(1)",
                  }}
                  onClick={() => setSelectedZone(zone)}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <h3 className="text-lg font-bold" style={{ color: zone.color }}>
                      {zone.name}
                    </h3>
                    <p className="text-sm text-center text-muted-foreground">{zone.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" style={{ borderColor: zone.color, color: zone.color }}>
                        {zone.capacity}% Full
                      </Badge>
                      <Badge variant="outline" style={{ borderColor: zone.color, color: zone.color }}>
                        {zone.units} Units
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Entrance marker */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-2">
            <Badge className="bg-primary">Entrance</Badge>
          </div>

          {/* Loading docks */}
          <div className="absolute top-0 left-1/4 transform -translate-x-1/2 mt-2">
            <Badge variant="outline">Loading Dock 1</Badge>
          </div>
          <div className="absolute top-0 right-1/4 transform translate-x-1/2 mt-2">
            <Badge variant="outline">Loading Dock 2</Badge>
          </div>
        </div>

        {/* Selected zone details */}
        {selectedZone && (
          <div className="mt-4 p-4 border rounded-md animate-fade-in" style={{ borderColor: selectedZone.color }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ color: selectedZone.color }}>
                {selectedZone.name}
              </h3>
              <Badge style={{ backgroundColor: selectedZone.color }}>{selectedZone.capacity}% Capacity</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{selectedZone.description}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Units:</span> {selectedZone.units}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Products:</span> {selectedZone.units * 25}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Last Restocked:</span> 2 days ago
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Avg. Turnover:</span> 12 days
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
