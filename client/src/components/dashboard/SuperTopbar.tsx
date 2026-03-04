

import React, { useState, useRef, useEffect } from "react";
import { User as UserIcon, Bell, ChevronDown, LogOut, ShieldAlert, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SuperTopbarProps {
    title?: string;
}

export const SuperTopbar: React.FC<SuperTopbarProps> = ({ title = "Super Admin" }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="fixed left-64 right-0 top-0 z-30 h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-8 flex items-center justify-between transition-colors duration-300">
            <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                        <LayoutDashboard className="w-5 h-5 text-white" />
                    </div>
                    {title}
                </h2>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                </button>

                <div className="h-8 w-px bg-gray-100 dark:bg-gray-800"></div>

                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 p-1 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
                    >
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-700 dark:to-gray-900 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-gray-200 dark:shadow-black/50 group-hover:scale-105 transition-transform">
                            SA
                        </div>
                        <div className="hidden md:block text-left pr-2">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Admin</p>
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest">Main Controller</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 overflow-hidden"
                            >
                                <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Signed in as</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">admin@mailflow.io</p>
                                </div>

                                <div className="p-2">
                                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors">
                                        <UserIcon className="w-4 h-4" /> Account Settings
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors">
                                        <ShieldAlert className="w-4 h-4" /> Security Logs
                                    </button>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2 my-1"></div>

                                <div className="p-2">
                                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                        <LogOut className="w-4 h-4" /> Sign Out System
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

