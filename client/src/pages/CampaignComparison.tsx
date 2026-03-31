import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { fetchMyCampaigns, fetchUserCampaignDetails, extractUnopenedNumbers, type UserCampaignListResponse, type UserCampaignDetailResponse } from "../api/campaign";
import { Mail, CloudUpload, MailOpen, AlertCircle, ListFilter, Download, FileUp } from "lucide-react";
import { useNotification } from "../context/NotificationContext";

export default function CampaignComparison() {
    const { addToast } = useNotification();
    const [campaigns, setCampaigns] = useState<UserCampaignListResponse['campaigns']>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [campaignDetails, setCampaignDetails] = useState<UserCampaignDetailResponse | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // File upload state
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [comparisonResult, setComparisonResult] = useState<{ email: string; contact: string }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        setLoadingCampaigns(true);
        try {
            const data = await fetchMyCampaigns();
            setCampaigns(data.campaigns);
        } catch (error) {
            console.error("Failed to fetch campaigns", error);
            addToast("error", "Failed to load campaigns.");
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const handleSelectCampaign = async (jobId: string) => {
        setSelectedCampaignId(jobId);
        setLoadingDetails(true);
        try {
            const data = await fetchUserCampaignDetails(jobId);
            setCampaignDetails(data);
            // Re-run comparison if file already uploaded
            if (selectedFile) {
                processExtraction(jobId, selectedFile);
            }
        } catch (error) {
            console.error("Failed to fetch campaign details", error);
            addToast("error", "Failed to load campaign details.");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setSelectedFile(file);
        
        if (selectedCampaignId) {
            await processExtraction(selectedCampaignId, file);
        } else {
            addToast("info", "File selected. Please select a campaign to extract numbers.");
        }
    };

    const processExtraction = async (jobId: string, file: File) => {
        if (!file) return;
        setIsExtracting(true);
        setComparisonResult([]);
        try {
            const result = await extractUnopenedNumbers(jobId, file);
            if (result.success && result.data) {
                setComparisonResult(result.data);
                addToast("success", `Extracted ${result.data.length} contacts for unopened emails.`);
            } else {
                addToast("error", result.message || "Failed to extract contacts.");
            }
        } catch (error) {
            addToast("error", "An error occurred during extraction.");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleDownloadCSV = () => {
        if (comparisonResult.length === 0) return;
        const csvContent = "Email,Contact\n" + comparisonResult.map(r => `${r.email},${r.contact || ''}`).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `unopened_comparison_from_${fileName?.split('.')[0] || 'uploaded'}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

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

    return (
        <div className="bg-[#fafafa] dark:bg-gray-950 min-h-screen transition-colors duration-300">
            <Sidebar />
            <Topbar />

            <main className="ml-64 pt-28 p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <ListFilter className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            Campaign Comparison
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Compare your custom lists against your campaign's unopened emails.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Left Column: Campaign Selection */}
                    <div className="space-y-6">
                        <Card className="flex flex-col">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> 1. Select Campaign
                            </h3>

                            {loadingCampaigns ? (
                                <div className="py-8 text-center text-gray-400 font-medium text-sm">Loading campaigns...</div>
                            ) : campaigns.length === 0 ? (
                                <div className="py-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <h4 className="text-gray-900 dark:text-gray-100 font-bold text-sm">No campaigns found</h4>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {campaigns.map((camp) => (
                                        <div
                                            key={camp.jobId}
                                            onClick={() => handleSelectCampaign(camp.jobId)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedCampaignId === camp.jobId
                                                ? "bg-blue-50/50 dark:bg-blue-900/20 border-blue-500 shadow-sm shadow-blue-100 dark:shadow-none"
                                                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 text-sm">{camp.fileName}</h4>
                                                    <p className="text-xs text-gray-500 font-mono mt-0.5">{new Date(camp.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[10px] font-black rounded border uppercase ${getStatusStyles(camp.jobStatus)}`}>
                                                    {camp.jobStatus}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {camp.totalEmails}</span>
                                                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"><MailOpen className="w-3.5 h-3.5" /> {camp.stats?.opened || 0} Open</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Selected Campaign Summary */}
                        {loadingDetails ? (
                            <Card className="py-8 text-center text-gray-400 font-medium text-sm">Loading details...</Card>
                        ) : campaignDetails && (
                            <Card className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-900/10 border-blue-100 dark:border-blue-900/30">
                                <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-6">
                                    Selected Campaign Stats
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm font-medium border-b border-gray-100 dark:border-gray-800 pb-3">
                                        <span className="text-gray-500 font-bold">Total Emails</span>
                                        <span className="text-gray-900 dark:text-gray-100 text-lg font-black">{campaignDetails.totalEmails}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium border-b border-gray-100 dark:border-gray-800 pb-3">
                                        <span className="text-gray-500 font-bold">Opened</span>
                                        <span className="text-blue-600 dark:text-blue-400 text-lg font-black">{campaignDetails.emails.filter(e => e.opened).length}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium pb-2">
                                        <span className="text-gray-500 font-bold">Unopened</span>
                                        <span className="text-gray-900 dark:text-gray-100 text-lg font-black">{campaignDetails.totalEmails - campaignDetails.emails.filter(e => e.opened).length}</span>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: File Upload & Results */}
                    <div className="space-y-6">
                        <Card className={`border-dashed border-2 hover:border-blue-600 dark:hover:border-blue-400 transition-all ${!selectedCampaignId ? 'opacity-50 pointer-events-none' : 'border-gray-200 dark:border-gray-800'}`}>
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2">
                                <CloudUpload className="w-4 h-4" /> 2. Upload Comparison List
                            </h3>
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-600 dark:hover:border-blue-400 transition-all">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept=".csv,.txt"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-4">
                                    <FileUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-gray-700 dark:text-gray-200 font-bold text-center">Click to choose file</span>
                                <span className="text-sm text-gray-400 dark:text-gray-500 mt-1">TXT or CSV file</span>
                                {fileName && (
                                    <span className="mt-4 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl text-sm text-green-700 dark:text-green-400 font-bold line-clamp-1 max-w-[250px] text-center">
                                        {fileName}
                                    </span>
                                )}
                            </label>

                            {isExtracting && (
                                <div className="mt-4 text-center text-sm font-bold text-gray-500">
                                    Extracting data...
                                </div>
                            )}
                        </Card>

                        {/* Comparison Results */}
                        {selectedFile && campaignDetails && (
                            <Card className="flex flex-col h-full min-h-[400px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> 3. Match Results
                                    </h3>
                                    {comparisonResult.length > 0 && (
                                        <Button
                                            variant="secondary"
                                            onClick={handleDownloadCSV}
                                            className="flex items-center gap-2 h-8 text-xs px-3"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Export
                                        </Button>
                                    )}
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 mb-4">
                                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                                        <span className="text-blue-600 dark:text-blue-400 text-lg mr-1">{comparisonResult.length}</span>
                                        extracted contacts for emails that did <span className="uppercase underline">not</span> open the campaign.
                                    </p>
                                </div>

                                <div className="flex-1 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-[#fafbfc] dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 sticky top-0">
                                            <tr>
                                                <th className="px-5 py-3">Unopened Email Address</th>
                                                <th className="px-5 py-3 text-right">Contact Number</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800 block overflow-y-auto max-h-[300px] w-full" style={{ display: 'table-row-group' }}>
                                            {comparisonResult.length === 0 ? (
                                                <tr>
                                                    <td colSpan={2} className="px-5 py-10 text-center text-gray-400 font-medium">No matches found.</td>
                                                </tr>
                                            ) : (
                                                comparisonResult.map((res, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-200">
                                                            {res.email}
                                                        </td>
                                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-200 text-right">
                                                            {res.contact}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
