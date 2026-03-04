import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SuperSidebar } from "../../components/dashboard/SuperSidebar";
import { SuperTopbar } from "../../components/dashboard/SuperTopbar";
import { fetchCampaigns, type CampaignListResponse } from "../../api/admin";
import {
    ChevronLeft, ChevronRight, FileText,
    Mail, Search
} from "lucide-react";
import { Button } from "../../components/ui/Button";

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

const CampaignList: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<CampaignListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadCampaigns(page);
    }, [page]);

    const loadCampaigns = async (pageNum: number) => {
        setLoading(true);
        try {
            const res = await fetchCampaigns(pageNum);
            setData(res);
        } catch (error) {
            console.error("Failed to load campaigns", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed": return "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30";
            case "failed": return "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30";
            case "processing": return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30";
            case "queued": return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
            default: return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
        }
    };

    // Filter campaigns based on search
    const filteredCampaigns = data?.campaigns.filter(camp =>
        camp.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camp.issuer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camp.issuer?.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="relative bg-[#fafafa] dark:bg-gray-950 min-h-screen overflow-hidden transition-colors duration-300">
            <SuperSidebar />
            <SuperTopbar title="Campaign Monitor" />

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
                                System Wide
                            </span>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                Campaign <span className="text-blue-600 dark:text-blue-500">Overview</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Monitor and manage all email campaigns across the platform</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-2 flex items-center gap-4 shadow-sm">
                                <div className="text-right px-2">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Campaigns</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white">{filteredCampaigns.length}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Search & Toolbar */}
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by campaign name, user or email..."
                                className="w-full pl-11 pr-4 py-3.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:blur-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-800 transition-all shadow-sm text-gray-900 dark:text-gray-100"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </motion.div>

                    {/* Campaign List Cards */}
                    <motion.div variants={itemVariants} className="space-y-6">
                        {loading ? (
                            <div className="py-20 text-center text-gray-400">Loading campaigns...</div>
                        ) : filteredCampaigns.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-inner">
                                    <Search className="w-8 h-8 text-gray-200" />
                                </div>
                                <h4 className="text-gray-900 font-bold">No campaigns found</h4>
                                <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
                            </div>
                        ) : (
                            filteredCampaigns.map((camp) => (
                                <div key={camp.jobId} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
                                    <div className="p-6 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-200 dark:shadow-none shrink-0">
                                                {camp.issuer.name ? camp.issuer.name.charAt(0).toUpperCase() : "U"}
                                                {camp.issuer.name ? camp.issuer.name.split(' ')[1]?.charAt(0).toUpperCase() : ""}
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight flex items-center gap-2">
                                                    {camp.issuer.name || "Unknown User"}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1 text-xs">
                                                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-medium">
                                                        <Mail className="w-3.5 h-3.5 opacity-70" />
                                                        {camp.issuer.email || "No Email"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 md:gap-8 justify-between md:justify-end w-full md:w-auto">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">{camp.fileName}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-mono mt-0.5">{new Date(camp.createdAt).toLocaleDateString()}</span>

                                                {/* Analytics Stats */}
                                                <div className="flex gap-4 mt-2">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[8px] uppercase text-gray-400 font-bold">Sent</span>
                                                        <span className="text-xs font-black text-green-600 dark:text-green-400">{camp.stats?.sent || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[8px] uppercase text-gray-400 font-bold">Failed</span>
                                                        <span className="text-xs font-black text-red-600 dark:text-red-400">{camp.stats?.failed || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[8px] uppercase text-gray-400 font-bold">Opened</span>
                                                        <span className="text-xs font-black text-blue-600 dark:text-blue-400">{camp.stats?.opened || 0}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right min-w-[80px]">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Emails</p>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                    <p className="text-xl font-black text-blue-600 dark:text-blue-500">{camp.totalEmails}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end min-w-[100px] gap-2">
                                                <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider ${getStatusStyles(camp.jobStatus)}`}>
                                                    {camp.jobStatus}
                                                </span>
                                                <button
                                                    onClick={() => navigate(`/admin/campaigns/${camp.jobId}`)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                >
                                                    View Details <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>

                    {/* Pagination */}
                    {!loading && data && data.totalPages > 1 && (
                        <div className="p-4 flex items-center justify-center gap-4">
                            <Button
                                variant="secondary"
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="py-2 h-auto text-xs"
                            >
                                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                            </Button>
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                Page {data.currentPage} of {data.totalPages}
                            </span>
                            <Button
                                variant="secondary"
                                disabled={page === data.totalPages}
                                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                className="py-2 h-auto text-xs"
                            >
                                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </div>
                    )}
                </motion.div>
            </main>
        </div >
    );
};

export default CampaignList;
