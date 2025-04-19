'use client'; // Still needed for hooks

import { useState, useEffect, useCallback } from 'react';
import { 
  Bell, Calendar, MessageSquare, Check, X, ChevronDown, ChevronUp, UserPlus, 
  Info, LayoutDashboard, Settings, LogOut, CheckCircle, Mail, Loader2, AlertCircle 
} from 'lucide-react';

// Import types directly from Prisma Client
import { Notification, NotificationType, Prisma } from '@prisma/client'; 

// --- Placeholder for Authentication ---
// In a real app, get this from your auth context/session
const FAKE_CURRENT_USER_ID = "clvfsq4z5000010xl6x7uic5k"; // Replace with a real mechanism

// --- API Helper Functions (Simulated) ---
// Replace these with your actual API call implementations using fetch, axios, SWR, etc.

// Type for the API response for fetching notifications (could include pagination info)
interface FetchNotificationsResponse {
    notifications: Notification[];
    totalCount?: number; // Example extra info
}

async function apiFetchNotifications(userId: string, options: { filter: string, /* add pagination params if needed */ }): Promise<Notification[]> {
    // Construct query params based on options.filter
    const params = new URLSearchParams();
    params.append('userId', userId); // Backend should verify this matches logged-in user
    if (options.filter !== 'all') {
        if (options.filter === 'unread') {
            params.append('read', 'false');
        } else {
             // Assuming filter value matches NotificationType enum names (case-insensitive backend check might be good)
            params.append('type', options.filter.toUpperCase() as NotificationType);
        }
    }
    // Add pagination params like 'take', 'skip' if implementing
    // params.append('take', '20');

    console.log(`Workspaceing notifications with params: ${params.toString()}`);
    const response = await fetch(`/api/notifications?${params.toString()}`); 
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch notifications' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data: Notification[] = await response.json(); // Assuming API returns array directly for simplicity
    // Prisma Date fields will be serialized as strings, convert them back
    return data.map(n => ({
        ...n,
        createdAt: new Date(n.createdAt),
    }));
}

async function apiMarkNotificationRead(notificationId: string, userId: string): Promise<Notification> {
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Body might not be needed if userId is validated server-side via auth
        body: JSON.stringify({ userId }) 
    });
     if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to mark as read' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const updatedNotification: Notification = await response.json();
     // Convert dates
     return {
        ...updatedNotification,
        createdAt: new Date(updatedNotification.createdAt),
    };
}

async function apiMarkAllNotificationsRead(userId: string): Promise<{ count: number }> {
    console.log(`Marking all notifications as read for user ${userId}`);
     const response = await fetch(`/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }) // Backend validates this user
    });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to mark all as read' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json(); // Should return { count: number }
}

async function apiDeleteNotification(notificationId: string, userId: string): Promise<{ success: boolean }> {
    console.log(`Deleting notification ${notificationId} for user ${userId}`);
     const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
         // Body might not be needed if userId is validated server-side via auth
        body: JSON.stringify({ userId })
    });
    if (!response.ok) {
        // Handle 404 (Not Found) or 403 (Forbidden) specifically if needed
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete notification' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
     // Check for 204 No Content or 200 OK with body
     if (response.status === 204) {
         return { success: true };
     }
    return await response.json(); // Assuming API returns { success: boolean } on 200 OK
}


// --- Helper Components (Keep Avatar, NotificationIcon, Sidebar as before) ---

const Avatar = ({ initials, bgColor = 'bg-indigo-100', textColor = 'text-indigo-600' }: { initials: string, bgColor?: string, textColor?: string }) => (
  <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center font-semibold ${textColor} flex-shrink-0`}>
    {initials}
  </div>
);

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  const baseClasses = "w-5 h-5";
  switch (type) {
    case NotificationType.INVITATION:
      return <UserPlus className={`${baseClasses} text-blue-500`} />;
    case NotificationType.MENTION:
      return <MessageSquare className={`${baseClasses} text-purple-500`} />;
    case NotificationType.ANNOUNCEMENT:
      return <Info className={`${baseClasses} text-green-500`} />;
    case NotificationType.REMINDER:
      return <Calendar className={`${baseClasses} text-orange-500`} />;
    case NotificationType.TASK_UPDATE:
      return <CheckCircle className={`${baseClasses} text-teal-500`} />;  
    case NotificationType.SYSTEM_ALERT:
        return <AlertCircle className={`${baseClasses} text-red-500`} />;
    default:
      // Handle potential unknown types gracefully
      const exhaustiveCheck: never = type; 
      return <Bell className={`${baseClasses} text-gray-500`} />;
  }
};

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '#', current: false },
    { name: 'Notifications', icon: Bell, href: '#', current: true },
    { name: 'Settings', icon: Settings, href: '#', current: false },
  ];

  return (
    <div className="w-64 h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-gray-100 flex flex-col shadow-lg fixed">
      <div className="px-6 py-4 border-b border-gray-700">
        <h2 className="text-2xl font-semibold text-white">MyApp</h2>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out ${
              item.current
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            aria-current={item.current ? 'page' : undefined}
          >
            <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
            {item.name}
          </a>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-700">
         <a
            href="#"
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 ease-in-out"
          >
            <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
            Logout
          </a>
      </div>
    </div>
  );
};

