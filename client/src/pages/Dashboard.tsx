// import { useEffect, useState } from "react";
// react hooks removed as they are not used anymore for data fetching
import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
import { CreditSummary } from "../components/dashboard/CreditSummary";
import { QuickActions } from "../components/dashboard/QuickActions";
// import { type UserSummary } from "../api/user";
import { CheckCircle, AlertTriangle, XCircle, BarChart3, History, Mail, Layers, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { PenguinMascot } from "../components/dashboard/PenguinMascot";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useTheme } from "../context/ThemeContext";

export default function Dashboard() {
  // Use global data context for summary
  const { summary, loading, error } = useData();
  const { user } = useAuth(); // Globally accessed credits from AuthContext
  const { theme } = useTheme();

  // No local useEffect for fetching! Data is managed by DataContext.


  return (
    <div className="bg-[#fafafa] dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <Topbar />

      <main className="ml-64 pt-20 p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {user?.oauth_provider === "none" && user?.permissions && user.permissions.length > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>
                You are logged in with token access. You have specific permissions: <span className="font-bold">{user.permissions.join(", ")}</span>.
              </span>
            </div>
          )}

          {/* 🔥 Top Section: Swapped layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

            {/* Welcome Section (Image Section) - Left (col-span-12 or smaller?) */}
            {/* Swapped layout: Image Section (Welcome) is now on the left/top */}
            <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden transition-colors duration-300">
              <div className="flex-1 space-y-4 z-10">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Hello, welcome, <span className="text-blue-600 dark:text-blue-400">{user?.name || "User"}</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
                  Welcome back to MailFlow. We're glad to see you again! Explore your dashboard to manage your email validations and campaigns efficiently.
                </p>
                <div className="flex gap-4">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all text-sm shadow-md shadow-blue-200 dark:shadow-none">
                    Get Started
                  </button>
                  <button className="px-6 py-2 border border-gray-200 dark:border-gray-700 rounded-full font-bold hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all text-sm">
                    Tutorial
                  </button>
                </div>
              </div>
              <div className="w-48 h-48 flex-shrink-0 relative z-10">
                <PenguinMascot mood="happy" />
              </div>
              {/* Background detail */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#fdf8f4] dark:bg-[#1e1b19] rounded-full blur-3xl opacity-60"></div>
            </div>

            {/* Credit Summary and Quick Actions - Right */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <CreditSummary
                credits={summary?.total_credits ?? 0}
                totalValidated={summary?.totalEmail ?? 0}
              />
              <QuickActions />
              {/* Test Notification Button (Temporary) */}
              <div className="md:col-span-2 flex justify-center">
                <button
                  onClick={() => {
                    // Try to clear previous if any to avoid clutter during dev
                    // window.dispatchEvent(new Event('test-notification'));
                  }}
                  className="hidden" // Hidden for production, but ready for dev testing if needed
                >Test</button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-800 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-400 font-medium">Crunching your data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-100 dark:border-red-900 flex items-center gap-4">
              <XCircle className="w-8 h-8" />
              <p className="font-medium">{error}</p>
            </div>
          ) : summary ? (
            <>
              {/* Activity Stats & Graph */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Graph Section */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors duration-300">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Recent History Activity
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Daily activity summary for the last 30 days</p>
                    </div>
                  </div>

                  <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.activity_data || []} barGap={8}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={theme === 'dark' ? "#1f2937" : "#f1f5f9"}
                        />

                        <XAxis
                          dataKey="date"
                          stroke={theme === 'dark' ? "#64748b" : "#888888"}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) =>
                            new Date(val).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                          }
                        />

                        <YAxis
                          stroke={theme === 'dark' ? "#64748b" : "#888888"}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />

                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? '#111827' : '#111827',
                            borderRadius: '12px',
                            border: theme === 'dark' ? '1px solid #1f2937' : 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                          itemStyle={{ color: '#ffffff' }}
                          cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(61, 90, 128, 0.08)' }}
                        />

                        <Legend
                          iconType="circle"
                        />

                        <Bar
                          dataKey="single"
                          name="Single Validations"
                          fill={theme === 'dark' ? "#60a5fa" : "#3d5a80"}
                          radius={[4, 4, 0, 0]}
                        />

                        <Bar
                          dataKey="bulk"
                          name="Bulk Validations"
                          fill={theme === 'dark' ? "#3b82f6" : "#98c1d9"}
                          radius={[4, 4, 0, 0]}
                        />

                        <Bar
                          dataKey="campaigns"
                          name="Campaigns"
                          fill={theme === 'dark' ? "#1d4ed8" : "#e0fbfc"}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Validation Summary Cards */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 h-full flex flex-col justify-center gap-6 transition-colors duration-300">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Result Breakdown</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <span className="font-bold text-green-800 dark:text-green-400">Deliverable</span>
                        </div>
                        <span className="text-xl font-black text-green-900 dark:text-green-100">{summary.email_result_summary.deliverable}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-6 h-6 text-yellow-500" />
                          <span className="font-bold text-yellow-800 dark:text-yellow-400">Risky</span>
                        </div>
                        <span className="text-xl font-black text-yellow-900 dark:text-yellow-100">{summary.email_result_summary.risky}</span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                        <div className="flex items-center gap-3">
                          <XCircle className="w-6 h-6 text-red-500" />
                          <span className="font-bold text-red-800 dark:text-red-400">Rejected</span>
                        </div>
                        <span className="text-xl font-black text-red-900 dark:text-red-100">{summary.email_result_summary.undeliverable}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Counts Summary Table */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Validation Activity Summary
                  </h3>
                  <button className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">View Detailed Reports</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] font-black">
                      <tr>
                        <th className="px-8 py-4">Validation Category</th>
                        <th className="px-8 py-4">Description</th>
                        <th className="px-8 py-4 text-center">Total Jobs</th>
                        <th className="px-8 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                      {/* Single Email Validations */}
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-gray-100">Single Email Validation</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-gray-500 dark:text-gray-400">One-by-one email deliverability checks</td>
                        <td className="px-8 py-6 text-center font-black text-lg text-gray-900 dark:text-gray-100">
                          {summary.validation_counts?.single ?? 0}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Verify More</button>
                        </td>
                      </tr>

                      {/* Bulk Email Validations */}
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-gray-100">Bulk Email Validation</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-gray-500 dark:text-gray-400">
                          Large file uploads and list cleaning {summary.validation_counts?.bulk ?? 0} ({summary.email_result_summary.deliverable + summary.email_result_summary.risky + summary.email_result_summary.undeliverable} emails)
                        </td>
                        <td className="px-8 py-6 text-center font-black text-lg text-gray-900 dark:text-gray-100">
                          {summary.validation_counts?.bulk ?? 0}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button className="text-purple-600 dark:text-purple-400 font-bold hover:underline">Upload File</button>
                        </td>
                      </tr>

                      {/* Mass Email Campaigns */}
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                              <Send className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-gray-100">Mass Email Campaign</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-gray-500 dark:text-gray-400">Directly sending emails to verified lists ({summary.validation_counts?.totalCampaignEmails ?? 0} emails)</td>
                        <td className="px-8 py-6 text-center font-black text-lg text-gray-900 dark:text-gray-100">
                          {summary.validation_counts?.campaigns ?? 0}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button className="text-orange-600 dark:text-orange-400 font-bold hover:underline">Start Campaign</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>

      <footer className="border-t dark:border-gray-800 bg-white dark:bg-gray-950 px-8 py-6 text-sm text-gray-500 transition-colors duration-300 flex justify-between">
        <span className="font-medium">© 2026 MailFlow. All rights reserved.</span>
        <div className="space-x-6 font-bold text-gray-400">
          <span className="hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors">Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}
