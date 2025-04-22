"use client"

import { useState, useRef, useEffect } from "react"
import { StorageZone, StorageUnit } from "@prisma/client"
import { useTheme } from "next-themes"
import { 
  Layers, 
  Grid3X3, 
  Package, 
  Boxes, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Minus, 
  Plus, 
  RefreshCcw,
  MapPin,
  Info
} from "lucide-react"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface WarehouseLayoutVisualizationProps {
  warehouseId: string
  zones: (StorageZone & {
    storageUnits?: StorageUnit[]
  })[]
  units: (StorageUnit & {
    zone?: StorageZone
    capacityUsed?: number
    productCount?: number
  })[]
}

export function WarehouseLayoutVisualization({ 
  warehouseId, 
  zones, 
  units 
}: WarehouseLayoutVisualizationProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  
  // Colors based on theme
  const zoneColors = [
    { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700" },
    { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-700" },
    { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700" },
    { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-700" },
    { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-700" },
    { bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-700" },
  ]
  
  // Calculate zone sizes based on number of units
  const getZoneSize = (zoneId: string) => {
    const zoneUnits = units.filter(unit => unit.zoneId === zoneId)
    const unitCount = zoneUnits.length
    
    // More sophisticated sizing algorithm could be implemented here
    if (unitCount <= 2) return { width: 220, height: 140 }
    if (unitCount <= 4) return { width: 300, height: 200 }
    if (unitCount <= 8) return { width: 400, height: 300 }
    return { width: 500, height: 350 }
  }
  
  // Get color for zone by its index
  const getZoneColor = (index: number) => {
    return zoneColors[index % zoneColors.length]
  }

  // Get unit color based on capacity used
  const getUnitColor = (unit: StorageUnit & { capacityUsed?: number }) => {
    if (!unit.capacity || unit.capacity === 0) return "bg-gray-100 border-gray-300"
    
    const usage = unit.capacityUsed || 0
    const percentage = (usage / unit.capacity) * 100
    
    if (percentage > 90) return "bg-red-100 border-red-300"
    if (percentage > 70) return "bg-amber-100 border-amber-300"
    if (percentage > 40) return "bg-green-100 border-green-300"
    return "bg-blue-100 border-blue-300"
  }
  
  // Reset the view to default
  const resetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setSelectedZone(null)
    setSelectedUnit(null)
  }
  
  // Zoom handlers
  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5))
  
  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    
    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }))
    setDragStart({ x: e.clientX, y: e.clientY })
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  // Calculate unit position within a zone
  const getUnitPosition = (unit: StorageUnit, zoneIndex: number, unitIndex: number) => {
    const unitsInZone = units.filter(u => u.zoneId === unit.zoneId).length
    const zone = zones.find(z => z.id === unit.zoneId)
    if (!zone) return { x: 0, y: 0 }
    
    const zoneSize = getZoneSize(zone.id)
    const unitSize = { width: 80, height: 80 }
    
    // Simple grid layout algorithm
    const maxCols = Math.floor(zoneSize.width / (unitSize.width + 20))
    const col = unitIndex % maxCols
    const row = Math.floor(unitIndex / maxCols)
    
    return {
      x: 20 + col * (unitSize.width + 20),
      y: 60 + row * (unitSize.height + 20)
    }
  }
  
  return (
    <div className="relative border rounded-lg overflow-hidden h-[500px] bg-[url('/grid-pattern.svg')]">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={resetView}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset View</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Info panel for selected elements */}
      {(selectedZone || selectedUnit) && (
        <div className="absolute bottom-4 right-4 z-10 p-4 bg-background/90 backdrop-blur-sm border rounded-lg shadow-md max-w-[300px]">
          {selectedZone && !selectedUnit && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                <h3 className="font-medium">{zones.find(z => z.id === selectedZone)?.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {zones.find(z => z.id === selectedZone)?.description || "No description"}
              </p>
              <div className="flex justify-between text-sm mt-2">
                <span>Units: {units.filter(u => u.zoneId === selectedZone).length}</span>
                <span>
                  {(() => {
                    const zone = zones.find(z => z.id === selectedZone)
                    if (!zone) return null
                    if (!zone.capacity) return "No capacity set"
                    return `${zone.capacityUsed || 0}/${zone.capacity} ${zone.capacityUnit?.toLowerCase() || 'units'}`
                  })()}
                </span>
              </div>
            </div>
          )}
          
          {selectedUnit && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-green-500" />
                <h3 className="font-medium">{units.find(u => u.id === selectedUnit)?.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                <span className="text-muted-foreground">Type:</span>
                <span className="capitalize">{units.find(u => u.id === selectedUnit)?.unitType.toLowerCase().replace(/_/g, ' ')}</span>
                
                <span className="text-muted-foreground">Products:</span>
                <span>{units.find(u => u.id === selectedUnit)?.productCount || 0}</span>
                
                <span className="text-muted-foreground">Usage:</span>
                <span>
                  {(() => {
                    const unit = units.find(u => u.id === selectedUnit)
                    if (!unit) return null
                    if (!unit.capacity) return "No capacity set"
                    const usage = ((unit.capacityUsed || 0) / unit.capacity) * 100
                    return `${Math.round(usage)}% (${unit.capacityUsed || 0}/${unit.capacity})`
                  })()}
                </span>
                
                {units.find(u => u.id === selectedUnit)?.position && (
                  <>
                    <span className="text-muted-foreground">Position:</span>
                    <span>{units.find(u => u.id === selectedUnit)?.position}</span>
                  </>
                )}
              </div>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 w-full"
            onClick={() => {
              if (selectedUnit) {
                setSelectedUnit(null)
                return
              }
              setSelectedZone(null)
            }}
          >
            Close
          </Button>
        </div>
      )}
      
      {/* Layout canvas */}
      <div 
        ref={containerRef}
        className={cn(
          "absolute inset-0 cursor-grab", 
          isDragging && "cursor-grabbing"
        )}
        style={{ overflow: 'hidden' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute transform-gpu"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          {/* Warehouse background */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-background/50 border-2 border-dashed border-muted-foreground/20 rounded-lg">
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">Warehouse Layout</span>
            </div>
          </div>
          
          {/* Zones */}
          {zones.map((zone, zIndex) => {
            const zoneSize = getZoneSize(zone.id)
            const zoneColor = getZoneColor(zIndex)
            const zoneUnits = units.filter(unit => unit.zoneId === zone.id)
            
            // Simple layout algorithm - position zones in a grid
            const rowSize = 2
            const col = zIndex % rowSize
            const row = Math.floor(zIndex / rowSize)
            const x = 100 + col * (zoneSize.width + 80)
            const y = 100 + row * (zoneSize.height + 80)
            
            return (
              <div 
                key={zone.id}
                className={cn(
                  "absolute rounded-lg border-2 shadow-sm transition-colors cursor-pointer",
                  zoneColor.bg,
                  zoneColor.border,
                  (selectedZone === zone.id || hoveredZone === zone.id) && "ring-2 ring-offset-2 ring-primary/50"
                )}
                style={{
                  left: x,
                  top: y,
                  width: zoneSize.width,
                  height: zoneSize.height
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedZone(zone.id)
                  setSelectedUnit(null)
                }}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
              >
                <div className={cn("px-4 py-2 border-b-2 flex justify-between items-center", zoneColor.border)}>
                  <div className="flex items-center gap-2">
                    <Layers className={cn("h-4 w-4", zoneColor.text)} />
                    <span className={cn("font-medium", zoneColor.text)}>{zone.name}</span>
                  </div>
                  {zone.capacity && (
                    <Badge className="bg-white text-gray-700 border-gray-200">
                      {Math.round(((zone.capacityUsed || 0) / zone.capacity) * 100)}% Full
                    </Badge>
                  )}
                </div>
                
                {/* Units within zone */}
                {zoneUnits.map((unit, uIndex) => {
                  const position = getUnitPosition(unit, zIndex, uIndex)
                  const unitColor = getUnitColor(unit)
                  
                  return (
                    <div
                      key={unit.id}
                      className={cn(
                        "absolute rounded-md border-2 flex flex-col justify-between p-2 shadow-sm cursor-pointer",
                        unitColor,
                        (selectedUnit === unit.id || hoveredUnit === unit.id) && "ring-2 ring-primary"
                      )}
                      style={{
                        left: position.x,
                        top: position.y,
                        width: 80,
                        height: 80
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedUnit(unit.id)
                        setSelectedZone(unit.zoneId || null)
                      }}
                      onMouseEnter={() => setHoveredUnit(unit.id)}
                      onMouseLeave={() => setHoveredUnit(null)}
                    >
                      <div className="text-xs font-medium truncate">{unit.name}</div>
                      
                      <div className="flex justify-between items-end w-full">
                        <Badge 
                          variant="outline" 
                          className="text-[10px] px-1 py-0 h-4 bg-white"
                        >
                          {unit.unitType.slice(0, 1)}
                        </Badge>
                        {unit.productCount !== undefined && unit.productCount > 0 ? (
                          <div className="flex items-center gap-0.5">
                            <Package className="h-3 w-3 text-gray-500" />
                            <span className="text-[10px]">{unit.productCount}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
                
                {zoneUnits.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-sm text-gray-400">No storage units</div>
                  </div>
                )}
              </div>
            )
          })}
          
          {zones.length === 0 && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="flex flex-col items-center justify-center">
                <Info className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-lg text-muted-foreground">No zones created yet</p>
                <p className="text-sm text-muted-foreground/70 max-w-[300px] mt-1">
                  Create storage zones to visualize your warehouse layout
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 