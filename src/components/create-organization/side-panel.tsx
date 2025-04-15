"use client"

import Image from "next/image"
import { Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface SidePanelProps {
  activeTab: string
}

export function SidePanel({ activeTab }: SidePanelProps) {
  return (
    <>
      <Card className="overflow-hidden border-orange-200 shadow-lg">
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src="/image7.jpg"
            alt="Organization setup illustration"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/70 to-amber-700/70 flex items-center justify-center p-8">
            <div className="text-white text-center">
              <h2 className="text-2xl font-bold mb-2">Get Your Business Online</h2>
              <p className="text-sm mb-4">Follow these simple steps to set up your organization</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6 bg-gradient-to-b from-white to-orange-50">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  activeTab === "details"
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md"
                    : "bg-orange-100 text-orange-500"
                }`}
              >
                1
              </div>
              <div>
                <h3 className="font-medium text-orange-900">Organization Details</h3>
                <p className="text-sm text-orange-700">Basic information about your business</p>
              </div>
            </div>
            <Separator className="bg-orange-200" />
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  activeTab === "settings"
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md"
                    : "bg-orange-100 text-orange-500"
                }`}
              >
                3
              </div>
              <div>
                <h3 className="font-medium text-orange-900">Business Settings</h3>
                <p className="text-sm text-orange-700">Configure operational preferences</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 shadow-md bg-gradient-to-br from-white to-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900">Need Help?</CardTitle>
          <CardDescription className="text-orange-700">Resources to guide you through setup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
              <Check className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-orange-900">Documentation</h4>
              <p className="text-xs text-orange-700">Read our detailed setup guides</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
              <Check className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-orange-900">Video Tutorials</h4>
              <p className="text-xs text-orange-700">Watch step-by-step instructions</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
              <Check className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-orange-900">Support Team</h4>
              <p className="text-xs text-orange-700">Contact us for personalized help</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default SidePanel
