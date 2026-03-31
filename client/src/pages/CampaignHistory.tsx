import { useState, useEffect } from "react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
import { useNavigate } from "react-router-dom";
import { Mail, ChevronRight, Search, History } from "lucide-react";
import { fetchMyCampaigns, type UserCampaignListResponse } from "../api/campaign";

export default function CampaignHistory() {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<UserCampaignListResponse['campaigns']>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);

    useEffect(() => {
        // Ensure the page starts at the top
        window.scrollTo(0, 0);

        fetchMyCampaigns()
            .then(data => setCampaigns(data.campaigns))
            .catch(err => console.error("Failed to fetch campaigns", err))
            .finally(() => setLoadingCampaigns(false));
    }, []);

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case "completed": return "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30";
            case "failed": return "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30";
            case "processing": return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30";
            case "queued": return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
            default: return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
        }
    };

    return (
        <div className="bg-[#fafafa] dark:bg-gray-950 min-h-screen transition-colors duration-300">
            <Sidebar />
            <Topbar />

            <main className="ml-64 pt-28 p-8 max-w-7xl mx-auto space-y-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <History className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            Campaign History
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Review and manage your email campaigns.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {loadingCampaigns ? (
                        <div className="py-12 text-center text-gray-400">Loading campaigns...</div>
                    ) : campaigns.length === 0 ? (
                        <div className="py-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="w-6 h-6 text-gray-300" />
                            </div>
                            <h4 className="text-gray-900 font-bold text-sm">No campaigns found</h4>
                        </div>
                    ) : (
                        campaigns.map((camp) => (
                            <div key={camp.jobId} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
                                <div className="p-6 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-200 dark:shadow-none shrink-0">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight flex items-center gap-2">
                                                {camp.fileName}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-xs">
                                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-medium">
                                                    <span className="font-mono">{new Date(camp.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            {/* Analytics Stats */}
                                            <div className="flex gap-4 mt-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase text-gray-400 font-bold">Sent</span>
                                                    <span className="text-sm font-black text-green-600 dark:text-green-400">{camp.stats?.sent || 0}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase text-gray-400 font-bold">Failed</span>
                                                    <span className="text-sm font-black text-red-600 dark:text-red-400">{camp.stats?.failed || 0}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase text-gray-400 font-bold">Opened</span>
                                                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">{camp.stats?.opened || 0}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase text-gray-400 font-bold">Not Opened</span>
                                                    <span className="text-sm font-black text-gray-600 dark:text-gray-400">{camp.stats?.not_opened || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 md:gap-8 justify-between md:justify-end w-full md:w-auto">
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
                                                onClick={() => navigate(`/reports/campaign/${camp.jobId}`)}
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
                </div>

                <footer className="mt-12 pt-8 border-t dark:border-gray-800 flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 pb-8 uppercase font-black tracking-widest transition-colors duration-300">
                    <p>© 2026 MailFlow. Premium Email Validation.</p>
                    <div className="flex gap-8">
                        <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy</span>
                        <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
