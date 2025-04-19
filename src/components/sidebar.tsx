'use client';
import React, { useState, } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Bell,
  HelpCircle,
  LogOut,
  PanelLeftClose,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth/authClient';
import Link from 'next/link';

// --- Type Definitions ---

// Route item remains the same
export interface RouteItem {
  id: string;
  title: string;
  icon?: React.ReactNode; // Made optional, especially for children
  path?: string;
  children?: RouteItem[];
  badge?: number;
  // 'section' property is no longer needed here if sections are passed structurally
}

// New type for a section
export interface SectionItem {
  id: string; // Unique ID for the section (for keys and state)
  title: string; // Display title for the section header
  routes: RouteItem[]; // Routes belonging to this section
  initiallyExpanded?: boolean; // Optional: control initial state
}

// Updated Sidebar Props
interface SidebarProps {
  appName: string;
  hotelName: string;
  hotelAddress: string;
  sections: SectionItem[]; // Use the new SectionItem array
  currentRoute: string;
  user: {
    name: string;
    role: string;
    avatar?: string;
  };
}

// --- Helper Functions ---

// Helper to determine if a route or its children are active (recursive)
const isRouteOrChildActive = (
  route: RouteItem,
  currentRoute: string
): boolean => {
  if (route.path === currentRoute) return true;
  if (route.children) {
    return route.children.some((child) => isRouteOrChildActive(child, currentRoute));
  }
  return false;
};

// Helper to check if any route within a section is active
const isSectionActive = (section: SectionItem, currentRoute: string): boolean => {
    return section.routes.some(route => isRouteOrChildActive(route, currentRoute));
}


