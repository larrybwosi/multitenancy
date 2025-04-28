"use client"

import { Check, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"

const FONT_OPTIONS = [
  { name: "System Default", value: "system-ui, sans-serif" },
  { name: "Inter", value: "var(--font-inter)" },
  { name: "Roboto", value: "Roboto, sans-serif" },
  { name: "Open Sans", value: "'Open Sans', sans-serif" },
]

const COLOR_SCHEMES = [
  { name: "Default", value: "default" },
  { name: "Blue", value: "blue" },
  { name: "Green", value: "green" },
  { name: "Purple", value: "purple" },
  { name: "Orange", value: "orange" },
]

export function ThemeConfig() {
  const { theme, setTheme } = useTheme()
  const [font, setFont] = useState(FONT_OPTIONS[0].value)
  const [colorScheme, setColorScheme] = useState(COLOR_SCHEMES[0].value)

  const handleFontChange = (value: string) => {
    setFont(value)
    document.documentElement.style.setProperty("--font-family", value)
    // toast({
    //   title: "Font updated",
    //   description: "Your font preference has been saved.",
    // })
  }

  const handleColorSchemeChange = (value: string) => {
    setColorScheme(value)
    document.documentElement.setAttribute("data-color-scheme", value)
    // toast({
    //   title: "Color scheme updated",
    //   description: "Your color scheme preference has been saved.",
    // })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
            {theme === "light" && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
            {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <span className="mr-2">💻</span>
            <span>System</span>
            {theme === "system" && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="mr-2">🎨</span>
            <span>Color Scheme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {COLOR_SCHEMES.map((scheme) => (
                <DropdownMenuItem key={scheme.value} onClick={() => handleColorSchemeChange(scheme.value)}>
                  <span>{scheme.name}</span>
                  {colorScheme === scheme.value && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="mr-2">🔤</span>
            <span>Font</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {FONT_OPTIONS.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => handleFontChange(option.value)}>
                  <span>{option.name}</span>
                  {font === option.value && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
