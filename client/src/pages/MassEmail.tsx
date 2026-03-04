import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CloudUpload, Send, Mail, User, FileText, Eye, Edit3, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useNotification } from "../context/NotificationContext";
import { BatchDisplay } from "../components/BatchDisplay";
import type { Batch } from "../api/batch";
import { Package, Loader2, X } from "lucide-react";
import { createCampaign } from "../api/campaign";
import { fetchTemplates, type Template } from "../api/template";

export default function MassEmail() {
    const { summary, refreshData } = useData();
    const { user } = useAuth();
    const { addNotification, addToast } = useNotification();
    const credits = summary?.massMalingCredits ?? 0;
    const location = useLocation();

    const [selectedSource, setSelectedSource] = useState<'file' | 'batch' | null>(null);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

    const [fileName, setFileName] = useState<string | null>(null);
    const [fileEmails, setFileEmails] = useState<string[]>([]);
    const [emailCount, setEmailCount] = useState<number>(0);
    const [sending, setSending] = useState(false);

    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const data = await fetchTemplates();
                setTemplates(data);
            } catch (err) {
                console.error("Failed to fetch templates:", err);
            }
        }
        loadTemplates();
    }, []);

    // Initial load from navigation state
    useEffect(() => {
        if (location.state?.source === "bulk-sanitizer") {
            setFileName(`Imported from Sanitizer`);
            setEmailCount(location.state.count);
            setSelectedSource('file');
            // Note: We don't have the actual File object here if it was passed via state from another route unless we store it in context or re-fetch.
            // For this specific flow, maybe we just assume it's 'pre-loaded' or we treat it as a special case.
            // But user requirement says: "From their device (local file), or From the previously created batch."
            // So we focus on those two.
        }
    }, [location.state]);

    const handleBatchSelect = (batch: Batch) => {
        setSelectedBatch(batch);
        setSelectedSource('batch');
        setFileName(null);
        setFileEmails([]);
        setEmailCount(batch.emails.length);
    };

    const handleClearBatch = () => {
        setSelectedBatch(null);
        if (selectedSource === 'batch') {
            setSelectedSource(null);
            setEmailCount(0);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFileName(selected.name);
            setSelectedSource('file');
            setSelectedBatch(null);

            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                // Basic extraction of non-empty lines as emails
                const lines = text.split(/\r\n|\n/).map(line => line.trim()).filter(line => line !== '');
                setFileEmails(lines);
                setEmailCount(lines.length);
            };
            reader.readAsText(selected);
        }
    };

    const handleSendCampaign = async () => {
        if (!selectedSource) {
            addToast("error", "Please select an email source (File or Batch)");
            return;
        }

        if (!fromName || !subject || !senderEmail || (!emailContent && !selectedTemplateId)) {
            addToast("error", "Please fill in all campaign details and content");
            return;
        }

        setSending(true);

        if (user?.plan === "Basic") {
            addToast("warning", "Please upgrade to Standard or Premium to use Mass Email Campaigns.");
            setSending(false);
            return;
        }

        if (emailCount > credits) {
            addToast("error", `Insufficient mass mailing credits. You need ${emailCount} but have ${credits}.`);
            setSending(false);
            return;
        }

        const campaignData = {
            source: selectedSource,
            batchId: selectedSource === 'batch' ? selectedBatch?._id : undefined,
            fileName: selectedSource === 'file' ? fileName || "Unknown File" : undefined,
            emails: selectedSource === 'file' ? fileEmails : undefined,
            totalEmails: emailCount,
            templateId: selectedTemplateId || undefined,
            content: {
                subject,
                body: selectedTemplateId ? "TEMPLATE_PLACEHOLDER" : emailContent,
                sender: `${fromName} <${senderEmail}>`
            }
        };

        const result = await createCampaign(campaignData);

        setSending(false);

        if (result.success) {
            addNotification("success", "Campaign created successfully! Emails are being queued.");
            await refreshData();
            // Reset logic could go here
        } else {
            addToast("error", "Failed to create campaign: " + result.message);
        }
    };

    const [fromName, setFromName] = useState("");
    const [subject, setSubject] = useState("");
    const [senderEmail, setSenderEmail] = useState("");
    const [emailContent, setEmailContent] = useState(`Hello {{first_name}},

We have an exciting announcement to share with you! Stay tuned for more details.

Best regards,
The MailFlow Team`);

    const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

    return (
        <div className="bg-[#fafafa] dark:bg-gray-950 min-h-screen transition-colors duration-300">
            <Sidebar />
            <Topbar />

            <main className="ml-64 pt-20 p-8 space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <Send className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        Mass Email Campaign
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Configure your campaign, draft your email, and send to your verified lists.
                    </p>
                </div>

                <BatchDisplay
                    onSelect={handleBatchSelect}
                    selectedBatchId={selectedBatch?._id}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT COLUMN: Campaign Details */}
                    <div className="space-y-6">
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Email List & Details</h2>

                        {/* Drag & Drop Area */}
                        {/* Drag & Drop Area */}
                        <Card className={`border-dashed border-2 border-gray-200 dark:border-gray-800 transition-all cursor-pointer ${selectedSource === 'batch' ? 'p-4 border-none bg-transparent' : 'hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 p-8 flex flex-col items-center justify-center text-center'}`}>
                            <label className={`w-full h-full flex flex-col items-center justify-center cursor-pointer ${selectedSource === 'batch' ? 'cursor-default' : ''}`}>
                                {selectedSource !== 'batch' && (
                                    <>
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-4">
                                            <CloudUpload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-200 font-bold mb-1">
                                            Drag & drop your email list here
                                        </p>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">or click to browse files</p>
                                        {selectedSource === 'file' && fileName && (
                                            <div className="mb-4">
                                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold">
                                                    Selected File
                                                </span>
                                            </div>
                                        )}
                                        <div className="mt-2 text-center space-y-2">
                                            <span className="inline-block bg-blue-600 text-white rounded-xl px-6 py-3 text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-colors hover:bg-blue-700">
                                                Browse Files
                                            </span>
                                        </div>
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx,.txt"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </>
                                )}

                                {selectedSource === 'file' && fileName && (
                                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-xl flex items-center gap-3 w-full">
                                        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                                        <div className="text-left">
                                            <span className="text-sm text-green-700 dark:text-green-300 font-bold block">{fileName}</span>
                                            <span className="text-xs text-green-500 dark:text-green-400">{emailCount} emails found</span>
                                        </div>
                                    </div>
                                )}
                                {selectedSource === 'batch' && selectedBatch && (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl flex items-center gap-3 relative group w-full">
                                        <Package className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                                        <div className="text-left">
                                            <span className="text-sm text-blue-700 dark:text-blue-300 font-bold block">Batch Selected: {selectedBatch.batchName}</span>
                                            <span className="text-xs text-blue-500 dark:text-blue-400">{selectedBatch.emails.length} emails joined</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault(); // Prevent label click
                                                handleClearBatch();
                                            }}
                                            className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 rounded-full p-1 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                                            type="button"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </label>
                        </Card>

                        {/* Campaign Settings */}
                        <div className="space-y-5">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Campaign Settings</h3>

                            <div>
                                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">
                                    From Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-gray-600" />
                                    <input
                                        type="text"
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 pl-12 pr-4 py-4 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                                        value={fromName}
                                        onChange={(e) => setFromName(e.target.value)}
                                        placeholder="MailFlow Team"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">
                                    Subject Line
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-gray-600" />
                                    <input
                                        type="text"
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 pl-12 pr-4 py-4 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Important Update from MailFlow"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">
                                    Sender Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-gray-600" />
                                    <input
                                        type="email"
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 pl-12 pr-4 py-4 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                                        value={senderEmail}
                                        onChange={(e) => setSenderEmail(e.target.value)}
                                        placeholder="noreply@mailflow.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">
                                    Email Template
                                </label>
                                <select
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-4 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                                    value={selectedTemplateId}
                                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                                >
                                    <option value="" className="bg-white dark:bg-gray-900">Custom Blank Template</option>
                                    {templates.map(t => (
                                        <option key={t._id} value={t._id} className="bg-white dark:bg-gray-900">{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Email Content & Preview */}
                    <div className="space-y-6 flex flex-col h-full">
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Email Content & Preview</h2>

                        <Card className="flex-1 flex flex-col p-0 overflow-hidden min-h-[500px] border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                            {/* Tabs */}
                            <div className="border-b border-gray-100 dark:border-gray-800 px-6 flex gap-8 text-sm font-bold text-gray-400 dark:text-gray-500 bg-[#fafbfc] dark:bg-gray-800/50">
                                <button
                                    className={`py-4 border-b-2 transition-colors flex items-center gap-2 ${activeTab === "editor" ? "border-blue-600 text-gray-900 dark:text-gray-100" : "border-transparent hover:text-gray-600 dark:hover:text-gray-300"}`}
                                    onClick={() => setActiveTab("editor")}
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Editor
                                </button>
                                <button
                                    className={`py-4 border-b-2 transition-colors flex items-center gap-2 ${activeTab === "preview" ? "border-blue-600 text-gray-900 dark:text-gray-100" : "border-transparent hover:text-gray-600 dark:hover:text-gray-300"}`}
                                    onClick={() => setActiveTab("preview")}
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="p-6 flex-1 bg-white dark:bg-gray-900">
                                {activeTab === "editor" ? (
                                    selectedTemplateId ? (
                                        <div className="w-full h-full flex items-center justify-center p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                                            <div className="text-center space-y-3">
                                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto">
                                                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <h3 className="text-gray-900 dark:text-gray-100 font-bold">Template Selected</h3>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                                                    You are utilizing a predefined HTML template. The email body content will be dynamically loaded from your cloud storage when sending the campaign. Switch the dropdown to "Custom Blank Template" to type manually.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <textarea
                                            className="w-full h-full p-4 border border-gray-100 dark:border-gray-800 rounded-xl focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20 dark:focus:ring-blue-900/20 focus:outline-none resize-none text-gray-700 dark:text-gray-300 font-mono text-sm bg-gray-50 dark:bg-gray-800"
                                            placeholder="Write your email content here... Support HTML or plain text."
                                            value={emailContent}
                                            onChange={(e) => setEmailContent(e.target.value)}
                                        />
                                    )
                                ) : (
                                    <div className="flex flex-col h-full">
                                        <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">From: <span className="font-bold text-gray-900 dark:text-gray-100">{fromName || "MailFlow Team"}</span> &lt;{senderEmail || "noreply@mailflow.com"}&gt;</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Subject: <span className="font-bold text-gray-900 dark:text-gray-100">{subject || "Important Update from MailFlow"}</span></p>
                                        </div>
                                        <div
                                            className="prose dark:prose-invert max-w-none flex-1 overflow-y-auto text-gray-800 dark:text-gray-200 whitespace-pre-wrap"
                                        >
                                            {emailContent}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Footer Area Area */}
                <Card className="flex items-center justify-between border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                    <div className="w-full max-w-md">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Estimated Mass Mailing Credits for Campaign</p>
                        <div className="flex items-center gap-4">
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, credits > 0 ? ((emailCount || 0) / credits) * 100 : 0)}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">{emailCount.toLocaleString()} / {credits.toLocaleString()}</span>
                        </div>
                    </div>

                    <Button
                        className="flex items-center gap-2"
                        onClick={handleSendCampaign}
                        disabled={sending}
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {sending ? "Sending..." : "Send Campaign"}
                    </Button>
                </Card>

                <footer className="text-center text-xs text-gray-400 dark:text-gray-500 pt-8 uppercase font-black tracking-widest transition-colors duration-300">
                    © 2026 MailFlow. All rights reserved.
                </footer>
            </main>
        </div>
    );
}
