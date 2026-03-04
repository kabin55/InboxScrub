import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Mail, Layers, Send, FileText, CheckCircle2, XCircle, Download, ChevronDown } from "lucide-react";
import { SuperSidebar } from "../../components/dashboard/SuperSidebar";
import { SuperTopbar } from "../../components/dashboard/SuperTopbar";

import { fetchActivityLogs, type ActivityLogEntry } from "../../api/admin";

interface GroupedUserActivity {
    user: ActivityLogEntry["user"];
    activities: ActivityLogEntry[];
}

// MOCK_HISTORY removed

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

const EmailHistory: React.FC = () => {
    const [history, setHistory] = useState<ActivityLogEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "Success" | "Failed">("All");
    const [loading, setLoading] = useState(true);
    const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

    // Fetch logs with debounce
    useEffect(() => {
        const loadLogs = async () => {
            setLoading(true);
            try {
                const data = await fetchActivityLogs(searchQuery, statusFilter);
                setHistory(data);
            } catch (error) {
                console.error("Failed to load activity logs", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            loadLogs();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, statusFilter]);

    const getActionIcon = (action: ActivityLogEntry["action"]) => {
        switch (action) {
            case "Bulk Sanitization": return <Layers className="w-4 h-4 text-indigo-600" />;
            case "Single Verify": return <Mail className="w-4 h-4 text-blue-600" />;
            case "Mass Campaign": return <Send className="w-4 h-4 text-blue-400" />;
        }
    };

    // Grouping Logic
    const groupedHistory: GroupedUserActivity[] = Object.values(
        history.reduce((acc, entry) => {
            const email = entry.user.email;
            if (!acc[email]) {
                acc[email] = { user: entry.user, activities: [] };
            }
            acc[email].activities.push(entry);
            return acc;
        }, {} as Record<string, GroupedUserActivity>)
    ).sort((a, b) => {
        const latestA = new Date(a.activities[0].timestamp).getTime();
        const latestB = new Date(b.activities[0].timestamp).getTime();
        return latestB - latestA;
    });

    const toggleUserExpansion = (email: string) => {
        setExpandedEmails(prev => {
            const next = new Set(prev);
            if (next.has(email)) {
                next.delete(email);
            } else {
                next.add(email);
            }
            return next;
        });
    };

    return (
        <div className="relative bg-[#fafafa] dark:bg-gray-950 min-h-screen overflow-hidden transition-colors duration-300">


            <SuperSidebar />
            <SuperTopbar title="Email Activity Logs" />

            <main className="ml-64 pt-28 p-8">
                <motion.div
                    className="max-w-7xl mx-auto space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Header Section */}
                    <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                        <div>
                            <span className="inline-block px-4 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">
                                Platform Monitoring
                            </span>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                Email <span className="text-blue-600 dark:text-blue-500">History</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Audit log of all sanitization and campaign activities</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm active:scale-95 text-gray-700 dark:text-gray-300">
                                <Download className="w-4 h-4" /> Export CSV
                            </button>
                        </div>
                    </motion.div>

                    {/* Filters & Search */}
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by user, email or source..."
                                className="w-full pl-11 pr-4 py-3.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:blur-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-800 transition-all shadow-sm text-gray-900 dark:text-gray-100"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                            {(["All", "Success", "Failed"] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setStatusFilter(filter)}
                                    className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === filter
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Grouped History List */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        {groupedHistory.map((group) => {
                            const isExpanded = expandedEmails.has(group.user.email);
                            const displayedActivities = group.activities; // Show all when expanded

                            return (
                                <div key={group.user.email} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
                                    {/* User Header */}
                                    <div className="p-6 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-200 dark:shadow-none">
                                                {group.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight">{group.user.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{group.user.email}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Activities</p>
                                                <p className="text-xl font-black text-blue-600 dark:text-blue-500">{group.activities.length}</p>
                                            </div>
                                            <button
                                                onClick={() => toggleUserExpansion(group.user.email)}
                                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 border ${isExpanded
                                                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                    : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none'
                                                    }`}
                                            >
                                                {isExpanded ? (
                                                    <>Show Less <ChevronDown className="w-3.5 h-3.5 rotate-180" /></>
                                                ) : (
                                                    <>Show Actions <ChevronDown className="w-3.5 h-3.5" /></>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Activities Table (Expandable) */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-4 pt-0">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-separate border-spacing-y-2 mt-4">
                                                            <thead className="text-gray-400 uppercase tracking-widest text-[9px] font-black">
                                                                <tr>
                                                                    <th className="px-4 py-2">Action</th>
                                                                    <th className="px-4 py-2">Volume</th>
                                                                    <th className="px-4 py-2">Source</th>
                                                                    <th className="px-4 py-2">Status</th>
                                                                    <th className="px-4 py-2 text-right">Time</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {displayedActivities.map((entry) => (
                                                                    <tr
                                                                        key={entry.id}
                                                                        className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                                                                    >
                                                                        <td className="px-4 py-3 rounded-l-xl border-y border-l border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-700">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-2 bg-white dark:bg-gray-950 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                                                                                    {getActionIcon(entry.action)}
                                                                                </div>
                                                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{entry.action}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 border-y border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-700">
                                                                            <span className="text-sm font-black text-gray-900 dark:text-white">{entry.volume.toLocaleString()}</span>
                                                                        </td>
                                                                        <td className="px-4 py-3 border-y border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-700">
                                                                            <div className="flex items-center gap-2">
                                                                                <FileText className="w-3 h-3 text-gray-400" />
                                                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{entry.source}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 border-y border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-700">
                                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${entry.status === 'Success'
                                                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30'
                                                                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30'
                                                                                }`}>
                                                                                {entry.status === 'Success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                                                {entry.status}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 rounded-r-xl border-y border-r border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-700 text-right">
                                                                            <div className="flex flex-col items-end">
                                                                                <span className="text-[11px] font-bold text-gray-900 dark:text-white">
                                                                                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">
                                                                                    {new Date(entry.timestamp).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                        {!loading && history.length === 0 && (
                            <div className="py-20 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-inner">
                                    <Search className="w-8 h-8 text-gray-200" />
                                </div>
                                <h4 className="text-gray-900 font-bold">No logs found</h4>
                                <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </main>

            <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-10 py-8 text-[10px] text-gray-400 dark:text-gray-500 flex justify-between uppercase font-black tracking-widest ml-64 transition-colors duration-300">
                <span>© 2026 MailFlow HQ. Audit Authority.</span>
                <div className="flex gap-6">
                    <span className="text-blue-600/50 dark:text-blue-400/50">Tracking: Active</span>
                    <span>v1.2.0-PRO</span>
                </div>
            </footer>
        </div>
    );
};

export default EmailHistory;
