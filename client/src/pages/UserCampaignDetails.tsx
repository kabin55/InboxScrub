import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Mail, MailOpen,
    XCircle, AlertCircle, Download,
    Search, Eye
} from "lucide-react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
import { Button } from "../components/ui/Button";
import { fetchUserCampaignDetails, type UserCampaignDetailResponse } from "../api/campaign";
import { useNotification } from "../context/NotificationContext";

const UserCampaignDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedEmail, setSelectedEmail] = useState<UserCampaignDetailResponse['emails'][0] | null>(null);
    const [campaign, setCampaign] = useState<UserCampaignDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const { addToast } = useNotification();

    useEffect(() => {
        if (id) {
            loadCampaignDetails(id);
        }
    }, [id]);

    const loadCampaignDetails = async (jobId: string) => {
        setLoading(true);
        try {
            const data = await fetchUserCampaignDetails(jobId);
            setCampaign(data);
        } catch (error) {
            console.error("Failed to load campaign details", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredEmails = campaign?.emails.filter(email => {
        const matchesSearch = email.email.toLowerCase().includes(search.toLowerCase()) ||
            (email.reason && email.reason.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === "All" || email.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) || [];

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case "completed":
            case "delivered":
            case "sent":
                return "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30";
            case "failed":
            case "bounced":
                return "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30";
            case "processing": return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30";
            case "queued": return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
            default: return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
        }
    };

    const handleExportCSV = () => {
        if (!campaign) return;
        const headers = ["Email", "Status", "Failure Reason", "Last Updated"];
        const rows = filteredEmails.map(e => [
            e.email, e.status, e.reason || "", new Date(e.updatedAt).toLocaleString()
        ]);
        const content = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([content], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `campaign_details_${campaign.fileName}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-gray-500 bg-[#fafafa] dark:bg-gray-950">
                Loading Campaign Details...
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="flex min-h-screen items-center justify-center text-sm text-gray-500 bg-[#fafafa] dark:bg-gray-950">
                Campaign not found.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950 transition-colors duration-300">
            <Sidebar />
            <Topbar />

            <main className="ml-64 pt-28 p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Breadcrumb & Header */}
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate("/reports")}
                            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Reports
                        </button>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                                    Campaign Details
                                    <span className={`px-2 py-0.5 text-xs font-black rounded-lg border uppercase tracking-wider ${getStatusStyles(campaign.status)}`}>
                                        {campaign.status}
                                    </span>
                                </h1>
                                <p className="text-gray-500 font-mono text-sm mt-1">{campaign.jobId}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="secondary"
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export CSV
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={async () => {
                                        try {
                                            const { triggerWhatsappFollowup } = await import("../api/campaign");
                                            const res = await triggerWhatsappFollowup(campaign.jobId);
                                            if (res.success) {
                                                addToast('success', res.message || "Follow-up triggered successfully!");
                                                loadCampaignDetails(campaign.jobId); // Refresh state
                                            } else {
                                                addToast('warning', res.message);
                                            }
                                        } catch (e) {
                                            addToast('error', "Failed to run follow-ups");
                                        }
                                    }}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                >
                                    WhatsApp Follow-Up
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Campaign Info</p>
                            <div className="space-y-1">
                                <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1" title={campaign.fileName}>
                                    {campaign.fileName}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Mail className="w-3 h-3" />
                                    {campaign.totalEmails} Total Emails
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Failure Rate</p>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-gray-900 dark:text-white">
                                    {campaign.summary.failed}
                                </span>
                                <span className="text-sm font-bold text-gray-400 mb-1.5">
                                    / {campaign.totalEmails} emails
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div
                                    className="bg-red-500 h-full rounded-full"
                                    style={{ width: `${campaign.totalEmails > 0 ? (campaign.summary.failed / campaign.totalEmails) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Open Statistics</p>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MailOpen className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Opened</span>
                                    </div>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">
                                        {campaign.emails.filter(e => e.opened).length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Unopened</span>
                                    </div>
                                    <span className="text-sm font-black text-gray-900 dark:text-white">
                                        {campaign.totalEmails - campaign.emails.filter(e => e.opened).length}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-1 overflow-hidden flex">
                                    <div
                                        className="bg-blue-500 h-full"
                                        style={{ width: `${campaign.totalEmails > 0 ? (campaign.emails.filter(e => e.opened).length / campaign.totalEmails) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Timestamps</p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Created</span>
                                    <span className="font-mono text-gray-900 dark:text-white">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Email List Section */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Recipients & Status</h2>

                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 text-sm"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl focus:outline-none text-sm font-medium text-gray-600 dark:text-gray-400"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="queued">Queued</option>
                                    <option value="sent">Sent</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#fafbfc] dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400">
                                    <tr>
                                        <th className="px-6 py-4">Participant</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Opened</th>
                                        <th className="px-6 py-4">WhatsApp</th>
                                        <th className="px-6 py-4">Failure Reason</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {filteredEmails.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                                No emails found matching your filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmails.map((email, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white text-sm">
                                                    <div>{email.name || "Unknown"}</div>
                                                    <div className="text-xs text-gray-500 font-normal">{email.email} / {email.phone || "No phone"}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider ${getStatusStyles(email.status)}`}>
                                                        {email.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {email.opened ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30">
                                                            <MailOpen className="w-3.5 h-3.5" />
                                                            Opened
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700">
                                                            <Mail className="w-3.5 h-3.5 opacity-60" />
                                                            Unopened
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {email.whatsappStatus === 'sent' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30">
                                                            Sent
                                                        </span>
                                                    ) : email.whatsappStatus === 'failed' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">
                                                            Failed
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {email.reason ? (
                                                        <span className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {email.reason}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => setSelectedEmail(email)}
                                                        className="inline-flex items-center gap-1.5 text-xs py-1.5 h-auto text-gray-600 dark:text-gray-300"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Email Detail Modal */}
            <AnimatePresence>
                {selectedEmail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEmail(null)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Email Details</h3>
                                    <p className="text-sm text-gray-500 font-medium">
                                        {selectedEmail.name ? `${selectedEmail.name} - ` : ""}{selectedEmail.email}
                                        {selectedEmail.phone ? ` (${selectedEmail.phone})` : ""}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedEmail(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    <XCircle className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
                                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider ${getStatusStyles(selectedEmail.status)}`}>
                                                {selectedEmail.status}
                                            </span>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Opened</p>
                                            {selectedEmail.opened ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30">
                                                    <MailOpen className="w-3.5 h-3.5" />
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700">
                                                    <Mail className="w-3.5 h-3.5 opacity-60" />
                                                    No
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">WhatsApp</p>
                                            {selectedEmail.whatsappStatus === 'sent' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30">
                                                    Sent
                                                </span>
                                            ) : selectedEmail.whatsappStatus === 'failed' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">
                                                    Failed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-black rounded-lg border uppercase tracking-wider bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Last Updated</p>
                                            <p className="text-sm font-mono text-gray-600">{new Date(selectedEmail.updatedAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    {selectedEmail.reason && (
                                        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Failure Reason</p>
                                            <p className="text-sm font-bold text-red-700 dark:text-red-400">{selectedEmail.reason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserCampaignDetails;
