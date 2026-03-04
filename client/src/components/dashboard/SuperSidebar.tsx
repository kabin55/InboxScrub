import {
    LayoutDashboard,
    Users,
    History,
    LogOut,
    Mail
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const MENU = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin-dashboard" },
    { label: "User Management", icon: Users, path: "/admin-users" },
    { label: "Email History", icon: History, path: "/admin-history" },
    { label: "Campaigns", icon: Mail, path: "/admin-campaigns" },
];

export const SuperSidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 px-5 py-6 shadow-sm transition-colors duration-300">
            {/* Logo */}
            <div className="mb-10 flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                    <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                    <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight block leading-none">MailFlow</span>
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest pl-0.5">Admin Panel</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4 px-4">Administration</p>
                {MENU.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.label}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/20"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
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

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
                <LogOut className="h-5 w-5" />
                Logout
            </button>

            {/* Footer */}
            <div className="absolute bottom-6 left-5 right-5">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Super Admin Mode</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Restricted access area. Activities are logged.</p>
                </div>
            </div>
        </aside>
    );
};

