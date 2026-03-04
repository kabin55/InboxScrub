import { Mail, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full transition-colors duration-300">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 font-semibold uppercase tracking-wider">Quick Actions</h3>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => navigate("/single-email")}
          className="group flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 p-3 text-center transition-all hover:bg-blue-600 hover:border-blue-600 hover:text-white"
        >
          <div className="rounded-full bg-white dark:bg-gray-800 p-2 shadow-sm group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-bold text-sm text-blue-800 dark:text-blue-300 group-hover:text-white">Single Validation</span>
        </button>

        <button
          onClick={() => navigate("/campaigns")}
          className="group flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3 text-center transition-all hover:bg-gray-900 dark:hover:bg-gray-700 hover:border-gray-900 dark:hover:border-gray-700 hover:text-white"
        >
          <div className="rounded-full bg-white dark:bg-gray-800 p-2 shadow-sm group-hover:bg-gray-100 dark:group-hover:bg-gray-700">
            <Send className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </div>
          <span className="font-bold text-sm text-gray-800 dark:text-gray-200 group-hover:text-white">Mass Campaign</span>
        </button>
      </div>
    </div>
  );
};
