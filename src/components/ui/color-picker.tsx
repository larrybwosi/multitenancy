"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Paintbrush } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

const presetColors = [
  "#3b82f6", // blue
  "#10b981", // green
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
]

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(color)

  useEffect(() => {
    setSelectedColor(color)
  }, [color])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedColor(e.target.value)
  }

  const handleColorSelect = (preset: string) => {
    setSelectedColor(preset)
    onChange(preset)
  }

  const handleColorConfirm = () => {
    onChange(selectedColor)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[120px] justify-start text-left font-normal">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: selectedColor }} />
            <Paintbrush className="h-4 w-4" />
            <span className="sr-only">Pick a color</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Pick a color</h4>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedColor}
                onChange={handleColorChange}
                onBlur={handleColorConfirm}
                className="h-8 w-8 cursor-pointer appearance-none rounded-md border border-input bg-transparent"
              />
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                onBlur={handleColorConfirm}
                className="h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Presets</h4>
            <div className="grid grid-cols-8 gap-1">
              {presetColors.map((preset) => (
                <button
                  key={preset}
                  className="h-6 w-6 rounded-md border border-input"
                  style={{ backgroundColor: preset }}
                  onClick={() => handleColorSelect(preset)}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
