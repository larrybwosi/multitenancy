'use client';
import { useState } from 'react';
import {
  Bell,
  Calendar,
  MessageSquare,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Info,
  LayoutDashboard,
  Settings,
  LogOut,
  CheckCircle,
  Mail,
  AlertCircle
} from 'lucide-react';

// --- Color Palette (Extracted from Tailwind config and common values) ---
const colors = {
  primary: {
    50: '#f0f5ff',
    100: '#e0eaff',
    200: '#c7d7ff',
    500: '#4f6bff',
    600: '#3a4cfa',
    700: '#3035e7',
    800: '#2a2cc0', // Added for hover state approximation
    900: '#282f99',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6', // Added for hover state approximation
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563', // Added for consistency
    700: '#374151',
    800: '#1f2937', // Added for hover state approximation
    900: '#11182c',
  },
  slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
  },
  indigo: {
      100: '#e0e7ff',
  },
  red: { 500: '#ef4444' },
  purple: { 500: '#8b5cf6' },
  green: { 500: '#22c55e' },
  amber: { 500: '#f59e0b' },
  teal: { 500: '#14b8a6' },
  white: '#ffffff',
};

// Helper for opacity - Not perfect replacement for Tailwind's / notation but works for inline styles
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};


// --- TypeScript Interfaces ---
interface NotificationType {
  id: number;
  type: 'invitation' | 'mention' | 'announcement' | 'reminder' | 'task_update' | string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
  invitedBy?: string;
  invitedByAvatar?: string;
  organization?: string;
  role?: string;
  mentionedBy?: string;
  mentionedByAvatar?: string;
  meetingTime?: string;
  assignedBy?: string;
  assignedByAvatar?: string;
}

interface AvatarProps {
  initials: string;
  bgColor?: string; // Expects hex color string
  textColor?: string; // Expects hex color string
}

interface NotificationIconProps {
  type: string;
}

interface NotificationItemProps {
  notification: NotificationType;
  expandedNotification: number | null;
  onToggleExpand: (id: number | null) => void;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onMarkAsRead: (id: number) => void;
}

// --- Mock Data (Enhanced) ---
const initialNotifications: NotificationType[] = [
    // ... (keep mock data as is) ...
     {
      id: 1,
      type: 'invitation',
      title: 'Organization Invitation',
      description: 'Alex Morgan has invited you to join Acme Corporation as a Developer.',
      time: '10 minutes ago',
      read: false,
      invitedBy: 'Alex Morgan',
      invitedByAvatar: 'AM',
      organization: 'Acme Corporation',
      role: 'Developer'
    },
    {
      id: 2,
      type: 'mention',
      title: 'Mention in Project Alpha',
      description: 'Sarah Chen mentioned you in the task "Finalize Q3 Budget".',
      time: '1 hour ago',
      read: false,
      mentionedBy: 'Sarah Chen',
      mentionedByAvatar: 'SC',
      link: '/projects/alpha/tasks/123'
    },
    {
      id: 3,
      type: 'announcement',
      title: 'New Feature: Dark Mode',
      description: 'We\'ve just launched Dark Mode! Enable it in your settings.',
      time: '2 days ago',
      read: true,
      link: '/settings/appearance'
    },
    {
      id: 4,
      type: 'reminder',
      title: 'Upcoming Meeting: Team Sync',
      description: 'Reminder: Your team sync meeting is scheduled for tomorrow at 10:00 AM.',
      time: '5 hours ago',
      read: true,
      meetingTime: 'Tomorrow, 10:00 AM PST',
      link: '/calendar/event/456'
    },
    {
      id: 5,
      type: 'invitation',
      title: 'Organization Invitation',
      description: 'Jessica Wilson has invited you to join TechStart Inc as a Designer.',
      time: '1 day ago',
      read: false,
      invitedBy: 'Jessica Wilson',
      invitedByAvatar: 'JW',
      organization: 'TechStart Inc',
      role: 'Designer'
    },
    {
      id: 6,
      type: 'task_update',
      title: 'Task Assigned: Review PR #58',
      description: 'You have been assigned to review Pull Request #58 in the "WebApp" repository.',
      time: '3 hours ago',
      read: false,
      assignedBy: 'Project Bot',
      assignedByAvatar: 'PB',
      link: '/repos/webapp/pr/58'
    }
];


