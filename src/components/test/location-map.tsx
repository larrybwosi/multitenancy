"use client"

import { useEffect, useRef } from "react"

interface LocationMapProps {
  latitude: number
  longitude: number
  name: string
}

export function LocationMap({ latitude, longitude, name }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // This is a placeholder for a real map implementation
    // In a real application, you would use a library like Leaflet, Google Maps, or Mapbox

    if (!mapRef.current) return

    const mapContainer = mapRef.current

    // Clear any existing content
    mapContainer.innerHTML = ""

    // Create a simple placeholder map
    const mapPlaceholder = document.createElement("div")
    mapPlaceholder.className = "flex h-full w-full items-center justify-center bg-muted/50"
    mapPlaceholder.innerHTML = `
      <div class="text-center">
        <div class="mb-2 text-lg font-medium">${name}</div>
        <div class="text-sm text-muted-foreground">Latitude: ${latitude.toFixed(6)}</div>
        <div class="text-sm text-muted-foreground">Longitude: ${longitude.toFixed(6)}</div>
      </div>
    `

    mapContainer.appendChild(mapPlaceholder)

    // In a real implementation, you would initialize your map library here
    // Example with Leaflet:
    // const map = L.map(mapContainer).setView([latitude, longitude], 15)
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    // L.marker([latitude, longitude]).addTo(map).bindPopup(name)
  }, [latitude, longitude, name])

  return <div ref={mapRef} className="h-full w-full" />
}
