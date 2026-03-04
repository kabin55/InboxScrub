import { useState, useEffect, type FC, type ChangeEvent } from "react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
// import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useNotification } from "../context/NotificationContext";
import { verifySingleEmail, getEmailHistory, clearEmailHistory } from "../api/singleMail";
import {
  Check,
  X,
  Trash2,
  Loader2,
  Mail,
  History,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CircularLoader } from "../components/ui/CircularLoader";

/* -------------------- Layout constants -------------------- */
const SIDEBAR_WIDTH = 256;
const TOPBAR_HEIGHT = 64;

interface HistoryItem {
  _id: string;
  email: string;
  outcome: string;
  confidence: string;
  validated_at: string;
  reason?: string | null;
  validation_details?: any;
}

const SingleEmailPage: FC = () => {
  const { refreshData } = useData();
  const { addNotification, addToast } = useNotification();
  const [email, setEmail] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await getEmailHistory();
      setHistory(data.singleEmail || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  /* -------------------- Validate Email -------------------- */
  const validateEmail = (input: string): boolean => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(input.trim());
  };

  /* -------------------- Handle Verify -------------------- */
  const handleVerify = async (): Promise<void> => {
    setError(null);
    const sanitizedEmail = email.trim();

    if (!validateEmail(sanitizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Phase 1: Rapidly get to 90% in about 5 seconds
        // 100ms interval -> 50 steps. 90 / 50 = 1.8
        if (prev < 90) {
          return prev + 1.8;
        }
        // Phase 2: If backend is invalid/slow, crawl slowly to 99%
        if (prev >= 90 && prev < 99) {
          return prev + 0.05; // Very slow crawl
        }
        return prev;
      });
    }, 100);

    try {
      await verifySingleEmail(sanitizedEmail);
      clearInterval(progressInterval);
      setProgress(100);

      // Wait a moment for 100% to show before resetting
      setTimeout(async () => {
        await refreshData();
        setEmail("");
        await loadHistory();
        setLoading(false);
        setProgress(0);
        addNotification("success", `Successfully verified ${sanitizedEmail}`);
      }, 500);

    } catch (err: unknown) {
      clearInterval(progressInterval);
      setLoading(false);
      const message = err instanceof Error ? err.message : "Verification failed. Try again.";
      setError(message);
      addToast("error", message);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your verification history?")) return;

    try {
      await clearEmailHistory();
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  return (
    <div className="bg-[#fafafa] dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <Sidebar />
      <Topbar />

      <main
        className="p-8 space-y-8"
        style={{ marginLeft: SIDEBAR_WIDTH, paddingTop: TOPBAR_HEIGHT }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Single Email Verification
          </h1>
          <div className="flex gap-4 text-sm font-medium">
            <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Costs 1 Credit</span>
          </div>
        </div>

        {/* Top Section: Input Card and Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Input Card */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center min-h-[300px] transition-colors duration-300">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CircularLoader progress={Math.round(progress)} text="Validating Email..." />
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
                  Enter email address that <span className="font-bold">you want to verify</span>
                </h2>

                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="example@company.com"
                    disabled={loading}
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-gray-700 transition-all text-gray-700 dark:text-gray-200"
                  />

                  <button
                    onClick={() => void handleVerify()}
                    disabled={loading || !email}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-white font-bold px-12 py-4 rounded-xl transition-all flex items-center justify-center min-w-[200px] shadow-md shadow-blue-200 dark:shadow-none active:scale-[0.98]"
                  >
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Verify Email
                  </button>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm mt-4 ml-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 shadow-sm flex flex-col items-center gap-4 relative overflow-hidden h-full justify-center transition-colors duration-300">
            <div className="flex-1 z-10 text-center flex flex-col justify-center">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 leading-snug mb-3">
                Need to verify <span className="font-bold">many emails</span> at once?
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Upload a CSV or Excel file and we'll clean your whole list.</p>
              <button
                onClick={() => window.location.href = '/bulk-email'}
                className="w-full px-6 py-3 bg-white dark:bg-gray-900 border-2 border-blue-600 dark:border-blue-500 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all"
              >
                Mass Email Sanitizer
              </button>
            </div>
            {/* Soft blob */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600 rounded-full opacity-20 blur-2xl"></div>
          </div>
        </div>

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Recent Validations
            </h2>
            <button
              onClick={() => void handleClearHistory()}
              className="px-6 py-2 border-2 border-red-50 dark:border-red-900/20 text-red-400 dark:text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
            <div className="hidden md:grid grid-cols-12 gap-4 px-10 py-5 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
              <div className="col-span-1 flex justify-center">Status</div>
              <div className="col-span-4">Email Address</div>
              <div className="col-span-2 text-center">Confidence</div>
              <div className="col-span-3 text-center">Reason</div>
              <div className="col-span-2 text-center">Outcome</div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {historyLoading ? (
                <div className="p-20 text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
                  <p className="mt-4 text-gray-400 dark:text-gray-500 font-medium">Fetching history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <History className="w-12 h-12 text-gray-100 dark:text-gray-800" />
                  <p className="text-gray-400 dark:text-gray-500 font-bold italic">No verified emails yet.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {history.map((item, index) => (
                    <HistoryRow key={item._id || index} item={item} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const HistoryRow: FC<{ item: HistoryItem }> = ({ item }) => {
  const isDeliverable = item.outcome?.toLowerCase() === "deliverable" || item.confidence === "High";

  // Clean reason text
  let reasonText = "Validation failed";

  if (isDeliverable) {
    reasonText = "Valid email";
  } else if (item.validation_details) {
    // Collect all negative reasons
    const reasons: string[] = [];
    const details = item.validation_details;

    // Check specific fields if available
    if (details.syntax && !details.syntax.value && details.syntax.reason) reasons.push(details.syntax.reason);
    if (details.domain && !details.domain.value && details.domain.reason) reasons.push(details.domain.reason);
    if (details.mx && !details.mx.value && details.mx.reason) reasons.push(details.mx.reason);
    if (details.smtp && !details.smtp.value && details.smtp.reason) reasons.push(details.smtp.reason);
    if (details.disposable && String(details.disposable.value) === 'true') reasons.push("Disposable email");
    if (details.roleBased && String(details.roleBased.value) === 'true') reasons.push("Role-based email");

    // If we simply have a string reason on the item (legacy or fallback)
    if (reasons.length === 0 && item.reason) {
      reasons.push(item.reason);
    }

    if (reasons.length > 0) {
      reasonText = reasons.join("\n");
    } else {
      reasonText = item.reason || "Validation failed";
    }
  } else if (item.reason) {
    reasonText = item.reason;
  }

  // Format Outcome
  const outcomeText = item.outcome || "Unknown";

  // Format Date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-10 py-6 hover:bg-[#fafafa] dark:hover:bg-gray-800/50 transition-colors group"
    >
      <div className="col-span-1 flex justify-center">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDeliverable ? 'bg-green-50 dark:bg-green-900/20' : item.confidence === 'Medium' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'} shadow-sm`}>
          {isDeliverable ? (
            <Check className="w-7 h-7 text-green-500 dark:text-green-400" />
          ) : item.confidence === 'Medium' ? (
            <AlertCircle className="w-7 h-7 text-yellow-500 dark:text-yellow-400" />
          ) : (
            <X className="w-7 h-7 text-red-400 dark:text-red-500" />
          )}
        </div>
      </div>

      <div className="col-span-4">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{item.email}</h4>
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-black tracking-tighter">Validated on {formatDate(item.validated_at)}</p>
      </div>

      <div className="col-span-2 flex justify-center">
        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${item.confidence === 'High' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'}`}>
          {item.confidence} Confidence
        </span>
      </div>

      <div className="col-span-3 text-center">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize block max-w-full px-2 whitespace-pre-line" title={reasonText}>
          {reasonText}
        </span>
      </div>

      <div className="col-span-2 flex justify-center">
        <span className={`px-5 py-2 rounded-xl text-[11px] font-black tracking-wider shadow-sm uppercase ${isDeliverable
          ? 'bg-white dark:bg-gray-800 border-2 border-green-500 dark:border-green-600 text-green-600 dark:text-green-400'
          : 'bg-white dark:bg-gray-800 border-2 border-red-300 dark:border-red-600 text-red-500 dark:text-red-400'
          }`}>
          {outcomeText}
        </span>
      </div>
    </motion.div>
  );
};

export default SingleEmailPage;