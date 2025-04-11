import { useState, useEffect, cloneElement } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Bell,
  LifeBuoy,
  LogOut,
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
  logoSrc = "F",
  notificationCount = 1,
  supportPath = "/support",
  notificationsPath = "/notifications",
  logoText = "Clevery",
  isCollapsed,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || "Rodney Dean";
  const userRole = session?.user?.role || "Super Admin";

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
  }>({});

  // Automatically expand groups with active routes
  useEffect(() => {
    const updatedExpandedGroups: { [key: string]: boolean } = {};

    routeGroups.forEach((group) => {
      // Check if this group contains the active route
      const isActiveGroup = group.routes.some((route) =>
        isRouteActive(route, pathname, true)
      );

      // If the group has an active route, expand it
      if (isActiveGroup) {
        updatedExpandedGroups[group.id] = true;
      }
    });

    setExpandedGroups((prev) => ({
      ...prev,
      ...updatedExpandedGroups,
    }));
  }, [pathname, routeGroups]);

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
    const isActive = isRouteActive(route, pathname, false);
    const isChildActive =
      hasChildren &&
      route.children?.some((child) => isRouteActive(child, pathname, true));
    const isExpandable =
      hasChildren && route.children && route.children.length > 0;

    // Determine active state styling
    const activeStyle = isActive
      ? "text-green-700 bg-green-50 font-medium"
      : isChildActive
        ? "text-gray-900"
        : "text-gray-700 hover:bg-gray-50";

    const itemContent = (
      <>
        {route.icon &&
          cloneElement(route.icon as React.ReactElement, {
            className: cn(
              "h-5 w-5",
              !isCollapsed && "mr-3",
              isCollapsed && "mx-auto"
            ),
          })}
        {!isCollapsed && <span className="text-sm">{route.title}</span>}
        {!isCollapsed && isExpandable && (
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
      "flex items-center rounded-lg relative",
      isCollapsed ? "justify-center p-2" : "px-3 py-2",
      level > 0 && !isCollapsed ? "ml-8" : "",
      activeStyle
    );

    const linkContent = (
      <div
        className={itemClasses}
        onClick={() => isExpandable && toggleGroup(route.id)}
      >
        {/* Active indicator line */}
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600 rounded-r-md"></div>
        )}
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

    return (
      <div key={route.id} className="my-1">
        <MaybeTooltip>
          {hasChildren ? (
            <div>{linkContent}</div>
          ) : (
            <Link href={route.path} className="block">
              {linkContent}
            </Link>
          )}
        </MaybeTooltip>

        {!isCollapsed && hasChildren && expandedGroups[route.id] && (
          <div className="mt-1 ml-2">
            {route.children?.map((child) => renderRouteItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render a group section
  const renderGroup = (group: RouteGroup) => {
    const isActiveGroup = group.routes.some((route) =>
      isRouteActive(route, pathname, true)
    );

    return (
      <div key={group.id} className="mb-4">
        {!isCollapsed && (
          <div
            className="flex items-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer"
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

        {isCollapsed && (
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase text-center">
            {group.title.slice(0, 1)}
          </div>
        )}

        {(isCollapsed || expandedGroups[group.id]) && (
          <div className="space-y-1">
            {group.routes.map((route) => renderRouteItem(route))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-white border-r border-gray-100 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "p-3 flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        {!isCollapsed ? (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-green-500 text-white font-bold text-sm">
              {logoSrc}
            </div>
            <span className="font-semibold text-gray-800">{logoText}</span>
          </Link>
        ) : (
          <div className="w-6 h-6 rounded flex items-center justify-center bg-green-500 text-white font-bold text-sm">
            {logoSrc}
          </div>
        )}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-700 h-6 w-6"
          >
            <ChevronLeft size={16} />
          </Button>
        )}
      </div>

      {!isCollapsed && (
        <div className="px-3 py-2 border-y border-gray-100 flex gap-2 items-center">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium text-xs">
            {hotelName.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-sm">{hotelName}</div>
            <div className="text-xs text-gray-500">{hotelCategory}</div>
          </div>
          <ChevronDown size={14} className="ml-auto text-gray-500" />
        </div>
      )}

      <ScrollArea className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <div className="px-2">{routeGroups.map(renderGroup)}</div>
      </ScrollArea>

      <div className="mt-auto border-t border-gray-100">
        <div className="p-2">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={notificationsPath}
                  className={cn(
                    "flex items-center text-sm text-gray-700 cursor-pointer rounded-lg hover:bg-gray-50 relative",
                    isCollapsed ? "justify-center p-2" : "px-3 py-2"
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
                          ? "w-4 h-4 -top-1 -right-1"
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={supportPath}
                  className={cn(
                    "flex items-center text-sm text-gray-700 cursor-pointer rounded-lg hover:bg-gray-50",
                    isCollapsed ? "justify-center p-2 mt-1" : "px-3 py-2 mt-1"
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
          </TooltipProvider>
        </div>

        <div
          className={cn(
            "p-3 border-t border-gray-100 flex items-center",
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
                    "w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium text-xs",
                    isCollapsed ? "" : "mr-2"
                  )}
                >
                  {userName
                    .split(" ")
                    .map((name) => name[0])
                    .join("")}
                </div>
                {!isCollapsed && (
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium">{userName}</div>
                    <div className="text-xs text-gray-500">{userRole}</div>
                  </div>
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
      </div>
    </div>
  );
};

export default Sidebar;
