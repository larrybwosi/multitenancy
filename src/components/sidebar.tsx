"use client";
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Bell,
  HelpCircle,
  LogOut,
  PanelLeftClose,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/lib/auth/authClient";
import { usePathname } from "next/navigation";
// import { useOrganizationName } from "@/lib/hooks/use-org";

export interface RouteItem {
  title: string;
  icon?: React.ReactNode;
  path?: string;
  children?: RouteItem[];
  badge?: number;
  isChecked?: boolean; // New property for checkbox state
}

export interface SectionItem {
  title: string;
  routes: RouteItem[];
  initiallyExpanded?: boolean;
}

interface SidebarProps {
  appName: string;
  hotelAddress: string;
  sections: SectionItem[];
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
}

const isRouteOrChildActive = (
  route: RouteItem,
  currentPath: string
): boolean => {
  if (route.path === currentPath) return true;
  if (route.children) {
    return route.children.some((child) =>
      isRouteOrChildActive(child, currentPath)
    );
  }
  return false;
};

const isSectionActive = (
  section: SectionItem,
  currentPath: string
): boolean => {
  return section.routes.some((route) =>
    isRouteOrChildActive(route, currentPath)
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  appName,
  hotelAddress,
  sections,
  user,
}) => {
  
    // const {
    //   data: organizationName,
    // } = useOrganizationName();
  
  const currentPath = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    () => {
      const initialState: Record<string, boolean> = {};
      sections.forEach((section) => {
        section.routes.forEach((route) => {
          if (route.children && isRouteOrChildActive(route, currentPath)) {
            initialState[route.title] = true;
          }
        });
      });
      return initialState;
    }
  );

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    const initialState: Record<string, boolean> = {};
    sections.forEach((section) => {
      initialState[section.title] =
        section.initiallyExpanded || isSectionActive(section, currentPath);
    });
    return initialState;
  });

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const renderRouteItem = (route: RouteItem, level = 0) => {
    const isActive = route.path === currentPath;
    const isDirectChildActive = route.children
      ? route.children.some((child) => child.path === currentPath)
      : false;
    const isMenuExpanded = !!expandedMenus[route.title];
    const hasChildren = route.children && route.children.length > 0;
    const isParentHighlighted = isDirectChildActive && isMenuExpanded;

    const itemPaddingLeft = level === 0 ? "pl-4 pr-4" : `pl-10 pr-4`;
    const baseClasses = `flex items-center w-full text-sm cursor-pointer group ${itemPaddingLeft} py-2.5`;
    const inactiveClasses = `text-neutral-600 hover:text-neutral-900 hover:bg-gray-100 border-l-2 border-transparent`;
    const activeClasses = `text-neutral-900 bg-blue-50 font-medium border-l-2 border-blue-500`;
    const parentActiveClasses = `text-neutral-900 hover:text-neutral-900 hover:bg-blue-50 border-l-2 border-transparent font-medium`;

    let itemClasses = `${baseClasses} `;
    if (isActive) {
      itemClasses += activeClasses;
    } else if (level === 0 && isParentHighlighted) {
      itemClasses += parentActiveClasses;
    } else {
      itemClasses += inactiveClasses;
    }

    const iconClasses = `w-5 h-5 mr-3 ${isActive || (level === 0 && isParentHighlighted) ? "text-blue-500" : "text-neutral-400 group-hover:text-neutral-600"}`;

    return (
      <div key={route.title} className="w-full">
        {route.path ? (
          <Link href={route.path} className={itemClasses}>
            <div className={`${iconClasses} flex-shrink-0`}>
              {route.icon ? (
                route.icon
              ) : level > 0 ? (
                <div className="w-5 h-5"></div>
              ) : null}
            </div>
            <span className="flex-1 truncate">{route.title}</span>

            {/* Checkbox for items that have isChecked property */}
            {route.isChecked !== undefined && (
              <input
                type="checkbox"
                checked={route.isChecked}
                className="ml-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
                readOnly
              />
            )}

            {route.badge != null && (
              <div className="ml-2 rounded-full bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                {route.badge}
              </div>
            )}
            {hasChildren && (
              <div className="ml-1 text-neutral-400">
                {isMenuExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
            )}
          </Link>
        ) : (
          <div
            className={itemClasses}
            onClick={() => hasChildren && toggleMenu(route.title)}
          >
            <div className={`${iconClasses} flex-shrink-0`}>
              {route.icon ? (
                route.icon
              ) : level > 0 ? (
                <div className="w-5 h-5"></div>
              ) : null}
            </div>
            <span className="flex-1 truncate">{route.title}</span>
            {route.badge != null && (
              <div className="ml-2 rounded-full bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
                {route.badge}
              </div>
            )}
            {hasChildren && (
              <div className="ml-1 text-neutral-400">
                {isMenuExpanded ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
            )}
          </div>
        )}

        {hasChildren && isMenuExpanded && (
          <div className="mt-1">
            {route.children!.map((child) => renderRouteItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-neutral-200 flex flex-col shadow-sm">
      {/* App Header */}
      <div className="px-5 py-4 flex items-center border-b border-neutral-200 bg-white">
        <span className="font-bold text-xl text-neutral-800">{appName}™</span>
        <div className="ml-auto">
          <PanelLeftClose
            size={20}
            className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Hotel Info */}
      <div className="px-5 py-3 border-b border-neutral-200 hover:bg-gray-50 cursor-pointer bg-white">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-full text-sm font-medium mr-3 flex-shrink-0">
            {"D"}
            {/* {organizationName ? organizationName.charAt(0).toUpperCase() : "D"} */}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-semibold text-neutral-800 truncate">
              {"Dealio"}
              {/* {organizationName || "Dealio"} */}
            </div>
            <div className="text-xs text-neutral-500 truncate">
              {hotelAddress}
            </div>
          </div>
          <div className="ml-2">
            <ChevronDown
              size={16}
              className="text-neutral-400 hover:text-neutral-600"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto pt-3 pb-4 bg-gray-50">
        {sections.map((section) => {
          const isSectionExpanded = !!expandedSections[section.title];
          return (
            <div key={section.title} className="mb-3">
              <div
                className="px-5 py-2 flex items-center justify-between cursor-pointer group hover:bg-gray-100 rounded mx-2"
                onClick={() => toggleSection(section.title)}
              >
                <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider group-hover:text-neutral-600">
                  {section.title}
                </div>
                {isSectionExpanded ? (
                  <Minus
                    size={16}
                    className="text-neutral-400 group-hover:text-neutral-600"
                  />
                ) : (
                  <Plus
                    size={16}
                    className="text-neutral-400 group-hover:text-neutral-600"
                  />
                )}
              </div>

              {isSectionExpanded && (
                <div className="mt-1 space-y-0.5 mx-2">
                  {section.routes.map((route) => renderRouteItem(route, 0))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-neutral-200 mt-auto bg-white">
        <Link
          href={"/notifications"}
          className={`px-5 py-2.5 flex items-center cursor-pointer hover:bg-gray-50 group ${
            currentPath === "/notifications"
              ? "bg-blue-50 text-blue-600"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <Bell
            size={20}
            className={`mr-3 ${
              currentPath === "/notifications"
                ? "text-blue-500"
                : "text-neutral-400 group-hover:text-neutral-600"
            }`}
          />
          <span className="text-sm">Notifications</span>
          <div className="ml-auto rounded-full bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs">
            5
          </div>
        </Link>
        <Link
          href={"/support"}
          className={`px-5 py-2.5 flex items-center cursor-pointer hover:bg-gray-50 group ${
            currentPath === "/support"
              ? "bg-blue-50 text-blue-600"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <HelpCircle
            size={20}
            className={`mr-3 ${
              currentPath === "/support"
                ? "text-blue-500"
                : "text-neutral-400 group-hover:text-neutral-600"
            }`}
          />
          <span className="text-sm">Support</span>
        </Link>
      </div>

      {/* User Profile */}
      <div className="px-5 py-3 border-t border-neutral-200 flex items-center bg-white">
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name}
            height={32}
            width={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium flex-shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : "?"}
          </div>
        )}
        <div className="ml-3 overflow-hidden">
          <div className="text-sm font-medium text-neutral-800 truncate">
            {user.name}
          </div>
          <div className="text-xs text-neutral-500 truncate">{user.role}</div>
        </div>
        <LogOut
          size={18}
          onClick={async () => {
            await signOut();
            window.location.href = "/check-in";
          }}
          className="ml-auto text-neutral-400 hover:text-neutral-600 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default Sidebar;
