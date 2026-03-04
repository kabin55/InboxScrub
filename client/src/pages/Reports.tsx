import { useMemo, useState, useEffect } from "react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { Loader2, History, CreditCard, Mail, ShieldCheck, ChevronRight, Search } from "lucide-react";
import { getPaymentHistory, type PaymentItem } from "../api/profile";
import { fetchMyCampaigns, type UserCampaignListResponse } from "../api/campaign";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function Reports() {
    const navigate = useNavigate();
    const { summary, loading, error } = useData();
    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [campaigns, setCampaigns] = useState<UserCampaignListResponse['campaigns']>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);

    useEffect(() => {
        // Ensure the page starts at the top
        window.scrollTo(0, 0);

        getPaymentHistory()
            .then(data => setPayments(data.payments))
            .catch(err => console.error("Failed to fetch payments", err));

        fetchMyCampaigns()
            .then(data => setCampaigns(data.campaigns))
            .catch(err => console.error("Failed to fetch campaigns", err))
            .finally(() => setLoadingCampaigns(false));
    }, []);

    const data = useMemo(() => {
        const validated = summary?.totalEmail || 0;
        const available = summary?.total_credits || 1; // Avoid 0 for divider
        return [
            { name: 'Validated', value: validated, color: '#2563eb' }, // blue-600
            { name: 'Available Credits', value: available, color: '#e5e7eb' } // gray-200
        ];
    }, [summary]);

    // Memoize processing history combination and sorting
    const processingHistory = useMemo(() => {
        const singleHistory = summary?.singleEmail?.map(item => ({
            id: item._id,
            date: new Date(item.validated_at).toLocaleDateString(),
            type: "Single Verify",
            file: item.email,
            status: item.result,
            used: "-1",
            icon: Mail
        })) || [];

        const bulkHistory = summary?.bulkEmailHistory?.map(item => ({
            id: item.bulk_id,
            date: new Date(item.created_at).toLocaleDateString(),
            type: "Sanitization",
            file: `Bulk (${item.total} emails)`,
            status: "Completed",
            used: `-${item.total.toLocaleString()}`,
            icon: ShieldCheck
        })) || [];

        const paymentHistory = payments.map(item => ({
            id: item.id,
            date: new Date(item.payment_date).toLocaleDateString(),
            type: "Credit Purchase",
            file: item.transaction_id,
            status: "Completed",
            used: `+${item.credits_added.toLocaleString()}`,
            icon: CreditCard
        }));

        return [...singleHistory, ...bulkHistory, ...paymentHistory].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [summary?.singleEmail, summary?.bulkEmailHistory, payments]);

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case "completed": return "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30";
            case "failed": return "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30";
            case "processing": return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30";
            case "queued": return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
            default: return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
                <Sidebar />
                <Topbar />
                <main className="ml-64 pt-20 p-8 flex flex-col items-center justify-center min-h-[80vh]">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
                    <p className="text-gray-400 dark:text-gray-500 font-medium font-mono">Loading History Data...</p>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
                <Sidebar />
                <Topbar />
                <main className="ml-64 pt-20 p-8 flex items-center justify-center min-h-[80vh]">
                    <Card className="p-12 text-center text-red-500 border-red-100 dark:border-red-900/20 bg-red-50 dark:bg-red-900/10 max-w-md">
                        <p className="font-bold text-lg mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()} variant="primary">
                            Retry
                        </Button>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-[#fafafa] dark:bg-gray-950 min-h-screen transition-colors duration-300">
            <Sidebar />
            <Topbar />

            <main className="ml-64 pt-28 p-8 max-w-7xl mx-auto space-y-8">
                <HeaderSection />

                {/* Horizontal Credit Balance Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6 flex-1">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                                <CreditCard className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Available Credits</h2>
                                <div className="text-4xl font-black text-gray-900 dark:text-gray-100 leading-none">
                                    {summary?.total_credits?.toLocaleString() ?? 0}
                                    <span className="text-sm text-gray-400 dark:text-gray-500 font-bold ml-2">CR</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-16 w-px bg-gray-100 dark:bg-gray-800 hidden md:block" />

                        <div className="flex-1 flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Total Validated</h3>
                                <span className="text-3xl font-black text-gray-900 dark:text-gray-100">{summary?.totalEmail?.toLocaleString() ?? 0}</span>
                            </div>
                            <div className="h-16 w-16">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={20}
                                            outerRadius={30}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            <Button
                                className="bg-gray-900 dark:bg-gray-800 border-gray-900 dark:border-gray-700 py-3 px-6 font-black tracking-widest uppercase text-xs"
                                onClick={() => navigate('/pricing')}
                            >
                                Refill Balance
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Campaign History Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            Campaign History
                        </h2>
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
                </section>


                {/* Processing History Table */}
                <div className="space-y-6">
                    <HistoryTable history={processingHistory} />
                </div>

                <Footer />
            </main>
        </div>
    );
}

// Sub-components for cleaner render method
const HeaderSection = () => (
    <div className="mb-0 flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <History className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                History & Reports
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track your usage and credit consumption over time.</p>
        </div>
    </div>
);

const HistoryTable = ({ history }: { history: any[] }) => (
    <section>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Email Processing History</h2>
            <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">Last 20 records</span>
        </div>

        <Card className="overflow-hidden p-0 border-none shadow-sm bg-white dark:bg-gray-900 rounded-2xl transition-colors duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#fafbfc] dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-black border-b border-gray-100 dark:border-gray-700 text-[10px] uppercase tracking-widest">
                        <tr>
                            <th className="px-8 py-5">Date</th>
                            <th className="px-8 py-5">Activity Type</th>
                            <th className="px-8 py-5">Record Detail</th>
                            <th className="px-8 py-5 text-center">Status</th>
                            <th className="px-8 py-5 text-right">Usage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                        {history.length > 0 ? (
                            history.map((row, idx) => {
                                const Icon = row.icon;
                                return (
                                    <tr key={idx} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-colors">
                                        <td className="px-8 py-5 whitespace-nowrap text-gray-400 dark:text-gray-500 text-xs">{row.date}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="font-bold text-gray-800 dark:text-gray-200">{row.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs truncate max-w-[150px] inline-block font-mono text-gray-400 dark:text-gray-500">{row.file}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <StatusBadge status={row.status} />
                                        </td>
                                        <td className={`px-8 py-5 text-right font-black text-xs ${row.used.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                            {row.used}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic">
                                    No email processing history found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    </section>
);

const StatusBadge = ({ status }: { status: string }) => {
    let classes = 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700';
    let label = status;

    if (['Deliverable', 'Completed', 'Valid'].includes(status)) {
        classes = 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30';
    } else if (status === 'risky') {
        classes = 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30';
    } else if (['undeliverable', 'Rejected'].includes(status)) {
        classes = 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/30';
        label = status === 'undeliverable' ? 'Rejected' : status;
    }

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${classes}`}>
            {label}
        </span>
    );
};

const Footer = () => (
    <footer className="mt-12 pt-8 border-t dark:border-gray-800 flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 pb-8 uppercase font-black tracking-widest transition-colors duration-300">
        <p>© 2026 MailFlow. Premium Email Validation.</p>
        <div className="flex gap-8">
            <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy</span>
            <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms</span>
        </div>
    </footer>
);
