import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
// import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useNotification } from "../context/NotificationContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { uploadBulkEmails, type BulkValidationResponse, type RawBulkResult } from "../api/bulkEmail";
import { CloudUpload, Download, Send, ShieldCheck, Mail, Search, ChevronRight, ChevronDown, Package } from "lucide-react";
import { CircularLoader } from "../components/ui/CircularLoader";
import { useTheme } from "../context/ThemeContext";
import { getBulkDetails } from "../api/batch";
/* -------------------- Types -------------------- */
import { BatchDisplay } from "../components/BatchDisplay";
type EmailStatus = "deliverable" | "risky" | "undeliverable";

type SanitizedEmail = {
  email: string;
  status: EmailStatus;
  score: number;
  reason: string;
  duration?: number;
};

/* -------------------- Compute Status -------------------- */
const mapRawToSanitized = (raw: RawBulkResult): SanitizedEmail => {
  const { results, confidence } = raw;

  let status: EmailStatus = "undeliverable";
  let score = 0;
  let reason = "Verified";

  if (confidence === "High") {
    status = "deliverable";
    score = 90;
    reason = "Safe to send";
  } else if (confidence === "Medium") {
    status = "risky";
    score = 70;
    // Collect all negative reasons
    const reasons = Object.values(results)
      .filter(r => r.reason)
      .map(r => r.reason);
    reason = reasons.length > 0 ? reasons.join("\n") : "Risky email";
  } else {
    status = "undeliverable";
    score = 0;
    // Collect all negative reasons
    const reasons = Object.values(results)
      .filter(r => r.reason)
      .map(r => r.reason);
    reason = reasons.length > 0 ? reasons.join("\n") : "Mailbox does not exist";
  }

  return { email: raw.email, status, score, reason };
};

const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed": return "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30";
    case "failed": return "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30";
    case "processing": return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30";
    case "queued": return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    default: return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
};

