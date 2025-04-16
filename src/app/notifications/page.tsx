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
  Mail  
} from 'lucide-react';

// --- Mock Data (Enhanced) ---
const initialNotifications = [
  {
    id: 1,
    type: 'invitation',
    title: 'Organization Invitation',
    description: 'Alex Morgan has invited you to join Acme Corporation as a Developer.',
    time: '10 minutes ago',
    read: false,
    invitedBy: 'Alex Morgan',
    invitedByAvatar: 'AM', // Initials for avatar
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
    link: '/projects/alpha/tasks/123' // Example link
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
    type: 'task_update', // New type example
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

// Simple Avatar Simulation
const Avatar = ({ initials, bgColor = 'bg-indigo-100', textColor = 'text-indigo-600' }: { initials: string, bgColor?: string, textColor?: string }) => (
  <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center font-semibold ${textColor}`}>
    {initials}
  </div>
);

// Notification Icon Component (Slightly updated styling)
const NotificationIcon = ({ type }: { type: string }) => {
  const baseClasses = "w-5 h-5";
  switch (type) {
    case 'invitation':
      return <UserPlus className={`${baseClasses} text-blue-500`} />;
    case 'mention':
      return <MessageSquare className={`${baseClasses} text-purple-500`} />;
    case 'announcement':
      return <Info className={`${baseClasses} text-green-500`} />;
    case 'reminder':
      return <Calendar className={`${baseClasses} text-orange-500`} />;
    case 'task_update':
      return <CheckCircle className={`${baseClasses} text-teal-500`} />;  
    default:
      return <Bell className={`${baseClasses} text-gray-500`} />;
  }
};

// Sidebar Component
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

// Individual Notification Item Component
const NotificationItem = ({ notification, expandedNotification, onToggleExpand, onAccept, onReject, onMarkAsRead }) => {
  const isExpanded = expandedNotification === notification.id;
  const avatarInitials = notification.invitedByAvatar || notification.mentionedByAvatar || notification.assignedByAvatar || notification.type.charAt(0).toUpperCase();

  const handleItemClick = () => {
      onToggleExpand(notification.id);
      if (!notification.read) {
        onMarkAsRead(notification.id);
      }
  };

  return (
    <div 
      className={`transition-all duration-200 ease-in-out border-b border-gray-200 ${notification.read ? 'bg-white' : 'bg-indigo-50'} ${isExpanded ? 'shadow-md' : ''} hover:bg-gray-50`}
    >
      <div 
        className="px-6 py-4 cursor-pointer flex justify-between items-center"
        onClick={handleItemClick}
        title={notification.read ? "Click to expand" : "Click to expand and mark as read"}
      >
        {/* Left side: Avatar, Title, Description, Time */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 mt-1">
            <Avatar initials={avatarInitials} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800 flex items-center">
              {notification.title}
              {!notification.read && (
                <span className="ml-2 flex-shrink-0" title="Unread">
                    <Mail className="h-3 w-3 text-indigo-500" />
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{notification.description}</p> 
            <p className="mt-1 text-xs text-gray-500">{notification.time}</p>
          </div>
        </div>
        
        {/* Right side: Expand Icon */}
        <div className="ml-4 flex-shrink-0 flex items-center">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* --- Expanded Content --- */}
      {isExpanded && (
        <div className={`bg-gray-50 px-6 py-4 border-t border-gray-200 transition-all duration-300 ease-out`}>
          {/* Invitation Specific Details */}
          {notification.type === 'invitation' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-medium">Invited by:</span> {notification.invitedBy}</p>
                <p><span className="font-medium">Organization:</span> {notification.organization}</p>
                <p><span className="font-medium">Proposed Role:</span> {notification.role}</p>
              </div>
              <div className="flex space-x-3 flex-shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); onReject(notification.id); }}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  title="Decline Invitation"
                >
                  <X className="mr-1.5 h-4 w-4 text-red-500" />
                  Decline
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onAccept(notification.id); }}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                   title="Accept Invitation"
               >
                  <Check className="mr-1.5 h-4 w-4" />
                  Accept
                </button>
              </div>
            </div>
          )}
          
          {/* Other Notification Types Details */}
          {notification.type !== 'invitation' && (
             <div className="text-sm text-gray-700 space-y-2">
               {/* Add more details based on type if needed */}
               {notification.mentionedBy && <p><span className="font-medium">Mentioned by:</span> {notification.mentionedBy}</p>}
               {notification.meetingTime && <p><span className="font-medium">Meeting Time:</span> {notification.meetingTime}</p>}
               {notification.assignedBy && notification.assignedBy !== 'Project Bot' && <p><span className="font-medium">Assigned by:</span> {notification.assignedBy}</p>}

               {notification.link && (
                  <a href={notification.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium inline-flex items-center" onClick={(e) => e.stopPropagation()}>
                      View Details 
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                  </a>
               )}
                 {!notification.link && (
                    <div className="flex justify-end pt-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleExpand(null); }} // Collapse on dismiss
                            className="text-sm text-gray-500 hover:text-gray-700"
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


// --- Main Page Component ---
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
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

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const availableFilters = ['all', 'unread', ...new Set(initialNotifications.map(n => n.type))]; // Dynamically get types

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
                      <span className="ml-3 bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
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
            {/* Notification Card */}
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
                       {filterKey.replace('_', ' ')} {/* Simple formatting for type */}
                     </button>
                   ))}
                </div>

                 {/* Mark All Read Button */}
                 {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center flex-shrink-0"
                    title="Mark all notifications as read"
                  >
                     <CheckCircle className="w-4 h-4 mr-1.5" />
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="divide-y divide-gray-200">
                {filteredNotifications.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="flex justify-center mb-4">
                      <Bell className="h-16 w-16 text-gray-300" />
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No Notifications</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {filter === 'all' ? "You're all caught up!" : `No ${filter.replace('_', ' ')} notifications found.`}
                    </p>
                    {filter !== 'all' && (
                        <button onClick={() => setFilter('all')} className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                            View All Notifications
                        </button>
                    )}
                  </div>
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

              {/* Footer (Optional: could show pagination or summary) */}
               <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-sm text-gray-500 text-right">
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