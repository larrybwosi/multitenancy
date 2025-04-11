import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Bell,
  LifeBuoy,
  LogOut,
  MoreVertical,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth/authClient";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";

// Define interface for route items
interface RouteItem {
  id: string;
  title: string;
  path: string;
  icon: React.ReactNode;
  children?: RouteItem[];
}

// Define interface for route groups
interface RouteGroup {
  id: string;
  title: string;
  routes: RouteItem[];
}

// Props interface for Sidebar component
interface SidebarProps {
  hotelName?: string;
  hotelCategory?: string;
  userName?: string;
  userRole?: string;
  routeGroups: RouteGroup[];
  activePath?: string;
  onRouteChange?: (path: string) => void;
  logoSrc?: string;
  notificationCount?: number;
  supportPath?: string;
  notificationsPath?: string;
  logoText?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  hotelName = "Grand Sylhet Hotel",
  hotelCategory = "5 stars luxury",
  routeGroups,
  logoSrc = "C",
  notificationCount = 1,
  supportPath = "/support",
  notificationsPath = "/notifications",
  logoText = "Clevery",
  isCollapsed,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || "John Doe";
  const userRole = session?.user?.role || "Admin";

  // Check if a route or any of its children are active
  const isRouteActive = (
    route: RouteItem,
    currentPath: string,
    checkChildren: boolean = true
  ): boolean => {
    if (currentPath === route.path) return true;
    if (checkChildren && route.children) {
      return route.children.some((child) =>
        isRouteActive(child, currentPath, true)
      );
    }
    return false;
  };