/* -------------------- Pie Chart Colors -------------------- */
const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export default function EmailSanitizerBulkPage() {
  const { theme } = useTheme();
  const { addNotification, addToast } = useNotification();
  const { refreshData, summary: globalSummary } = useData();
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<SanitizedEmail[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    deliverable: 0,
    risky: 0,
    undeliverable: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportOption, setExportOption] = useState<'high' | 'merged'>('high');
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Sanitizing list...");

  // Refs for scrolling
  const resultsRef = useRef<HTMLDivElement>(null);
  const batchesRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const campaigns = globalSummary?.bulkEmailHistory || [];
  const loadingCampaigns = !globalSummary;
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isBatchesExpanded, setIsBatchesExpanded] = useState(false);

  useEffect(() => {
    // Data is automatically fetched by DataContext
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setSelectedFile(file);
    setError(null);
    setResults([]);
    setSummary({ total: 0, deliverable: 0, risky: 0, undeliverable: 0 });

    setSummary({ total: 0, deliverable: 0, risky: 0, undeliverable: 0 });
  };

  const processResults = async (data: BulkValidationResponse) => {
    const allRawResults = [
      ...data.results.highConfidenceEmails,
      ...data.results.mediumConfidenceEmails,
      ...data.results.lowConfidenceEmails,
    ];

    const mapped = allRawResults.map(mapRawToSanitized);

    setResults(mapped);
    setSummary({
      total: data.total_emails,
      deliverable: data.summary.high,
      risky: data.summary.medium,
      undeliverable: data.summary.low,
    });

    await refreshData(); // Refresh the campaign history list after a new file is uploaded
    setLoading(false);
    setProgress(0);

    // Auto-scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    addNotification("success", `Processed ${data.total_emails} emails successfully.`);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      addToast("error", "Please select a file first.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);

    // Initial smooth progress

    // Status rotation messages
    const messages = [
      "Sanitizing list...",
      "Validating emails...",
      "Checking formats...",
      "Verifying domains...",
      "Processing...",
      "Almost done..."
    ];

    let messageIdx = 0;
    setStatusMessage(messages[0]);

    const statusInterval = setInterval(() => {
      messageIdx = (messageIdx + 1) % messages.length;
      setStatusMessage(messages[messageIdx]);
    }, 2000);

    // Progress Simulation
    let simulatedProgress = 0;
    let isFetched = false;
    let fetchResult: BulkValidationResponse | null = null;

    const runProgressSimulation = () => {
      if (simulatedProgress >= 100) return;

      let delay = 2000;
      let increment = 1;

      if (isFetched) {
        // Accelerate to 100% if data is fetched
        delay = 500;
        increment = 2; // Fixed increment to show fast move to 100
      } else {
        if (simulatedProgress < 50) {
          delay = 2000;
        } else if (simulatedProgress < 75) {
          delay = 3500;
        } else if (simulatedProgress < 90) {
          delay = 4500;
        } else {
          delay = 5000;
        }

        // Slow crawl from 95 to 100 if not fetched
        if (simulatedProgress >= 95) {
          delay = 10000; // Even slower
        }
      }

      simulatedProgress = Math.min(100, simulatedProgress + increment);
      setProgress(simulatedProgress);

      if (simulatedProgress < 100) {
        setTimeout(runProgressSimulation, delay);
      } else if (isFetched && fetchResult) {
        // We reached 100 and have data, finish up
        clearInterval(statusInterval);
        setStatusMessage("Validation Complete!");
        setTimeout(() => processResults(fetchResult!), 600);
      }
    };

    runProgressSimulation();

    try {
      fetchResult = await uploadBulkEmails(selectedFile);
      isFetched = true;
      
      // If we happened to be at 100 already (though unlikely with these delays)
      if (simulatedProgress >= 100) {
        clearInterval(statusInterval);
        setStatusMessage("Validation Complete!");
        processResults(fetchResult);
      }

    } catch (err: any) {
      isFetched = false;
      setLoading(false);
      setProgress(0);
      clearInterval(statusInterval);
      const msg = err.message || "Failed to process file";
      setError(msg);
      addToast("error", msg);
    }
  };

  const downloadCSV = (type: 'high' | 'merged') => {
    if (results.length === 0) return;

    let filtered: SanitizedEmail[] = [];
    let nameSuffix = "";

    if (type === 'high') {
      filtered = results.filter(e => e.status === "deliverable");
      nameSuffix = "high_confidence";
    } else {
      filtered = results;
      nameSuffix = "sanitized_list";
    }

    if (filtered.length === 0) {
      addToast("warning", "No emails found for this selection.");
      return;
    }

    let csvContent = "";

    if (type === 'merged') {
      const deliverable = filtered.filter(e => e.status === 'deliverable');
      const risky = filtered.filter(e => e.status === 'risky');
      const undeliverable = filtered.filter(e => e.status === 'undeliverable');

      // Summary Section
      csvContent += `Total: ${filtered.length}\n`;
      csvContent += `Deliverable: ${deliverable.length}\n`;
      csvContent += `Risky: ${risky.length}\n`;
      csvContent += `Undeliverable: ${undeliverable.length}\n\n`;

      // Deliverable Section
      if (deliverable.length > 0) {
        csvContent += `Deliverable (${deliverable.length}):\n`;
        deliverable.forEach((e, i) => {
          csvContent += `${i + 1}. ${e.email}\n`;
        });
        csvContent += "\n";
      }

      // Risky Section
      if (risky.length > 0) {
        csvContent += `Risky (${risky.length}):\n`;
        risky.forEach((e, i) => {
          csvContent += `${i + 1}. ${e.email}\n`;
        });
        csvContent += "\n";
      }

      // Undeliverable Section
      if (undeliverable.length > 0) {
        csvContent += `Undeliverable (${undeliverable.length}):\n`;
        undeliverable.forEach((e, i) => {
          csvContent += `${i + 1}. ${e.email}\n`;
        });
      }

      csvContent = csvContent.trim();
    } else {
      csvContent = filtered.map(e => e.email).join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName?.split('.')[0] || 'emails'}_${nameSuffix}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("success", "Download started");
  };

  const pieData = [
    { name: "Deliverable", value: summary.deliverable },
    { name: "Risky", value: summary.risky },
    { name: "Undeliverable", value: summary.undeliverable },
  ];

  // If no data, show skeleton data for pie chart
  const isSkeleton = summary.total === 0;
  const displayPieData = isSkeleton
    ? [{ name: "Pending", value: 100 }]
    : pieData;

  return (
    <div className="bg-[#fafafa] dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <Topbar />

      <main className="ml-64 pt-20 p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Bulk Email Sanitizer
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Upload your email list to validate and clean it for deliverability.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsBatchesExpanded(true);
                setTimeout(() => scrollToSection(batchesRef), 50);
              }}
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Saved Batch
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsHistoryExpanded(true);
                setTimeout(() => scrollToSection(historyRef), 50);
              }}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              History
            </Button>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="border-dashed border-2 border-gray-200 dark:border-gray-800 hover:border-blue-600 dark:hover:border-blue-400 transition-all">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">Upload Email File</h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CircularLoader
                progress={Math.round(progress)}
                text={statusMessage}
              />
            </div>
          ) : (
            <>
              <label className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-12 cursor-pointer transition-all ${loading ? 'opacity-50 pointer-events-none' : 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-600 dark:hover:border-blue-400'}`}>
                <input
                  type="file"
                  accept=".csv,.xlsx,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-4">
                  <CloudUpload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-200 font-bold">{loading ? "Processing..." : "Click to choose file or drag & drop"}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 mt-1">CSV, Excel (.xlsx), or TXT file</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">Format: name, email, phone (or just email)</span>
                {fileName && <span className="mt-4 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl text-sm text-green-700 dark:text-green-400 font-bold">{fileName}</span>}
              </label>

              {fileName && !loading && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleUpload}
                    className="flex items-center gap-2 whitespace-nowrap px-8"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Sanitize List</span>
                  </Button>
                </div>

              )}
            </>
          )}

          {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400 font-bold text-center">{error}</p>}
        </Card>



        {/* Summary + Chart */}
        <div ref={resultsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Summary */}
          <Card className="flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">
                Sanitization Summary
              </h3>

              <div className="space-y text-sm">
                {/* Total */}
                <div className="grid grid-cols-2 items-end border-b border-gray-50 dark:border-gray-800 pb-4">
                  <span className="text-gray-600 dark:text-gray-400 font-semibold text-lg">
                    Total Emails
                  </span>
                  <span className="text-right font-black text-gray-900 dark:text-gray-100 text-3xl">
                    {summary.total.toLocaleString()}
                  </span>
                </div>

                {/* Deliverable */}
                <div className="grid grid-cols-2 items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400 text-base font-semibold">
                    Deliverable (High)
                  </span>
                  <div className="flex items-center justify-end gap-3">
                    <span className="w-4 h-4 rounded-full bg-green-500 shadow-sm shadow-green-200 dark:shadow-none" />
                    <span className="text-green-600 dark:text-green-400 text-2xl font-black">
                      {summary.deliverable.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Risky */}
                <div className="grid grid-cols-2 items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400 text-base font-semibold">
                    Risky (Medium)
                  </span>
                  <div className="flex items-center justify-end gap-3">
                    <span className="w-4 h-4 rounded-full bg-orange-400 shadow-sm shadow-orange-200 dark:shadow-none" />
                    <span className="text-orange-600 dark:text-orange-400 text-2xl font-black">
                      {summary.risky.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Undeliverable */}
                <div className="grid grid-cols-2 items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400 text-base font-semibold">
                    Undeliverable (Low)
                  </span>
                  <div className="flex items-center justify-end gap-3">
                    <span className="w-4 h-4 rounded-full bg-red-500 shadow-sm shadow-red-200 dark:shadow-none" />
                    <span className="text-red-600 dark:text-red-400 text-2xl font-black">
                      {summary.undeliverable.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Center Center */}
            <div className="mt-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">
                Action Center
              </h3>

              <div className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                  Select Export Type
                </p>

                {/* Option: High */}
                <label className="flex items-start gap-4 cursor-pointer group p-3 rounded-xl hover:bg-white dark:hover:bg-gray-900 transition">
                  <input
                    type="radio"
                    name="exportType"
                    checked={exportOption === "high"}
                    onChange={() => setExportOption("high")}
                    className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-600 border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      Deliver Only
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Export only 100% safe emails
                    </p>
                  </div>
                </label>

                {/* Option: Merged */}
                <label className="flex items-start gap-4 cursor-pointer group p-3 rounded-xl hover:bg-white dark:hover:bg-gray-900 transition">
                  <input
                    type="radio"
                    name="exportType"
                    checked={exportOption === "merged"}
                    onChange={() => setExportOption("merged")}
                    className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-600 border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      Merged List (Deliverable + Risky + Undeliverable)
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Export safe and risky emails
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={() => downloadCSV(exportOption)}
                  disabled={results.length === 0 || loading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </Button>

                <Button
                  onClick={() => {
                    const filtered =
                      exportOption === "high"
                        ? results.filter(e => e.status === "deliverable")
                        : results.filter(
                          e => e.status === "deliverable" || e.status === "risky"
                        )

                    if (!filtered.length) {
                      addToast("warning", "No emails to send.");
                      return
                    }

                    navigate("/campaigns", {
                      state: {
                        emails: filtered.map(e => e.email),
                        source: "bulk-sanitizer",
                        count: filtered.length
                      }
                    })
                  }}
                  variant="secondary"
                  disabled={results.length === 0 || loading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send to Campaign
                </Button>
              </div>
            </div>
          </Card>


          {/* Pie Chart Chart */}
          <Card className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">Email Quality Distribution</h3>
            <div className="flex-1 w-full min-h-[350px] flex items-center justify-center relative">
              {isSkeleton && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <p className="text-gray-400 dark:text-gray-500 font-bold bg-white/80 dark:bg-gray-900/80 px-4 py-2 rounded-xl backdrop-blur-sm">Waiting for upload...</p>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%" minHeight={350}>
                <PieChart>
                  <Pie
                    data={displayPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={isSkeleton ? 0 : 5}
                    labelLine={false}
                    label={({ percent }: any) => !isSkeleton && percent > 0 ? `${(percent * 100).toFixed(0)}%` : ""}
                    stroke="none"
                  >
                    {displayPieData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={isSkeleton ? (theme === 'dark' ? "#1f2937" : "#f1f5f9") : COLORS[index]}
                      />
                    ))}
                  </Pie>
                  {!isSkeleton && (
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#111827' : '#111827',
                        borderRadius: '12px',
                        border: theme === 'dark' ? '1px solid #1f2937' : 'none',
                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                        fontWeight: 700
                      }}
                      itemStyle={{ color: '#ffffff' }}
                    />
                  )}
                  {!isSkeleton && <Legend verticalAlign="bottom" height={36} />}
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        {/* Email Results Table Table */}
        <Card>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">Email Results</h3>
          <div className="overflow-x-auto max-h-[500px] rounded-xl border border-gray-100 dark:border-gray-800 transition-colors duration-300">
            <table className="w-full text-sm">
              <thead className="bg-[#fafbfc] dark:bg-gray-800 sticky top-0">
                <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  <th className="text-left px-6 py-5">Email</th>
                  <th className="text-center px-6 py-5">Status</th>
                  <th className="text-center px-6 py-5">Score</th>
                  <th className="text-left px-6 py-5">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {results.length === 0 && !loading && !loadingDetails && (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-gray-400 italic">
                      Upload a file to see results.
                    </td>
                  </tr>
                )}
                {(loading || loadingDetails) && (
                  <tr>
                    <td colSpan={4} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-gray-600 dark:text-gray-400 font-bold">
                          {loadingDetails ? "Fetching detailed results..." : "Processing your list..."}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
                {results.map((item, idx) => {
                  let statusLabel = "Medium";
                  let statusColor = "bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/20";

                  if (item.status === "deliverable") {
                    statusLabel = "High";
                    statusColor = "bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/20";
                  } else if (item.status === "undeliverable") {
                    statusLabel = "Low";
                    statusColor = "bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/20";
                  }

                  return (
                    <tr key={`${item.email}-${idx}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 break-all font-bold text-gray-800 dark:text-gray-200">{item.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-gray-700 dark:text-gray-300">{item.score}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-pre-line">{item.reason || "Verified"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        {/* Saved Batches Section */}
        <section ref={batchesRef} className="mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div
            className="p-6 cursor-pointer flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            onClick={() => setIsBatchesExpanded(!isBatchesExpanded)}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Saved Batches
            </h2>
            <div className="flex items-center gap-4">
              {isBatchesExpanded ? <ChevronDown className="w-6 h-6 text-gray-400" /> : <ChevronRight className="w-6 h-6 text-gray-400" />}
            </div>
          </div>

          {isBatchesExpanded && (
            <div className="p-6 pt-0">
              <BatchDisplay />
            </div>
          )}
        </section>
        {/* Campaign History Section */}
        <section ref={historyRef} className="mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div
            className="p-6 cursor-pointer flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Bulk Email Campaign History
            </h2>
            <div className="flex items-center gap-4">
              {!isHistoryExpanded && !loadingCampaigns && (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:inline-block">
                  {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total {campaigns.length > 0 ? `(Latest: ${new Date(campaigns[0].created_at).toLocaleDateString()})` : ''}
                </span>
              )}
              {isHistoryExpanded ? <ChevronDown className="w-6 h-6 text-gray-400" /> : <ChevronRight className="w-6 h-6 text-gray-400" />}
            </div>
          </div>

          {isHistoryExpanded && (
            <div className="p-6 pt-0 space-y-4">
              {loadingCampaigns ? (
                <div className="py-8 text-center text-gray-400">Loading campaigns...</div>
              ) : campaigns.length === 0 ? (
                <Card className="py-12 text-center flex flex-col items-center border border-gray-200 dark:border-gray-800 shadow-none">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                  </div>
                  <h4 className="text-gray-900 dark:text-gray-100 font-bold text-sm">No campaigns found</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your recent campaigns will appear here.</p>
                </Card>
              ) : (
                campaigns.slice(0, 5).map((camp) => (
                  <div
                    key={camp.bulk_id}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700"
                    onClick={async () => {
                      setSummary({
                        total: camp.total,
                        deliverable: camp.deliverable,
                        risky: camp.risky,
                        undeliverable: camp.undeliverable,
                      });
                      setResults([]);
                      setLoadingDetails(true);
                      setTimeout(() => {
                        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);

                      try {
                        const detailsData = await getBulkDetails(camp.bulk_id);
                        if (detailsData.success) {
                          // Maps directly to SanitizedEmail format
                          setResults(detailsData.results as unknown as SanitizedEmail[]);
                          addToast("info", "Loaded campaign validation results");
                        }
                      } catch (err) {
                        addToast("error", "Failed to load detailed email results");
                      } finally {
                        setLoadingDetails(false);
                      }
                    }}
                  >
                    <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight">
                            Campaign {new Date(camp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                            <span className="font-mono">{new Date(camp.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 justify-between md:justify-end w-full md:w-auto">
                        <div className="text-right min-w-[80px]">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Emails</p>
                          <p className="text-xl font-black text-blue-600 dark:text-blue-500">{camp.total.toLocaleString()}</p>
                        </div>

                        <div className="flex flex-col items-end min-w-[100px] gap-2">
                          <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider ${getStatusStyles('completed')}`}>
                            Completed
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        <footer className="text-center text-xs text-gray-400 dark:text-gray-500 pt-8 uppercase font-black tracking-widest">
          © 2026 MailFlow. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
