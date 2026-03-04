import {
  LayoutDashboard,
  Mail,
  ShieldCheck,
  Send,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  FileUp,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const MENU = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Single Email Validation", icon: Mail, path: "/single-email" },
  { label: "Bulk Email Validation", icon: Mail, path: "/bulk-email" },
  { label: "Mass Email Campaign", icon: Send, path: "/campaigns" },
  { label: "Upload Template", icon: FileUp, path: "/templates" },
  { label: "Pricing / Buy Credits", icon: CreditCard, path: "/pricing" },
  { label: "History & Reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hasAccess = (itemPath: string) => {
    if (!user?.permissions) return true; // Full access for normal login

    if (itemPath === "/single-email" || itemPath === "/bulk-email") {
      return user.permissions.includes("Email Sanitization");
    }
    if (itemPath === "/campaigns") {
      return user.permissions.includes("Bulk Mailing");
    }
    if (itemPath === "/templates") {
      return user.permissions.includes("Upload Template");
    }
    // Always allow these generic paths
    return ["/dashboard", "/pricing", "/reports", "/settings", "/profile"].includes(itemPath);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 px-5 py-6 shadow-sm transition-colors duration-300">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-xl">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">MailFlow</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {MENU.filter(item => hasAccess(item.path)).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mt-8 mb-4 border-t border-gray-100 dark:border-gray-800"></div>

      {/* Profile */}
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 mb-1 ${isActive
            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
          }`
        }
      >
        <span className="p-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:bg-white dark:group-hover:bg-gray-900 transition-colors">
          <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </span>
        Profile Settings
      </NavLink>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-200"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </button>

      {/* Footer */}
      <div className="absolute bottom-6 left-5 right-5">
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Need Help?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">support@mailflow.com</p>
        </div>
      </div>
    </aside>
  );
};
