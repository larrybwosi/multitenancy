"use client";

import { useState } from "react";
import { Check, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { BusinessType, ModuleSelection } from "../setup-wizard";

interface ModulesSelectionStepProps {
  modules: ModuleSelection[];
  businessType: BusinessType | null;
  onChange: (modules: ModuleSelection[]) => void;
}

export function ModulesSelectionStep({
  modules,
  businessType,
  onChange,
}: ModulesSelectionStepProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const handleToggleModule = (moduleId: string) => {
    const updatedModules = modules.map((module) => {
      if (module.id === moduleId && !module.isRequired) {
        return { ...module, isActive: !module.isActive };
      }
      return module;
    });
    onChange(updatedModules);
  };

  // Group modules by category for the tabs
  const requiredModules = modules.filter((module) => module.isRequired);
  const optionalModules = modules.filter((module) => !module.isRequired);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Choose Your Modules
        </h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Select the features you need for your{" "}
          {businessType?.name || "business"}. You can always enable or disable
          modules later.
        </p>
      </div>

      {/* Tabs for filtering modules */}
      <div className="flex space-x-2 mb-6 border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "all"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-800"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All Modules
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "required"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-800"
          }`}
          onClick={() => setActiveTab("required")}
        >
          Required
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "active"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-800"
          }`}
          onClick={() => setActiveTab("active")}
        >
          Selected
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules
          .filter((module) => {
            if (activeTab === "all") return true;
            if (activeTab === "required") return module.isRequired;
            if (activeTab === "active") return module.isActive;
            return true;
          })
          .map((module) => (
            <Card
              key={module.id}
              className={`overflow-hidden transition-all border ${
                module.isActive
                  ? "border-primary/70 shadow-md ring-1 ring-primary/20"
                  : "border-gray-200 shadow-sm"
              }`}
            >
              <CardContent className="p-0">
                <div className="flex items-start justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{module.name}</h3>
                      {module.isRequired && (
                        <Badge
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          Required
                        </Badge>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{module.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {module.description}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Switch
                      id={`module-${module.id}`}
                      checked={module.isActive}
                      disabled={module.isRequired}
                      onCheckedChange={() => handleToggleModule(module.id)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
                {module.isActive && (
                  <div className="bg-primary/5 p-2 border-t border-primary/10 flex items-center justify-center text-xs text-primary">
                    <Check className="h-3 w-3 mr-1" /> Enabled
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="font-medium text-blue-800 mb-2">
          Recommended for {businessType?.name || "your business"}
        </h3>
        <p className="text-sm text-blue-700">
          We&apos;ve pre-selected the most common modules for your business
          type. You can customize this selection based on your specific needs.
        </p>
      </div>
    </div>
  );
} 