// --- Notification Item Component (Updated Props and Metadata Handling) ---
interface NotificationItemProps {
    notification: Notification;
    expandedNotification: string | null;
    currentUserId: string; // Needed for actions
    onToggleExpand: (id: string) => void;
    onMarkAsRead: (id: string) => Promise<void>; // Now async
    onDelete: (id: string) => Promise<void>; // Now async
}

const NotificationItem = ({ 
    notification, 
    expandedNotification, 
    currentUserId, // Pass down user ID
    onToggleExpand, 
    onMarkAsRead, 
    onDelete 
}: NotificationItemProps) => {
  const isExpanded = expandedNotification === notification.id;
  
  // Safely access metadata - it's Prisma.JsonValue | null
  const metadata = notification.metadata as Prisma.JsonObject | null;
  const invitedBy = metadata?.invitedBy as string | undefined;
  const organization = metadata?.organization as string | undefined;
  const role = metadata?.role as string | undefined;
  const mentionedBy = metadata?.mentionedById as string | undefined; // Example access

  // Determine avatar initials (more robustly)
   const getInitials = (name?: string | null): string => {
       if (!name) return notification.type.charAt(0).toUpperCase();
       const parts = name.split(' ').filter(Boolean);
       if (parts.length === 0) return notification.type.charAt(0).toUpperCase();
       if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
       return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
   };
   // Choose source for initials based on type or metadata content
   let avatarSource = invitedBy || mentionedBy || "??"; // Add more sources if needed
   const avatarInitials = getInitials(avatarSource !== "??" ? avatarSource : notification.title);


  const handleItemClick = async () => {
      onToggleExpand(notification.id);
      if (!notification.read) {
        try {
            await onMarkAsRead(notification.id); // Call async handler
        } catch (error) {
            console.error("Failed to mark notification as read on click:", error);
            // Optionally show a toast notification to the user
        }
      }
  };

  // --- Action Handlers ---
  const handleAccept = async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent click bubbling to handleItemClick
      console.log("Accepting (will delete):", notification.id);
       try {
           // In a real app, this might call a specific 'accept' API endpoint first
           // For now, we just delete the notification
           await onDelete(notification.id);
       } catch(error) {
           console.error("Failed to accept/delete notification:", error);
           // Show error to user
       }
  };

  const handleReject = async (e: React.MouseEvent) => {
       e.stopPropagation();
       console.log("Rejecting (will delete):", notification.id);
        try {
            // Similar to accept, might call a 'reject' endpoint first
            await onDelete(notification.id);
        } catch(error) {
            console.error("Failed to reject/delete notification:", error);
            // Show error to user
        }
  };

  // Format Date Times (Example using Intl)
  const formatTimeAgo = (date: Date | null | undefined): string => {
      if (!date) return '';
      // Use a library like date-fns or moment for better relative time formatting
      const now = new Date();
      const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
      const minutes = Math.round(seconds / 60);
      const hours = Math.round(minutes / 60);
      const days = Math.round(hours / 24);

      if (seconds < 60) return `${seconds} seconds ago`;
      if (minutes < 60) return `${minutes} minutes ago`;
      if (hours < 24) return `${hours} hours ago`;
      return `${days} days ago`;
  };

  return (
    <div 
      className={`transition-all duration-200 ease-in-out border-b border-gray-200 ${notification.read ? 'bg-white' : 'bg-indigo-50'} ${isExpanded ? 'shadow-md' : ''} hover:bg-gray-50`}
    >
      <div 
        className="px-6 py-4 cursor-pointer flex justify-between items-start sm:items-center" // Align items start on small screens
        onClick={handleItemClick}
        title={notification.read ? "Click to expand" : "Click to expand and mark as read"}
      >
        {/* Left side: Avatar, Title, Description, Time */}
        <div className="flex items-start space-x-4 flex-1 min-w-0"> {/* Flex-1 and min-w-0 for text wrapping */}
          <Avatar initials={avatarInitials} />
          <div className="flex-1 min-w-0"> {/* Flex-1 and min-w-0 */}
            <div className="text-sm font-semibold text-gray-800 flex items-center flex-wrap"> {/* Flex wrap for title */}
              <span className="mr-1">{notification.title}</span>
              {!notification.read && (
                <span className="ml-1 flex-shrink-0" title="Unread">
                    <Mail className="h-3 w-3 text-indigo-500" />
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{notification.body}</p> 
            <p className="mt-1 text-xs text-gray-500" title={notification.createdAt.toLocaleString()}>
                {formatTimeAgo(notification.createdAt)}
            </p>
          </div>
        </div>
        
        {/* Right side: Expand Icon */}
        <div className="ml-4 flex-shrink-0 flex items-center pt-1 sm:pt-0"> {/* Adjust padding top */}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* --- Expanded Content --- */}
      {isExpanded && (
        <div className={`bg-gray-100 px-6 py-4 border-t border-gray-200 transition-all duration-300 ease-out`}>
          {/* Invitation Specific Details */}
          {notification.type === NotificationType.INVITATION && metadata && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-700 space-y-1">
                {invitedBy && <p><span className="font-medium">Invited by:</span> {invitedBy}</p>}
                {organization && <p><span className="font-medium">Organization:</span> {organization}</p>}
                {role && <p><span className="font-medium">Proposed Role:</span> {role}</p>}
              </div>
              <div className="flex space-x-3 flex-shrink-0">
                <button 
                  onClick={handleReject} // Use updated handler
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                   title="Decline Invitation"
               >
                  <X className="mr-1.5 h-4 w-4 text-red-500" />
                  Decline
                </button>
                <button 
                  onClick={handleAccept} // Use updated handler
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                   title="Accept Invitation"
               >
                  <Check className="mr-1.5 h-4 w-4" />
                  Accept
                </button>
              </div>
            </div>
          )}
          
          {/* Other Notification Types Details */}
          {notification.type !== NotificationType.INVITATION && (
             <div className="text-sm text-gray-700 space-y-2">
               {/* Display formatted full body or specific metadata */}
               <p className="whitespace-pre-wrap">{notification.body}</p> 
               
               {/* Example: Displaying specific metadata */}
               {notification.type === NotificationType.MENTION && mentionedBy && (
                   <p><span className="font-medium">Mentioned by:</span> {mentionedBy}</p>
               )}
               {/* Add more metadata displays based on type */}

               {notification.link && (
                  <a 
                    href={notification.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium inline-flex items-center" 
                    onClick={(e) => e.stopPropagation()} // Prevent closing expand on link click
                 >
                      View Details 
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                  </a>
               )}

               {/* Add a direct delete button for non-actionable notifications */}
                {!notification.link && notification.type !== NotificationType.INVITATION && (
                     <div className="flex justify-end pt-2">
                        <button 
                            onClick={async (e) => { e.stopPropagation(); await onDelete(notification.id); }}
                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                            title="Delete this notification"
                        >
                            Delete
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


// --- Main Page Component (Updated State and Effects) ---
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'unread', 'INVITATION', 'MENTION', etc.
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false); // For mark all/delete operations

  // Use the fake User ID
  const currentUserId = FAKE_CURRENT_USER_ID; 

  // --- Data Fetching Effect ---
  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) {
        setError("User not identified. Cannot fetch notifications.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedNotifications = await apiFetchNotifications(currentUserId, { filter });
      setNotifications(fetchedNotifications);
    } catch (err: any) {
      console.error("Failed to fetch notifications:", err);
      setError(err.message || 'Could not load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, filter]); // Refetch when userId or filter changes

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]); // Use the memoized callback

  // --- Action Handlers (now async and update state optimistically/realistically) ---

  const handleMarkAsRead = useCallback(async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true, readAt: new Date() } : n
    ));
    try {
        await apiMarkNotificationRead(id, currentUserId);
        // Optional: Refetch or update with actual data from API if needed
    } catch (err) {
        console.error(`Failed to mark notification ${id} as read:`, err);
        setError(`Failed to update notification ${id}. Please try again.`);
        // Revert optimistic update on error
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, read: false, readAt: null } : n // Crude revert, find original state might be better
        ));
    }
  }, [currentUserId]);

  const handleMarkAllAsRead = useCallback(async () => {
    setIsUpdating(true);
    setError(null);
     // Optimistic update
     const originalNotifications = notifications;
     setNotifications(prev => prev.map(n => n.read ? n : { ...n, read: true, readAt: new Date() }));
    try {
        const result = await apiMarkAllNotificationsRead(currentUserId);
        console.log(`Marked ${result.count} notifications as read via API.`);
         // Optional: Refetch for consistency, though optimistic might be enough
         // await fetchNotifications(); 
        setExpandedNotification(null); // Collapse all
    } catch (err: any) {
        console.error("Failed to mark all notifications as read:", err);
        setError(err.message || 'Could not mark all as read.');
         // Revert optimistic update
         setNotifications(originalNotifications);
    } finally {
        setIsUpdating(false);
    }
  }, [currentUserId, notifications]); // Include notifications if using it for revert

  const handleDelete = useCallback(async (id: string) => {
    // Optimistic UI update
    const originalNotifications = notifications;
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (expandedNotification === id) {
        setExpandedNotification(null); // Close if expanded
    }
    try {
        await apiDeleteNotification(id, currentUserId);
        console.log(`Deleted notification ${id} via API.`);
    } catch (err: any) {
        console.error(`Failed to delete notification ${id}:`, err);
        setError(err.message || `Could not delete notification ${id}.`);
         // Revert optimistic update
         setNotifications(originalNotifications);
    }
  }, [currentUserId, notifications, expandedNotification]); // Include dependencies


  const toggleExpand = (id: string | null) => {
    setExpandedNotification(prev => (prev === id ? null : id));
  };

  // Calculate unread count from current state
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Dynamically get available types from fetched data, plus 'all' and 'unread'
  const availableTypes = [...new Set(notifications.map(n => n.type))];
  const availableFilters = ['all', 'unread', ...availableTypes]; 

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-100 overflow-hidden">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden pl-64"> {/* Add pl-64 for sidebar width */}
        {/* Content Header */}
         <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                 <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <Bell className="h-6 w-6 mr-2 text-indigo-600" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-3 bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                        {unreadCount} New
                      </span>
                    )}
                </h1>
                 {/* Placeholder for maybe user profile/actions */}
                 <div> 
                    {/* Add user menu or other header items here */}
                 </div>
            </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-4xl mx-auto">
           
            {/* --- Loading State --- */}
             {isLoading && (
                <div className="py-16 text-center flex flex-col items-center justify-center text-gray-500">
                   <Loader2 className="h-12 w-12 animate-spin mb-4 text-indigo-500" />
                   <p>Loading Notifications...</p>
                </div>
             )}

            {/* --- Error State --- */}
            {error && !isLoading && (
                 <div className="py-16 text-center bg-red-50 border border-red-200 rounded-lg p-6">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-red-800">Oops! Something went wrong.</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                     <button 
                        onClick={fetchNotifications} 
                        className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                     >
                         Try Again
                    </button>
                 </div>
            )}
             
             {/* --- Content Display (only when not loading and no error) --- */}
             {!isLoading && !error && (
                 <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    {/* Card Header - Filters & Actions */}
                    <div className="border-b border-gray-200 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50">
                        {/* Filter Tabs/Dropdown */}
                        <div className="flex flex-wrap gap-2 text-sm">
                        {availableFilters.map(filterKey => (
                            <button 
                            key={filterKey}
                            onClick={() => setFilter(filterKey)}
                            className={`px-3 py-1 rounded-full capitalize transition-colors duration-150 ${filter === filterKey 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                            {filterKey.replace('_', ' ').toLowerCase()} {/* Display formatting */}
                            </button>
                        ))}
                        </div>

                        {/* Mark All Read Button */}
                        {unreadCount > 0 && (
                        <button 
                            onClick={handleMarkAllAsRead}
                            disabled={isUpdating}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mark all notifications as read"
                        >
                            {isUpdating ? (
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            ) : (
                                <CheckCircle className="w-4 h-4 mr-1.5" />
                            )}
                            {isUpdating ? 'Processing...' : 'Mark all as read'}
                        </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="divide-y divide-gray-200">
                        {notifications.length === 0 ? ( // Check filtered length after potential filtering logic added
                        <div className="py-16 text-center">
                            <div className="flex justify-center mb-4">
                                <Bell className="h-16 w-16 text-gray-300" />
                            </div>
                            <h3 className="mt-2 text-lg font-medium text-gray-900">No Notifications Found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {filter === 'all' ? "You're all caught up!" : `No matching ${filter.replace('_', ' ').toLowerCase()} notifications.`}
                            </p>
                            {filter !== 'all' && (
                                <button onClick={() => setFilter('all')} className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                    View All Notifications
                                </button>
                            )}
                        </div>
                        ) : (
                        notifications.map((notification) => ( // Render directly from state
                            <NotificationItem 
                                key={notification.id}
                                notification={notification}
                                expandedNotification={expandedNotification}
                                currentUserId={currentUserId}
                                onToggleExpand={toggleExpand}
                                onMarkAsRead={handleMarkAsRead}
                                onDelete={handleDelete} 
                            />
                        ))
                        )}
                    </div>

                    {/* Footer (Optional: could show pagination or summary) */}
                    {notifications.length > 0 && (
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-sm text-gray-500 text-right">
                           {/* If you implement totalCount from API, show it here */}
                            Displaying {notifications.length} notifications. 
                        </div> 
                    )}
                </div>
             )} 
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;