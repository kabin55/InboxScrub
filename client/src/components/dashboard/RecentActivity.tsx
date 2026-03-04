const ACTIVITY = [
  {
    date: "2024-07-28",
    type: "Email Sanitization",
    details: "marketing_list.txt (5000 emails)",
    status: "Completed",
    credits: "-500",
  },
  {
    date: "2024-07-27",
    type: "Mass Email Campaign",
    details: "Q3 Newsletter (2500 recipients)",
    status: "Completed",
    credits: "-250",
  },
  {
    date: "2024-07-26",
    type: "Credits Purchase",
    details: "Pro Plan",
    status: "Purchased",
    credits: "+10,000",
  },
  {
    date: "2024-07-25",
    type: "Single Email Verification",
    details: "john.doe@example.com",
    status: "Completed",
    credits: "-1",
  },
  {
    date: "2024-07-25",
    type: "Email Sanitization",
    details: "leads_july.txt (10000 emails)",
    status: "Failed",
    credits: "-0",
  },
];

export const RecentActivity = () => {
  return (
    <div className="rounded-xl bg-white p-6">
      <h3 className="mb-4 text-sm font-medium text-gray-600">
        Recent Activity
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2">Date</th>
              <th>Type</th>
              <th>Details</th>
              <th>Status</th>
              <th>Credits Used</th>
            </tr>
          </thead>

          <tbody className="text-gray-700">
            {ACTIVITY.map((a, i) => (
              <tr key={i} className="">
                <td className="py-3">{a.date}</td>
                <td>{a.type}</td>
                <td>{a.details}</td>
                <td>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      a.status === "Failed"
                        ? "bg-red-100 text-red-600"
                        : a.status === "Purchased"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td>{a.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