  // State to keep track of expanded route groups
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean;
  }>(() => {
    const initialState: { [key: string]: boolean } = {};
    let isFirstGroupExpanded = false;
    routeGroups.forEach((group) => {
      // Expand group if it contains the active path initially
      const isActiveGroup = group.routes.some((route) =>
        isRouteActive(route, pathname, true)
      );
      initialState[group.id] = isActiveGroup;
      if (isActiveGroup) isFirstGroupExpanded = true;
    });
    // If no group contains the active path, expand the first group
    if (!isFirstGroupExpanded && routeGroups.length > 0) {
      initialState[routeGroups[0].id] = true;
    }
    return initialState;
  });

  // Function to toggle group expansion
  const toggleGroup = (groupId: string) => {
    if (!isCollapsed) {
      setExpandedGroups((prev) => ({
        ...prev,
        [groupId]: !prev[groupId],
      }));
    }
  };

  // Render a single route item
  const renderRouteItem = (route: RouteItem, level = 0) => {
    const hasChildren = route.children && route.children.length > 0;
    const isActive = isRouteActive(route, pathname, true);
    const isDirectlyActive = pathname === route.path;

    const itemContent = (
      <>
        {route.icon &&
          React.cloneElement(route.icon as React.ReactElement, {
            className: cn(
              "h-4 w-4",
              !isCollapsed && "mr-2",
              isCollapsed && "mx-auto"
            ),
          })}
        {!isCollapsed && <span>{route.title}</span>}
        {!isCollapsed && hasChildren && (
          <ChevronDown
            size={16}
            className={cn(
              "ml-auto text-gray-400 transition-transform duration-200",
              expandedGroups[route.id] ? "rotate-180" : ""
            )}
          />
        )}
      </>
    );

    const itemClasses = cn(
      "flex items-center text-sm cursor-pointer rounded-md",
      isCollapsed ? "justify-center p-2" : "px-4 py-2",
      level > 0 && !isCollapsed ? "ml-4" : "",
      isActive
        ? "text-green-600 bg-green-50"
        : "text-gray-700 hover:bg-gray-100",
      isDirectlyActive && !hasChildren && !isCollapsed && "font-medium"
    );

    const linkContent = (
      <div
        className={itemClasses}
        onClick={() => hasChildren && toggleGroup(route.id)}
      >
        {itemContent}
      </div>
    );

    // Wrap with Tooltip when collapsed
    const MaybeTooltip = ({ children }: { children: React.ReactNode }) =>
      isCollapsed ? (
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{route.title}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <>{children}</>
      );

    const renderLink = (path: string, content: React.ReactNode) => (
      <Link href={path} className="block relative">
        {content}
        {isDirectlyActive && !hasChildren && (
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 bg-green-500",
              isCollapsed ? "w-1" : "w-1"
            )}
          ></div>
        )}
      </Link>
    );

    return (
      <div key={route.id}>
        <MaybeTooltip>
          {hasChildren ? linkContent : renderLink(route.path, linkContent)}
        </MaybeTooltip>

        {!isCollapsed && hasChildren && expandedGroups[route.id] && (
          <div className="mt-1">
            {route.children?.map((child) => renderRouteItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render a group section (only when not collapsed)
  const renderGroup = (group: RouteGroup) => (
    <div key={group.id} className="py-2">
      {!isCollapsed && (
        <div
          className="flex items-center px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer"
          onClick={() => toggleGroup(group.id)}
        >
          <div className="flex-1">{group.title}</div>
          {expandedGroups[group.id] ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </div>
      )}

      {isCollapsed && <hr className="my-2 border-gray-200 mx-2" />}

      {(isCollapsed || expandedGroups[group.id]) && (
        <div className={cn(!isCollapsed && "mt-1")}>
          {group.routes.map((route) => renderRouteItem(route))}
        </div>
      )}
    </div>
  );

  return (
    <ScrollArea
      className={cn(
        "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      <div
        className={cn(
          "p-4 flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-green-600 text-white font-bold">
              {logoSrc}
            </div>
            <span className="font-bold text-gray-800">{logoText}</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft
            size={18}
            className={cn(
              "transition-transform",
              isCollapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {!isCollapsed && (
        <div className="p-4 border-y border-gray-100 flex gap-3 items-center">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
            {hotelName.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-sm">{hotelName}</div>
            <div className="text-xs text-gray-500">{hotelCategory}</div>
          </div>
          <ChevronDown size={16} className="ml-auto text-gray-500" />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
        {routeGroups.map(renderGroup)}
      </nav>

      <div
        className={cn(
          "border-t border-gray-200",
          isCollapsed ? "px-2 py-4" : "p-4"
        )}
      >
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={supportPath}
                className={cn(
                  "flex items-center text-sm text-gray-700 cursor-pointer rounded-lg hover:bg-gray-100",
                  isCollapsed ? "justify-center p-2" : "px-2 py-2"
                )}
              >
                <LifeBuoy
                  size={18}
                  className={cn("text-gray-500", !isCollapsed && "mr-3")}
                />
                {!isCollapsed && <span>Support</span>}
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Support</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={notificationsPath}
                className={cn(
                  "flex items-center text-sm text-gray-700 cursor-pointer rounded-lg hover:bg-gray-100 relative",
                  isCollapsed ? "justify-center p-2" : "px-2 py-2 mt-1"
                )}
              >
                <Bell
                  size={18}
                  className={cn("text-gray-500", !isCollapsed && "mr-3")}
                />
                {!isCollapsed && <span>Notifications</span>}
                {notificationCount > 0 && (
                  <div
                    className={cn(
                      "bg-red-500 text-white rounded-full flex items-center justify-center text-xs absolute",
                      isCollapsed
                        ? "w-4 h-4 top-0 right-0"
                        : "w-5 h-5 ml-auto"
                    )}
                  >
                    {notificationCount}
                  </div>
                )}
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <p>Notifications</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <div
        className={cn(
          "p-4 border-t border-gray-200 flex items-center",
          isCollapsed && "justify-center"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center w-full",
                isCollapsed ? "justify-center p-0 h-8 w-8 rounded-full" : ""
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold",
                  isCollapsed ? "" : "mr-3"
                )}
              >
                {userName.charAt(0)}
              </div>
              {!isCollapsed && (
                <div className="text-left flex-1">
                  <div className="text-sm font-medium">{userName}</div>
                  <div className="text-xs text-gray-500">{userRole}</div>
                </div>
              )}
              {!isCollapsed && (
                <MoreVertical size={18} className="ml-2 text-gray-500" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isCollapsed ? "right" : "top"}
            align="start"
          >
            <DropdownMenuLabel>{userName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </ScrollArea>
  );
};

export default Sidebar;
