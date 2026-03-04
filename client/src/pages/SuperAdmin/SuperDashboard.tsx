

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid
} from "recharts";
import { SuperSidebar } from "../../components/dashboard/SuperSidebar";
import { SuperTopbar } from "../../components/dashboard/SuperTopbar";
import { TrendingUp, Users, Mail, Zap, BarChart3, Activity, Clock, AlertCircle, X, ExternalLink } from "lucide-react";
import { Button } from "../../components/ui/Button";

import { useEffect, useState } from "react";
import { fetchDashboardStats, type DashboardStats } from "../../api/admin";

const COLORS = ["#8B5CF6", "#3B82F6", "#94A3B8"];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const SuperDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFailures, setShowFailures] = useState(false);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await fetchDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
                Loading Dashboard...
            </div>
        );
    }
    return (
        <div className="relative bg-[#fafafa] dark:bg-gray-950 min-h-screen overflow-hidden transition-colors duration-300">


            <SuperSidebar />
            <SuperTopbar title="Analytics Dashboard" />

            <main className="ml-64 pt-28 p-8">
                <motion.div
                    className="max-w-7xl mx-auto space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Welcome Section */}
                    <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                        <div>
                            <span className="inline-block px-4 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">
                                Platform Overview
                            </span>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                System <span className="text-blue-600 dark:text-blue-500">Performance</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Global statistics and activity tracking across all tiers</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Growth</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{(stats?.performance?.growth || 0) > 0 ? "+" : ""}{stats?.performance?.growth || 0}%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Users</p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{stats?.performance?.totalUsers || 0}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Summary Metrics Grid */}
                    {stats?.summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Total Campaigns", value: stats.summary.totalCampaigns, icon: <BarChart3 className="w-4 h-4" />, color: "blue" },
                                { label: "Total Emails", value: stats.summary.totalEmails.toLocaleString(), icon: <Activity className="w-4 h-4" />, color: "indigo" },
                                { label: "Queued", value: stats.summary.queueCount, icon: <Clock className="w-4 h-4" />, color: "gray" },
                                {
                                    label: "Failure Rate",
                                    value: `${stats.summary.failedEmailsCount} of ${stats.summary.totalEmails}`,
                                    icon: <AlertCircle className="w-4 h-4" />,
                                    color: "red",
                                    action: (
                                        <button
                                            onClick={() => setShowFailures(true)}
                                            className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase text-red-600 dark:text-red-400 hover:underline"
                                        >
                                            View <ExternalLink className="w-2.5 h-2.5" />
                                        </button>
                                    )
                                },
                            ].map((metric) => (
                                <motion.div
                                    key={metric.label}
                                    variants={itemVariants}
                                    className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-1.5 rounded-lg bg-${metric.color}-50 dark:bg-${metric.color}-900/10 text-${metric.color}-600 dark:text-${metric.color}-400`}>
                                            {metric.icon}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{metric.label}</span>
                                        {metric.action}
                                    </div>
                                    <p className="text-xl font-black text-gray-900 dark:text-white leading-tight">{metric.value}</p>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Failure Details Modal */}
                    <AnimatePresence>
                        {showFailures && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowFailures(false)}
                                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                                >
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Failure Details</h3>
                                            <p className="text-sm text-gray-500">Recent email failures and their reasons</p>
                                        </div>
                                        <button
                                            onClick={() => setShowFailures(false)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                        >
                                            <X className="w-6 h-6 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="p-0 max-h-[60vh] overflow-y-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase text-gray-400">
                                                <tr>
                                                    <th className="px-6 py-4">Recipient</th>
                                                    <th className="px-6 py-4">Error Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                {stats?.summary?.failedList?.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{item.email}</p>
                                                            <p className="text-[10px] text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold border border-red-100 dark:border-red-900/20">
                                                                {item.reason}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!stats?.summary?.failedList || stats.summary.failedList.length === 0) && (
                                                    <tr>
                                                        <td colSpan={2} className="px-6 py-12 text-center text-gray-400 italic">No failure data available.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 text-right">
                                        <Button onClick={() => setShowFailures(false)}>Close Overview</Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Pie Chart: User Distribution */}
                        <motion.div variants={itemVariants} className="lg:col-span-1 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center transition-colors duration-300">
                            <div className="w-full flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                                    Tier Distribution
                                </h3>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats?.tierDistribution || []}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {(stats?.tierDistribution || []).map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full space-y-3 mt-4">
                                {stats?.tierDistribution.map((item, idx) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                            <span className="font-bold text-gray-600">{item.name}</span>
                                        </div>
                                        <span className="font-black text-gray-900">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Line Chart: Single vs Bulk */}
                        <motion.div variants={itemVariants} className="lg:col-span-1 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-8">
                                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                                Validation Activity
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats?.validationActivity || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Line type="monotone" dataKey="single" stroke="#3B82F6" strokeWidth={4} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} />
                                        <Line type="monotone" dataKey="bulk" stroke="#8B5CF6" strokeWidth={4} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Line Chart: Campaigns */}
                        <motion.div variants={itemVariants} className="lg:col-span-1 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-8">
                                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                                Campaign Flow
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats?.campaignFlow || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 700 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Line type="monotone" dataKey="sent" stroke="#10B981" strokeWidth={3} dot={{ r: 3, fill: '#10B981' }} />
                                        <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={3} dot={{ r: 3, fill: '#EF4444' }} />
                                        <Line type="monotone" dataKey="queued" stroke="#94A3B8" strokeWidth={3} dot={{ r: 3, fill: '#94A3B8' }} />
                                        <Line type="monotone" dataKey="processing" stroke="#3B82F6" strokeWidth={3} dot={{ r: 3, fill: '#3B82F6' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </main>

            <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-10 py-8 text-[10px] text-gray-400 dark:text-gray-500 flex justify-between uppercase font-black tracking-widest ml-64 transition-colors duration-300">
                <span>© 2026 MailFlow HQ. Super Admin Authority.</span>
                <div className="flex gap-6">
                    <span className="text-blue-600/50 dark:text-blue-400/50">System Status: Optimal</span>
                    <span>v1.2.0-PRO</span>
                </div>
            </footer>
        </div>
    );
};

export default SuperDashboard;

