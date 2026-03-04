import { useNavigate } from "react-router-dom";

interface CreditSummaryProps {
  credits: number;
  totalValidated?: number;
}

export const CreditSummary = ({ credits, totalValidated = 0 }: CreditSummaryProps) => {
  const navigate = useNavigate();
  // Assuming a base of credits + validated for "total" if we don't have a plan limit
  // Or just display the credits. Let's make it simple for now.
  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Credit Summary</h3>

      <div className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">{credits?.toLocaleString() ?? 0}</div>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Remaining credits</p>

      <div className="mt-4 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${Math.min(100, (totalValidated / (credits + totalValidated || 1)) * 100)}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {totalValidated.toLocaleString()} emails validated so far
      </p>

      <button
        onClick={() => navigate("/pricing")}
        className="mt-6 w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 dark:shadow-none"
      >
        Buy More Credits
      </button>
    </div>
  );
};
