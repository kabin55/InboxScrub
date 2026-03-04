import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronDown, Bell, Check, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { useNotification } from "../../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export const Topbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const { user, credits, logout } = useAuth();
  const { summary } = useData();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  } = useNotification();
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
    if (!isNotificationOpen && unreadCount > 0) {
      // Optional: mark all as read when opening? Or let user do it manually?
      // For now, let's keep it manual or per-item
    }
  };

  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-8 flex items-center justify-between transition-colors duration-300">
      {/* Search / Title Area */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Welcome back, <span className="text-blue-600 dark:text-blue-400">{user?.name?.split(' ')[0] || 'User'}</span> 👋</h2>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">

        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={handleNotificationClick}
            className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
          >
            <Bell className={`w-5 h-5 ${isNotificationOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 flex flex-col max-h-[80vh]"
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-xs font-semibold transition-colors"
                        title="Mark all as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-xs font-semibold transition-colors"
                        title="Clear all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-y-auto py-2 flex-1">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center gap-3">
                      <Bell className="w-8 h-8 opacity-20" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 relative group ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                            }`}
                        >
                          <div className="flex gap-3">
                            <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'
                              }`} />
                            <div className="flex-1 space-y-1">
                              <p className={`text-sm leading-snug ${!notification.read ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>

                            {/* Actions on Hover */}
                            <div className="hidden group-hover:flex items-start pl-2">
                              {!notification.read && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                  className="p-1 hover:text-blue-600 text-gray-400"
                                  title="Mark as read"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Credit Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-2 rounded-xl shadow-md shadow-blue-200 dark:shadow-none">
          <span className="text-xs font-bold uppercase tracking-wider opacity-80">Credits</span>
          <span className="text-sm font-black">{summary?.total_credits?.toLocaleString() ?? credits?.toLocaleString() ?? "..."}</span>
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-xl ring-2 ring-blue-100 dark:ring-blue-900 shadow-sm object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black ring-2 ring-blue-100 dark:ring-blue-900 shadow-sm">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'JD'}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user?.name || 'User'}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50"
              >
                <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 mb-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email || 'email@example.com'}</p>
                </div>

                <button
                  onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>

                <button
                  onClick={() => { setIsDropdownOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>

                <div className="my-2 border-t border-gray-50 dark:border-gray-800"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