// --- Helper Components ---

// Simple Avatar Simulation using inline styles for color
const Avatar = ({ initials, bgColor = colors.primary[100], textColor = colors.primary[600] }: AvatarProps) => (
  <div
    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold`}
    style={{ backgroundColor: bgColor, color: textColor }}
  >
    {initials}
  </div>
);

// Notification Icon Component using direct color prop
const NotificationIcon = ({ type }: NotificationIconProps) => {
  const baseClasses = "w-5 h-5";
  switch (type) {
    case 'invitation':
      return <UserPlus className={baseClasses} color={colors.primary[500]} />;
    case 'mention':
      return <MessageSquare className={baseClasses} color={colors.purple[500]} />;
    case 'announcement':
      return <Info className={baseClasses} color={colors.green[500]} />;
    case 'reminder':
      return <Calendar className={baseClasses} color={colors.amber[500]} />;
    case 'task_update':
      return <CheckCircle className={baseClasses} color={colors.teal[500]} />;
    default:
      return <Bell className={baseClasses} color={colors.gray[500]} />;
  }
};

// Sidebar Component - Using inline styles for colors, keeping hover classes for simplicity
const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '#', current: false },
    { name: 'Notifications', icon: Bell, href: '#', current: true },
    { name: 'Settings', icon: Settings, href: '#', current: false },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sidebarStyle = {
      background: `linear-gradient(to bottom, ${colors.gray[900]}, ${colors.primary[900]})`,
      color: colors.gray[100],
  };

  const headerBorderStyle = { borderColor: hexToRgba(colors.gray[700], 0.3) };
  const footerBorderStyle = { borderColor: hexToRgba(colors.gray[700], 0.3) };

  const currentNavItemStyle = {
      backgroundColor: hexToRgba(colors.primary[700], 0.7),
      color: colors.white,
  };
  const defaultNavItemStyle = { color: colors.gray[300] };
  // Note: hover:bg-gray-800/50 and hover:text-white classes are kept for simplicity.
  // Implementing hover purely with inline styles requires JS event handlers.

  const mobileBackdropStyle = { backgroundColor: hexToRgba(colors.gray[900], 0.7) };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md shadow-lg"
          style={{ backgroundColor: colors.primary[600], color: colors.white }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex w-64 h-screen flex-col shadow-lg fixed" style={sidebarStyle}>
        <div className="px-6 py-4 border-b" style={headerBorderStyle}>
          <h2 className="text-2xl font-semibold" style={{ color: colors.white }}>MyApp</h2>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out hover:bg-gray-800/50 hover:text-white ${item.current ? 'shadow-sm' : ''}`}
              style={item.current ? currentNavItemStyle : defaultNavItemStyle}
              aria-current={item.current ? 'page' : undefined}
            >
              <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
              {item.name}
            </a>
          ))}
        </nav>
        <div className="px-4 py-4 border-t" style={footerBorderStyle}>
            <a
              href="#"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800/50 hover:text-white transition-colors duration-150 ease-in-out"
              style={{ color: colors.gray[300] }}
            >
              <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
              Logout
            </a>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          {/* Backdrop */}
          <div
            className="fixed inset-0 backdrop-blur-sm"
            style={mobileBackdropStyle}
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Mobile Menu */}
          <div className="fixed inset-y-0 left-0 w-64 text-gray-100 shadow-lg overflow-y-auto" style={sidebarStyle}>
            <div className="px-6 py-4 border-b flex justify-between items-center" style={headerBorderStyle}>
              <h2 className="text-2xl font-semibold" style={{ color: colors.white }}>MyApp</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white"
                style={{ color: colors.gray[400] }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out hover:bg-gray-800/50 hover:text-white`}
                  style={item.current ? currentNavItemStyle : defaultNavItemStyle}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                  {item.name}
                </a>
              ))}
            </nav>
            <div className="px-4 py-4 border-t" style={footerBorderStyle}>
                <a
                  href="#"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800/50 hover:text-white transition-colors duration-150 ease-in-out"
                   style={{ color: colors.gray[300] }}
                >
                  <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
                  Logout
                </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Individual Notification Item Component
const NotificationItem = ({
  notification,
  expandedNotification,
  onToggleExpand,
  onAccept,
  onReject,
  onMarkAsRead
}: NotificationItemProps) => {
  const isExpanded = expandedNotification === notification.id;
  const avatarInitials = notification.invitedByAvatar || notification.mentionedByAvatar || notification.assignedByAvatar || notification.type.charAt(0).toUpperCase();

  const handleItemClick = () => {
      onToggleExpand(notification.id);
      if (!notification.read) {
        onMarkAsRead(notification.id);
      }
  };

  const itemBaseStyle = {
      borderColor: colors.gray[200],
      backgroundColor: notification.read ? colors.white : colors.primary[50]
  };

  const expandedContentStyle = {
      backgroundColor: colors.gray[50],
      borderColor: colors.gray[200],
  };

  const linkStyle = {
      color: colors.primary[600],
  };
  // Keeping hover classes for simplicity
  const linkHoverClass = 'hover:text-primary-800 hover:underline';

  const rejectButtonStyle = {
      borderColor: colors.gray[300],
      color: colors.gray[700],
      backgroundColor: colors.white,
  };
   // Keeping hover/focus classes
  const rejectButtonHoverFocusClass = 'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500';

  const acceptButtonStyle = {
      color: colors.white,
      backgroundColor: colors.primary[600],
  };
  // Keeping hover/focus classes
  const acceptButtonHoverFocusClass = 'hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500';

  return (
    <div
      className={`transition-all duration-200 ease-in-out border-b hover:bg-gray-50 ${ isExpanded ? 'shadow-md' : '' }`}
      style={itemBaseStyle}
    >
      <div
        className="px-4 sm:px-6 py-4 cursor-pointer flex justify-between items-center"
        onClick={handleItemClick}
        title={notification.read ? "Click to expand" : "Click to expand and mark as read"}
      >
        {/* Left side: Avatar, Title, Description, Time */}
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="flex-shrink-0 mt-1">
            {/* Avatar uses its own props/defaults for colors */}
            <Avatar initials={avatarInitials} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold flex items-center flex-wrap gap-2" style={{ color: colors.gray[800] }}>
              {notification.title}
              {!notification.read && (
                <span className="flex-shrink-0" title="Unread">
                    <Mail className="h-3 w-3" style={{ color: colors.primary[500] }}/>
                </span>
              )}
            </div>
            <p className="mt-1 text-sm line-clamp-2" style={{ color: colors.gray[600] }}>{notification.description}</p>
            <p className="mt-1 text-xs" style={{ color: colors.gray[500] }}>{notification.time}</p>
          </div>
        </div>

        {/* Right side: Expand Icon */}
        <div className="ml-3 sm:ml-4 flex-shrink-0 flex items-center">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" style={{ color: colors.gray[500] }}/>
          ) : (
            <ChevronDown className="h-5 w-5" style={{ color: colors.gray[400] }}/>
          )}
        </div>
      </div>

      {/* --- Expanded Content --- */}
      {isExpanded && (
        <div className={`px-4 sm:px-6 py-4 border-t transition-all duration-300 ease-out`} style={expandedContentStyle}>
          {/* Invitation Specific Details */}
          {notification.type === 'invitation' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm space-y-1" style={{ color: colors.gray[700] }}>
                <p><span className="font-medium">Invited by:</span> {notification.invitedBy}</p>
                <p><span className="font-medium">Organization:</span> {notification.organization}</p>
                <p><span className="font-medium">Proposed Role:</span> {notification.role}</p>
              </div>
              <div className="flex space-x-3 flex-shrink-0 mt-3 sm:mt-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onReject(notification.id); }}
                  className={`inline-flex items-center justify-center px-3 py-1.5 border shadow-sm text-sm font-medium rounded-md transition-colors ${rejectButtonHoverFocusClass}`}
                  style={rejectButtonStyle}
                  title="Decline Invitation"
                >
                  <X className="mr-1.5 h-4 w-4" style={{ color: colors.red[500] }}/>
                  Decline
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAccept(notification.id); }}
                  className={`inline-flex items-center justify-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md transition-colors ${acceptButtonHoverFocusClass}`}
                  style={acceptButtonStyle}
                   title="Accept Invitation"
               >
                  <Check className="mr-1.5 h-4 w-4" /> {/* Icon color inherits from button text color */}
                  Accept
                </button>
              </div>
            </div>
          )}

          {/* Other Notification Types Details */}
          {notification.type !== 'invitation' && (
             <div className="text-sm space-y-2" style={{ color: colors.gray[700] }}>
               {notification.mentionedBy && <p><span className="font-medium">Mentioned by:</span> {notification.mentionedBy}</p>}
               {notification.meetingTime && <p><span className="font-medium">Meeting Time:</span> {notification.meetingTime}</p>}
               {notification.assignedBy && notification.assignedBy !== 'Project Bot' && <p><span className="font-medium">Assigned by:</span> {notification.assignedBy}</p>}

               {notification.link && (
                 <a
                   href={notification.link}
                   target="_blank"
                   rel="noopener noreferrer"
                   className={`font-medium inline-flex items-center mt-2 ${linkHoverClass}`}
                   style={linkStyle}
                   onClick={(e) => e.stopPropagation()}
                 >
                   View Details
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                   </svg>
                 </a>
               )}
                {!notification.link && (
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleExpand(null); }}
                            className="text-sm hover:text-gray-700" // Keeping hover class
                             style={{ color: colors.gray[500] }}
                        >
                            Dismiss
                        </button>
                    </div>
                )}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

// Empty State Component
const EmptyState = ({ filterType, resetFilter }: { filterType: string, resetFilter: () => void }) => (
  <div className="py-16 text-center">
    <div className="flex justify-center mb-4">
      <AlertCircle className="h-16 w-16" style={{ color: colors.gray[300] }} />
    </div>
    <h3 className="mt-2 text-lg font-medium" style={{ color: colors.gray[900] }}>No Notifications</h3>
    <p className="mt-1 text-sm" style={{ color: colors.gray[500] }}>
      {filterType === 'all' ? "You're all caught up!" : `No ${filterType.replace('_', ' ')} notifications found.`}
    </p>
    {filterType !== 'all' && (
        <button
          onClick={resetFilter}
          className="mt-4 text-sm font-medium hover:text-primary-800" // Keeping hover class
          style={{ color: colors.primary[600] }}
        >
            View All Notifications
        </button>
    )}
  </div>
);

// --- Main Page Component ---
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>(initialNotifications);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'invitation', 'mention', etc.
  const [expandedNotification, setExpandedNotification] = useState<number | null>(null);

  const handleAccept = (id: number) => {
    console.log('Accepted invitation:', id);
    // Add actual API call logic here
    setNotifications(prev => prev.filter(n => n.id !== id));
    setExpandedNotification(null); // Close expanded view after action
  };

  const handleReject = (id: number) => {
    console.log('Rejected invitation:', id);
     // Add actual API call logic here
    setNotifications(prev => prev.filter(n => n.id !== id));
    setExpandedNotification(null); // Close expanded view after action
  };

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
    // Add API call to mark as read on backend if needed
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setExpandedNotification(null); // Collapse all when marking all as read
    // Add API call to mark all as read on backend if needed
  };

  const toggleExpand = (id: number | null) => {
    setExpandedNotification(prev => (prev === id ? null : id));
  };

  const resetFilter = () => setFilter('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const availableFilters = ['all', 'unread', ...Array.from(new Set(initialNotifications.map(n => n.type)))]; // Use initial to avoid filters disappearing

  const pageBackgroundStyle = {
      background: `linear-gradient(to bottom right, ${colors.slate[100]}, ${colors.primary[50]}, ${colors.indigo[100]})`,
  };
  const headerStyle = {
      backgroundColor: colors.white,
      borderColor: colors.gray[200],
  };
   const cardHeaderStyle = {
       backgroundColor: colors.slate[50],
       borderColor: colors.gray[200],
   };
   const cardStyle = {
       backgroundColor: colors.white,
       borderColor: colors.gray[200],
   };
   const cardFooterStyle = {
        backgroundColor: colors.slate[50],
        borderColor: colors.gray[200],
        color: colors.gray[500],
   };
   const activeFilterStyle = {
        backgroundColor: colors.primary[600],
        color: colors.white,
   };
   const inactiveFilterStyle = {
        backgroundColor: colors.gray[200],
        color: colors.gray[700],
   };
   const inactiveFilterHoverClass = 'hover:bg-gray-300';

   const markAllReadStyle = { color: colors.primary[600] };
   const markAllReadHoverClass = 'hover:text-primary-800'; // Keep hover class


  return (
    <div className="flex min-h-screen" style={pageBackgroundStyle}>
      <Sidebar /> {/* Sidebar handles its own colors */}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64"> {/* Add pl-64 for sidebar width on large screens */}
        {/* Content Header */}
         <header className="shadow-sm border-b sticky top-0 z-10" style={headerStyle}>
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-semibold flex items-center" style={{ color: colors.gray[800] }}>
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6 mr-2" style={{ color: colors.primary[600] }} />
                   Notifications
                   {unreadCount > 0 && (
                     <span
                        className="ml-2 sm:ml-3 text-xs font-bold px-2 py-1 rounded-full"
                        style={{ backgroundColor: colors.primary[100], color: colors.primary[700] }}
                    >
                       {unreadCount} New
                     </span>
                   )}
                </h1>
                {/* User profile menu placeholder */}
                <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary[200], color: colors.primary[600] }}>
                      <span className="font-semibold text-sm">JD</span>
                    </div>
                </div>
           </div>
         </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="w-full max-w-4xl mx-auto">
            {/* Notification Card */}
            <div className="rounded-xl shadow-lg overflow-hidden border" style={cardStyle}>
              {/* Card Header - Filters & Actions */}
              <div className="border-b px-3 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={cardHeaderStyle}>
                {/* Filter Tabs/Dropdown */}
                <div className="flex flex-wrap gap-2 text-sm">
                   {availableFilters.map((filterKey) => (
                     <button
                       key={filterKey}
                       onClick={() => setFilter(filterKey)}
                       className={`px-3 py-1 rounded-full capitalize transition-colors duration-150 ${filter === filterKey ? 'shadow-sm' : inactiveFilterHoverClass }`}
                       style={filter === filterKey ? activeFilterStyle : inactiveFilterStyle}
                     >
                       {filterKey.replace('_', ' ')}
                     </button>
                   ))}
                </div>

                 {/* Mark All Read Button */}
                 {unreadCount > 0 && (
                 <button
                   onClick={handleMarkAllAsRead}
                   className={`text-sm font-medium inline-flex items-center flex-shrink-0 ${markAllReadHoverClass}`}
                   style={markAllReadStyle}
                   title="Mark all notifications as read"
                 >
                   <CheckCircle className="w-4 h-4 mr-1.5" /> {/* Icon color inherits */}
                   Mark all as read
                 </button>
               )}
              </div>

              {/* Notifications List */}
              {/* The divide-y class works by adding borders between children */}
              <div className="divide-y" style={{ borderColor: colors.gray[200] }}>
                {filteredNotifications.length === 0 ? (
                  <EmptyState filterType={filter} resetFilter={resetFilter} />
                ) : (
                  filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      expandedNotification={expandedNotification}
                      onToggleExpand={toggleExpand}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))
                )}
              </div>

              {/* Footer */}
               <div className="px-4 sm:px-6 py-3 border-t text-sm text-right" style={cardFooterStyle}>
                    Showing {filteredNotifications.length} of {notifications.length} total notifications.
                </div>
            </div>
          </div>
        </main>
      </div> {/* End Main Content Area */}
    </div> // End Flex Container
  );
};


export default NotificationsPage;