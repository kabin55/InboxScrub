import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
import { Settings as SettingsIcon, Bell, Palette } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { IAMSettings } from "../components/dashboard/IAMSettings";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();

    return (
        <div className="bg-[#fafafa] dark:bg-gray-950 min-h-screen transition-colors duration-300">
            <Sidebar />
            <Topbar />

            <main className="ml-64 pt-20 p-8">
                <div className="max-w-3xl mx-auto space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <SettingsIcon className="w-8 h-8 text-blue-600" />
                            Settings
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your preferences and account settings.</p>
                    </div>

                    {/* Settings Sections */}
                    <div className="space-y-6">
                        {/* Notifications */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Notifications</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage how you receive alerts</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">Email Notifications</p>
                                        <p className="text-xs text-gray-400">Receive updates about your validations</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">Campaign Alerts</p>
                                        <p className="text-xs text-gray-400">Get notified when campaigns complete</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Access Management (iAM) - Hide if user signed in via token (oauth_provider === 'none') */}
                        {user?.oauth_provider !== "none" && <IAMSettings />}

                        {/* Appearance */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Appearance</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Customize the look and feel</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">Theme</p>
                                    <p className="text-xs text-gray-400">Choose your preferred theme</p>
                                </div>
                                <select
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value as any)}
                                    className="px-4 py-2 text-sm font-medium border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="system">System</option>
                                </select>
                            </div>
                        </div>


                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-8">
                        © 2026 MailFlow. All rights reserved.
                    </p>
                </div>
            </main>
        </div>
    );
}
