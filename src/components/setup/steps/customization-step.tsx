"use client";

import { useState, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Upload, Trash2, Check, Palette, FileTerminal, PencilRuler, Upload as UploadIcon } from "lucide-react";
import type { BusinessType, BusinessCustomization, BusinessDetails } from "../setup-wizard";
import { toast } from "sonner";
import Image from "next/image";

// Function to upload files to the server
async function uploadFile(file: File): Promise<{ url: string; id: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Fallback function with default recommendations based on business type
function getDefaultRecommendations(businessType: BusinessType | null): Partial<BusinessCustomization> {
  if (businessType?.id === "restaurant") {
    return {
      primaryColor: "#8B4513", // Brown
      secondaryColor: "#FF6347", // Tomato
      accentColor: "#FFD700", // Gold
      theme: "RESTAURANT_MODERN",
      fonts: { heading: "Poppins", body: "Open Sans" },
      invoiceTemplate: "RESTAURANT",
      notifications: {
        lowStock: true,
        newOrder: true,
        customerBirthday: false,
      },
      printOptions: {
        includeLogo: true,
        includeQrCode: true,
        compactMode: false,
      },
    };
  } else if (businessType?.id === "retail") {
    return {
      primaryColor: "#2C3E50", // Dark blue
      secondaryColor: "#E74C3C", // Red
      accentColor: "#F1C40F", // Yellow
      theme: "RETAIL_ELEGANT",
      fonts: { heading: "Montserrat", body: "Roboto" },
      invoiceTemplate: "RETAIL",
      notifications: {
        lowStock: true,
        newOrder: true,
        customerBirthday: true,
      },
      printOptions: {
        includeLogo: true,
        includeQrCode: true,
        compactMode: false,
      },
    };
  } else if (businessType?.id === "salon") {
    return {
      primaryColor: "#663399", // Purple
      secondaryColor: "#FF69B4", // Pink
      accentColor: "#20B2AA", // Light Sea Green
      theme: "SALON_LUXURY",
      fonts: { heading: "Poppins", body: "Lato" },
      invoiceTemplate: "SERVICE",
      notifications: {
        lowStock: true,
        newOrder: true,
        customerBirthday: true,
      },
      printOptions: {
        includeLogo: true,
        includeQrCode: false,
        compactMode: false,
      },
    };
  } else {
    return {
      primaryColor: "#3498DB", // Blue
      secondaryColor: "#2ECC71", // Green
      accentColor: "#E67E22", // Orange
      theme: "DEFAULT",
      fonts: { heading: "Inter", body: "Inter" },
      invoiceTemplate: "DEFAULT",
      notifications: {
        lowStock: true,
        newOrder: true,
        customerBirthday: false,
      },
      printOptions: {
        includeLogo: true,
        includeQrCode: false,
        compactMode: false,
      },
    };
  }
}

interface CustomizationStepProps {
  customization: BusinessCustomization;
  businessType: BusinessType | null;
  onChange: (customization: BusinessCustomization) => void;
  businessDetails?: BusinessDetails;
}

function CustomizationStep({ customization, businessType, onChange, businessDetails }: CustomizationStepProps) {
  const [activeTab, setActiveTab] = useState("appearance");
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [isGettingRecommendations, setIsGettingRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<Partial<BusinessCustomization> | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

  const handleCustomizationChange = (field: keyof BusinessCustomization, value: any) => {
    onChange({ ...customization, [field]: value });
  };

  const handleGetRecommendations = async () => {
    setIsGettingRecommendations(true);
    try {
      const recommendations = getDefaultRecommendations(businessType);
      setRecommendations(recommendations);
      handleCustomizationChange("primaryColor", recommendations.primaryColor);
      handleCustomizationChange("secondaryColor", recommendations.secondaryColor);
      handleCustomizationChange("accentColor", recommendations.accentColor);
      handleCustomizationChange("theme", recommendations.theme);
      handleCustomizationChange("fonts", recommendations.fonts);
      handleCustomizationChange("invoiceTemplate", recommendations.invoiceTemplate);
      handleCustomizationChange("notifications", recommendations.notifications);
      handleCustomizationChange("printOptions", recommendations.printOptions);
      toast.success("AI-Powered design recommendations received successfully!");
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast.error("Failed to get AI-Powered design recommendations.");
    } finally {
      setIsGettingRecommendations(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingLogo(true);
    try {
      const { url } = await uploadFile(file);
      handleCustomizationChange("logos", {
        ...customization.logos,
        primary: url,
      });
      toast.success("Business logo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload business logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploadingFavicon(true);
    try {
      const { url } = await uploadFile(file);
      handleCustomizationChange("logos", {
        ...customization.logos,
        favicon: url,
      });
      toast.success("Favicon uploaded successfully!");
    } catch (error) {
      console.error("Error uploading favicon:", error);
      toast.error("Failed to upload favicon.");
    } finally {
      setIsUploadingFavicon(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Customize Your Business
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Personalize your business appearance and branding with these customization options.
        </p>
        
        <div className="mt-6 flex justify-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
            onClick={handleGetRecommendations}
            disabled={isGettingRecommendations || !businessType}
          >
            {isGettingRecommendations ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Get AI-Powered Design Recommendations
          </Button>
        </div>
        
        {businessType && (
          <div className="mt-3 text-sm text-gray-500">
            Gemini AI will analyze your business type and provide personalized design recommendations.
          </div>
        )}
      </div>

      <Tabs defaultValue="appearance" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="appearance" className="flex items-center gap-1.5">
            <Palette className="h-4 w-4" />
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value="receipt" className="flex items-center gap-1.5">
            <FileTerminal className="h-4 w-4" />
            <span>Documents</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-1.5">
            <PencilRuler className="h-4 w-4" />
            <span>Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colors Section */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Brand Colors</h3>
                <div className="space-y-4">
                  {/* Primary Color */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="primary-color" className="font-medium">Primary Color</Label>
                      <div 
                        className="w-8 h-8 rounded border cursor-pointer"
                        style={{ backgroundColor: customization.primaryColor }}
                        onClick={() => setActiveColorPicker(activeColorPicker === "primary" ? null : "primary")}
                      />
                    </div>
                    <Input 
                      id="primary-color"
                      value={customization.primaryColor}
                      onChange={(e) => handleCustomizationChange("primaryColor", e.target.value)}
                      className="mb-2"
                    />
                    {activeColorPicker === "primary" && (
                      <div className="relative z-10 mt-2">
                        <div className="absolute right-0 p-2 bg-white border rounded-lg shadow-lg">
                          <HexColorPicker 
                            color={customization.primaryColor} 
                            onChange={(color) => handleCustomizationChange("primaryColor", color)} 
                          />
                          <div className="mt-2 flex justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setActiveColorPicker(null)}
                            >
                              <Check className="h-4 w-4 mr-1" /> Done
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="secondary-color" className="font-medium">Secondary Color</Label>
                      <div 
                        className="w-8 h-8 rounded border cursor-pointer"
                        style={{ backgroundColor: customization.secondaryColor }}
                        onClick={() => setActiveColorPicker(activeColorPicker === "secondary" ? null : "secondary")}
                      />
                    </div>
                    <Input 
                      id="secondary-color"
                      value={customization.secondaryColor}
                      onChange={(e) => handleCustomizationChange("secondaryColor", e.target.value)}
                      className="mb-2"
                    />
                    {activeColorPicker === "secondary" && (
                      <div className="relative z-10 mt-2">
                        <div className="absolute right-0 p-2 bg-white border rounded-lg shadow-lg">
                          <HexColorPicker 
                            color={customization.secondaryColor} 
                            onChange={(color) => handleCustomizationChange("secondaryColor", color)} 
                          />
                          <div className="mt-2 flex justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setActiveColorPicker(null)}
                            >
                              <Check className="h-4 w-4 mr-1" /> Done
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accent Color */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="accent-color" className="font-medium">Accent Color</Label>
                      <div 
                        className="w-8 h-8 rounded border cursor-pointer"
                        style={{ backgroundColor: customization.accentColor || "#22c55e" }}
                        onClick={() => setActiveColorPicker(activeColorPicker === "accent" ? null : "accent")}
                      />
                    </div>
                    <Input 
                      id="accent-color"
                      value={customization.accentColor || "#22c55e"}
                      onChange={(e) => handleCustomizationChange("accentColor", e.target.value)}
                      className="mb-2"
                    />
                    {activeColorPicker === "accent" && (
                      <div className="relative z-10 mt-2">
                        <div className="absolute right-0 p-2 bg-white border rounded-lg shadow-lg">
                          <HexColorPicker 
                            color={customization.accentColor || "#22c55e"} 
                            onChange={(color) => handleCustomizationChange("accentColor", color)} 
                          />
                          <div className="mt-2 flex justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setActiveColorPicker(null)}
                            >
                              <Check className="h-4 w-4 mr-1" /> Done
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Selection */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Theme</h3>
                <div className="space-y-4">
                  <Label htmlFor="theme-select" className="font-medium">Select Theme</Label>
                  <Select 
                    value={customization.theme}
                    onValueChange={(value) => handleCustomizationChange("theme", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* {getThemeOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))} */}
                    </SelectContent>
                  </Select>

                  <div className="pt-4">
                    <Label htmlFor="show-footer" className="inline-flex items-center gap-2">
                      <Switch 
                        id="show-footer" 
                        checked={customization.showFooter}
                        onCheckedChange={(checked) => handleCustomizationChange("showFooter", checked)}
                      />
                      <span>Show Footer</span>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logo Upload */}
            <Card className="md:col-span-2">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Business Branding</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Main Logo Upload */}
                  <div className="space-y-4">
                    <Label htmlFor="logo-upload" className="font-medium">Business Logo</Label>
                    <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      {customization.logos?.primary ? (
                        <div className="relative w-full aspect-[3/1] flex items-center justify-center">
                          <Image 
                            src={customization.logos.primary} 
                            alt="Business logo" 
                            width={200}
                            height={100}
                            className="max-h-full max-w-full object-contain" 
                          />
                          <Button 
                            variant="destructive" 
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => {
                              handleCustomizationChange("logos", {
                                ...customization.logos,
                                primary: "",
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <UploadIcon
                            className="mx-auto h-12 w-12 text-gray-400"
                            strokeWidth={1.5}
                          />
                          <div className="flex flex-col items-center mt-2">
                            <input
                              ref={logoInputRef}
                              type="file"
                              id="logo-upload"
                              className="hidden"
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                            <Button 
                              variant="outline"
                              onClick={() => logoInputRef.current?.click()}
                              disabled={isUploadingLogo}
                            >
                              {isUploadingLogo ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Logo
                                </>
                              )}
                            </Button>
                            <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Your logo will appear on your storefront, receipts, and other customer-facing materials.
                    </p>
                  </div>
                
                  {/* Favicon Upload */}
                  <div className="space-y-4">
                    <Label htmlFor="favicon-upload" className="font-medium">Favicon (Browser Icon)</Label>
                    <div className="flex flex-col p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 h-[calc(100%-2rem)]">
                      <div className="flex items-center space-x-4 mb-4">
                        {customization.logos?.favicon ? (
                          <div className="w-16 h-16 border rounded bg-white flex items-center justify-center overflow-hidden">
                            <Image 
                              src={customization.logos.favicon} 
                              alt="Favicon" 
                              width={32}
                              height={32}
                              className="w-full h-full object-contain p-2" 
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 border rounded bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Icon</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            ref={faviconInputRef}
                            type="file"
                            id="favicon-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFaviconUpload}
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => faviconInputRef.current?.click()}
                            disabled={isUploadingFavicon}
                            className="w-full mb-1"
                          >
                            {isUploadingFavicon ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Favicon
                              </>
                            )}
                          </Button>
                          {customization.logos?.favicon && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-1"
                              onClick={() => {
                                handleCustomizationChange("logos", {
                                  ...customization.logos,
                                  favicon: "",
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-auto">
                        Your favicon will appear in browser tabs and bookmarks. Square images work best.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Receipt & Invoice Tab */}
        <TabsContent value="receipt" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Receipt Customization</h3>
                
                <div className="space-y-3">
                  <Label htmlFor="receipt-header" className="font-medium">Receipt Header</Label>
                  <Textarea 
                    id="receipt-header"
                    placeholder="Enter text to appear at the top of receipts"
                    value={customization.receiptHeader || ""}
                    onChange={(e) => handleCustomizationChange("receiptHeader", e.target.value)}
                    className="min-h-20"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="receipt-footer" className="font-medium">Receipt Footer</Label>
                  <Textarea 
                    id="receipt-footer"
                    placeholder="Enter text to appear at the bottom of receipts"
                    value={customization.receiptFooter || ""}
                    onChange={(e) => handleCustomizationChange("receiptFooter", e.target.value)}
                    className="min-h-20"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="invoice-template" className="font-medium">Invoice Template</Label>
                  <Select 
                    value={customization.invoiceTemplate}
                    onValueChange={(value) => handleCustomizationChange("invoiceTemplate", value)}
                  >
                    <SelectTrigger id="invoice-template">
                      <SelectValue placeholder="Select an invoice template" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* {getInvoiceTemplates().map((template) => (
                        <SelectItem key={template.value} value={template.value}>
                          {template.label}
                        </SelectItem>
                      ))} */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium mb-3">Print Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="include-logo" className="cursor-pointer">Include Logo</Label>
                      <Switch 
                        id="include-logo" 
                        checked={customization.printOptions?.includeLogo || false}
                        onCheckedChange={(checked) => {
                          handleCustomizationChange("printOptions", {
                            includeLogo: checked,
                            includeQrCode: customization.printOptions?.includeQrCode || false,
                            compactMode: customization.printOptions?.compactMode || false,
                          });
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="include-qr" className="cursor-pointer">Include QR Code</Label>
                      <Switch 
                        id="include-qr" 
                        checked={customization.printOptions?.includeQrCode || false}
                        onCheckedChange={(checked) => {
                          handleCustomizationChange("printOptions", {
                            includeLogo: customization.printOptions?.includeLogo || false,
                            includeQrCode: checked,
                            compactMode: customization.printOptions?.compactMode || false,
                          });
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="compact-mode" className="cursor-pointer">Compact Mode</Label>
                      <Switch 
                        id="compact-mode" 
                        checked={customization.printOptions?.compactMode || false}
                        onCheckedChange={(checked) => {
                          handleCustomizationChange("printOptions", {
                            includeLogo: customization.printOptions?.includeLogo || false,
                            includeQrCode: customization.printOptions?.includeQrCode || false,
                            compactMode: checked,
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preferences Tab - New Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Display Options</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ui-density" className="font-medium">UI Density</Label>
                    <Select 
                      value={customization.uiDensity || "comfortable"}
                      onValueChange={(value) => handleCustomizationChange("uiDensity", value as "compact" | "comfortable" | "spacious")}
                    >
                      <SelectTrigger id="ui-density">
                        <SelectValue placeholder="Select UI density" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-format" className="font-medium">Date Format</Label>
                    <Select 
                      value={customization.dateFormat || "DD/MM/YYYY"}
                      onValueChange={(value) => handleCustomizationChange("dateFormat", value)}
                    >
                      <SelectTrigger id="date-format">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time-format" className="font-medium">Time Format</Label>
                    <Select 
                      value={customization.timeFormat || "24h"}
                      onValueChange={(value) => handleCustomizationChange("timeFormat", value as "12h" | "24h")}
                    >
                      <SelectTrigger id="time-format">
                        <SelectValue placeholder="Select time format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="low-stock" className="cursor-pointer">Low Stock Alerts</Label>
                    <Switch 
                      id="low-stock" 
                      checked={customization.notifications?.lowStock || false}
                      onCheckedChange={(checked) => {
                        handleCustomizationChange("notifications", {
                          lowStock: checked,
                          newOrder: customization.notifications?.newOrder || false,
                          customerBirthday: customization.notifications?.customerBirthday || false,
                        });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-order" className="cursor-pointer">New Order Notifications</Label>
                    <Switch 
                      id="new-order" 
                      checked={customization.notifications?.newOrder || false}
                      onCheckedChange={(checked) => {
                        handleCustomizationChange("notifications", {
                          lowStock: customization.notifications?.lowStock || false,
                          newOrder: checked,
                          customerBirthday: customization.notifications?.customerBirthday || false,
                        });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="customer-birthday" className="cursor-pointer">Customer Birthday Reminders</Label>
                    <Switch 
                      id="customer-birthday" 
                      checked={customization.notifications?.customerBirthday || false}
                      onCheckedChange={(checked) => {
                        handleCustomizationChange("notifications", {
                          lowStock: customization.notifications?.lowStock || false,
                          newOrder: customization.notifications?.newOrder || false,
                          customerBirthday: checked,
                        });
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Regional Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency-format" className="font-medium">Currency</Label>
                    <Select 
                      value={customization.currencyFormat || "KES"}
                      onValueChange={(value) => handleCustomizationChange("currencyFormat", value)}
                    >
                      <SelectTrigger id="currency-format">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                        <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                        <SelectItem value="UGX">Ugandan Shilling (UGX)</SelectItem>
                        <SelectItem value="TZS">Tanzanian Shilling (TZS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="font-medium">Language</Label>
                    <Select 
                      value={customization.languagePreference || "en"}
                      onValueChange={(value) => handleCustomizationChange("languagePreference", value)}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Font Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="heading-font" className="font-medium">Heading Font</Label>
                    <Select 
                      value={customization.fonts?.heading || "Inter"}
                      onValueChange={(value) => {
                        handleCustomizationChange("fonts", {
                          ...customization.fonts,
                          heading: value
                        });
                      }}
                    >
                      <SelectTrigger id="heading-font">
                        <SelectValue placeholder="Select heading font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body-font" className="font-medium">Body Font</Label>
                    <Select 
                      value={customization.fonts?.body || "Inter"}
                      onValueChange={(value) => {
                        handleCustomizationChange("fonts", {
                          ...customization.fonts,
                          body: value
                        });
                      }}
                    >
                      <SelectTrigger id="body-font">
                        <SelectValue placeholder="Select body font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-800 mb-2">
          Brand Preview
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Here&apos;s how your brand colors and customizations will look in your business materials.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Color Palette Preview */}
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-3">Color Palette</h4>
            <div className="space-y-3">
              <div>
                <div className="h-10 w-full rounded-md" style={{ backgroundColor: customization.primaryColor }} />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">Primary</span>
                  <span className="text-xs font-mono">{customization.primaryColor}</span>
                </div>
              </div>
              <div>
                <div className="h-10 w-full rounded-md" style={{ backgroundColor: customization.secondaryColor }} />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">Secondary</span>
                  <span className="text-xs font-mono">{customization.secondaryColor}</span>
                </div>
              </div>
              <div>
                <div className="h-10 w-full rounded-md" style={{ backgroundColor: customization.accentColor || "#22c55e" }} />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">Accent</span>
                  <span className="text-xs font-mono">{customization.accentColor || "#22c55e"}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
              <h5 className="text-xs font-medium text-gray-700 mb-2">Typography</h5>
              <div 
                className="text-base mb-1"
                style={{ 
                  fontFamily: customization.fonts?.heading || "Inter",
                  color: customization.primaryColor
                }}
              >
                Heading Text
              </div>
              <div 
                className="text-sm"
                style={{ 
                  fontFamily: customization.fonts?.body || "Inter",
                  color: "#374151"
                }}
              >
                Body text sample with your selected font settings.
                This is how content will appear in your application.
              </div>
            </div>
          </div>
          
          {/* Receipt Preview */}
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-3">Receipt Preview</h4>
            <div className="p-3 bg-white border rounded-lg text-xs font-mono" style={{ 
              maxWidth: "220px", 
              margin: "0 auto",
              minHeight: "200px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {customization.printOptions?.includeLogo && (
                <div className="text-center mb-2">
                  {customization.logos?.primary ? (
                    <Image 
                      src={customization.logos.primary} 
                      alt="Business logo" 
                      width={80}
                      height={40}
                      className="mx-auto h-8 object-contain" 
                    />
                  ) : (
                    <div className="font-bold" style={{ color: customization.primaryColor }}>
                      {businessDetails?.name || "Your Business"}
                    </div>
                  )}
                </div>
              )}
              
              {customization.receiptHeader && (
                <div className="text-center mb-2 text-[10px]">{customization.receiptHeader}</div>
              )}
              
              <div className="text-center mb-2">
                <div>{new Date().toLocaleDateString(
                  customization.languagePreference === "en" ? "en-US" : 
                  customization.languagePreference === "sw" ? "sw-KE" : "en-US",
                  { dateStyle: "medium" }
                )}</div>
                <div>Order #1001</div>
              </div>
              
              <div className="border-t border-b border-dotted py-1 mb-2">
                <div className="flex justify-between">
                  <span>Item 1</span>
                  <span>9.99</span>
                </div>
                <div className="flex justify-between">
                  <span>Item 2</span>
                  <span>19.99</span>
                </div>
              </div>
              
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>29.98</span>
              </div>
              
              {customization.receiptFooter && (
                <div className="text-center mt-2 text-[10px]">{customization.receiptFooter}</div>
              )}
              
              {customization.printOptions?.includeQrCode && (
                <div className="text-center mt-2 border border-dashed w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="text-[9px]">QR Code</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomizationStep; 