// --- The Main Sidebar Component ---
const Sidebar: React.FC<SidebarProps> = ({
  appName,
  hotelName,
  hotelAddress,
  sections,
  currentRoute,
  user,
}) => {

  // State to track which *menu items* (routes with children) are expanded
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    sections.forEach(section => {
        section.routes.forEach(route => {
            if (route.children && isRouteOrChildActive(route, currentRoute)) {
              initialState[route.id] = true;
            }
        });
    });
    return initialState;
  });
  const router = useRouter()

  // State to track which *sections* are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    sections.forEach(section => {
        // Expand if initially requested OR if it contains the active route
        initialState[section.id] = section.initiallyExpanded || isSectionActive(section, currentRoute);
    });
    return initialState;
  });


  // Toggle expanded state for a menu item (route with children)
  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  // Toggle expanded state for a section
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
        ...prev,
        [sectionId]: !prev[sectionId],
    }));
  };


  // REMOVED: useMemo hook for hardcoded sections is no longer needed

  // Render a single route item (parent or child)
  const renderRouteItem = (route: RouteItem, level = 0) => {
    const isActive = route.path === currentRoute;
    // Check if a direct child is the active route
    const isDirectChildActive = route.children ? route.children.some(child => child.path === currentRoute) : false;
    const isMenuExpanded = !!expandedMenus[route.id]; // Use !! to ensure boolean
    const hasChildren = route.children && route.children.length > 0;
    // Highlight parent if a child is active AND the parent menu is expanded
    const isParentHighlighted = isDirectChildActive && isMenuExpanded;

    const itemPaddingLeft = level === 0 ? 'pl-3 pr-3' : `pl-9 pr-3`; // Indentation for children

    // Common classes
    const baseClasses = `flex items-center w-full text-sm cursor-pointer group ${itemPaddingLeft} py-2.5`;
    const inactiveClasses = `text-neutral-600 hover:text-neutral-900 hover:bg-gray-100 border-l-2 border-transparent`;
    // Active state applies only if the item itself is the current route
    const activeClasses = `text-neutral-900 bg-gray-100 font-medium border-l-2 border-neutral-800`;
     // Special style for parent when its direct child is active and the menu is expanded
    const parentActiveClasses = `text-neutral-900 hover:text-neutral-900 hover:bg-gray-100 border-l-2 border-transparent font-medium`;

    let itemClasses = `${baseClasses} `;
    if (isActive) {
        itemClasses += activeClasses;
    } else if (level === 0 && isParentHighlighted) {
        itemClasses += parentActiveClasses;
    } else {
        itemClasses += inactiveClasses;
    }


    // Icon classes - Highlight icon if item is active OR if it's a highlighted parent
    const iconClasses = `w-5 h-5 mr-3 ${isActive || (level === 0 && isParentHighlighted) ? 'text-neutral-700' : 'text-neutral-400 group-hover:text-neutral-600'}`;

    return (
      <div key={route.id} className="w-full">
        <div
          className={itemClasses}
          onClick={() => {
            if (hasChildren) {
              toggleMenu(route.id); // Toggle submenu
            } else if (route.path) {
              router.push(route.path); // Navigate
            }
          }}
        >
          {/* Render Icon only for top-level or if explicitly provided for child */}
          {/* Icon container ensures alignment even if icon is missing */}
          <div className={`${iconClasses} flex-shrink-0`}>
            {route.icon ? route.icon : (level > 0 ? <div className="w-5 h-5"></div> : null) /* Placeholder for alignment */}
          </div>


          <span className="flex-1 truncate">{route.title}</span>

          {/* Badge */}
          {route.badge != null && ( // Check for null/undefined explicitly
            <div className="ml-2 rounded-full bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">
              {route.badge}
            </div>
          )}

          {/* Chevron for expandable items */}
          {hasChildren && (
            <div className="ml-1 text-neutral-400">
              {isMenuExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          )}
        </div>

        {/* Render children if expanded */}
        {hasChildren && isMenuExpanded && (
          <div className="mt-1">
            {route.children!.map((child) => renderRouteItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen w-64 bg-gray-50 border-r border-neutral-200 flex flex-col">
      {/* App Header */}
      <div className="px-4 py-3 flex items-center border-b border-neutral-200">
        <span className="font-bold text-lg text-neutral-800">{appName}™</span>
        <div className="ml-auto">
            <PanelLeftClose size={20} className="text-neutral-400" />
        </div>
      </div>

      {/* Hotel Info */}
      <div className="px-4 py-3 border-b border-neutral-200 hover:bg-gray-100 cursor-pointer">
        <div className="flex items-center">
          <div className="w-7 h-7 bg-green-600 text-white flex items-center justify-center rounded-full text-sm font-medium mr-2.5 flex-shrink-0">
             {hotelName ? hotelName.charAt(0).toUpperCase() : 'H'}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-semibold text-neutral-800 truncate">
              {hotelName}
            </div>
            <div className="text-xs text-neutral-500 truncate">{hotelAddress}</div>
          </div>
          <div className="ml-2">
            <ChevronDown size={16} className="text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Navigation - Iterating over sections prop */}
      <div className="flex-1 overflow-y-auto pt-3">
        {sections.map((section) => {
            const isSectionExpanded = !!expandedSections[section.id];
            return (
              <div key={section.id} className="mb-4">
                {/* Section Header - Now clickable */}
                <div
                    className="px-4 py-2 flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleSection(section.id)}
                >
                  <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider group-hover:text-neutral-500">
                    {section.title}
                  </div>
                  {/* Toggle icon based on section expansion state */}
                  {isSectionExpanded ? (
                      <Minus size={16} className="text-neutral-400 group-hover:text-neutral-600" />
                  ) : (
                      <Plus size={16} className="text-neutral-400 group-hover:text-neutral-600" />
                  )}
                </div>

                {/* Section Routes - Conditionally rendered */}
                {isSectionExpanded && (
                    <div className="mt-1 space-y-0.5">
                      {section.routes.map((route) => renderRouteItem(route, 0))}
                    </div>
                )}
              </div>
            );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-neutral-200 mt-auto">
        <Link href={'/notifications'} className="px-4 py-2.5 flex items-center text-neutral-600 hover:text-neutral-900 cursor-pointer hover:bg-gray-100 group">
          <Bell size={20} className="text-neutral-400 group-hover:text-neutral-600 mr-3" />
          <span className="text-sm">Notifications</span>
          <div className="ml-auto rounded-full bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs">
            5
          </div>
        </Link>
         <div className="px-4 py-2.5 flex items-center text-neutral-600 hover:text-neutral-900 cursor-pointer hover:bg-gray-100 group">
          <HelpCircle size={20} className="text-neutral-400 group-hover:text-neutral-600 mr-3" />
          <span className="text-sm">Support</span>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-4 py-3 border-t border-neutral-200 flex items-center">
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name}
            height={32}
            width={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-neutral-500 font-medium flex-shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>
        )}
        <div className="ml-2.5 overflow-hidden">
          <div className="text-sm font-medium text-neutral-800 truncate">{user.name}</div>
          <div className="text-xs text-neutral-500 truncate">{user.role}</div>
        </div>
        <LogOut size={18} onClick={async() => {
          await signOut();
          router.push('/check-in');
        }} className="ml-auto text-neutral-400 hover:text-neutral-600 cursor-pointer" />
      </div>
    </div>
  );
};

export default Sidebar;