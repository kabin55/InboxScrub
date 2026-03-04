import { useState, useEffect } from "react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Check, CreditCard, Zap, Building2, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getPaymentHistory, type PaymentItem } from "../api/profile";

export default function Pricing() {
    const { credits } = useAuth();
    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const data = await getPaymentHistory();
                setPayments(data.payments);
            } catch (err) {
                console.error("Failed to fetch payment history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    const tiers = [
        {
            name: "Starter",
            price: "$9",
            credits: "1,000 Credits",
            features: ["Email Sanitization", "Basic Campaigns", "24/7 Support"],
            cta: "Get Started",
            icon: Zap,
        },
        {
            name: "Pro",
            price: "$49",
            credits: "10,000 Credits",
            features: [
                "All Starter Features",
                "Advanced Campaign Analytics",
                "Dedicated Account Manager",
                "Priority Support",
            ],
            cta: "Get Started",
            highlight: true,
            icon: Sparkles,
        },
        {
            name: "Enterprise",
            price: "Custom",
            credits: "Custom Credits",
            features: [
                "All Pro Features",
                "API Access",
                "Volume Discounts",
                "On-premise Deployment",
            ],
            cta: "Contact Sales",
            icon: Building2,
        },
    ];

    return (
        <div className="bg-[#fafafa] dark:bg-gray-950 min-h-screen transition-colors duration-300">
            <Sidebar />
            <Topbar />

            <main className="ml-64 pt-20 p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <CreditCard className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            Pricing & Credits
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Purchase credits and manage your billing.</p>
                    </div>

                    {/* Credits Summary Card */}
                    <Card className="p-8 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-900/10 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                        <div className="max-w-3xl">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Your Current Balance</p>
                            <h2 className="text-5xl font-black text-gray-900 dark:text-gray-100 mb-2">
                                {credits?.toLocaleString() ?? "..."}
                                <span className="text-lg text-gray-400 dark:text-gray-500 font-bold ml-2">CR</span>
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">You have {credits?.toLocaleString() ?? "..."} credits remaining for email validations.</p>

                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-8 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, ((credits || 0) / 15000) * 100)}%` }}
                                />
                            </div>

                            <Button className="px-12">
                                Buy More Credits
                            </Button>
                        </div>
                    </Card>

                    {/* Pricing Tiers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tiers.map((tier) => {
                            const Icon = tier.icon;
                            return (
                                <Card
                                    key={tier.name}
                                    className={`p-8 flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-lg ${tier.highlight
                                        ? 'border-2 border-blue-600 shadow-xl scale-[1.02] z-10'
                                        : 'hover:border-gray-200 dark:hover:border-gray-700'
                                        }`}
                                >
                                    {tier.highlight && (
                                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
                                            Popular
                                        </div>
                                    )}

                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl w-fit mb-6">
                                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{tier.name}</h3>
                                    <div className="mb-4">
                                        <span className="text-4xl font-black text-gray-900 dark:text-gray-100">{tier.price}</span>
                                        {tier.price !== "Custom" && <span className="text-gray-400 dark:text-gray-500 font-medium">/month</span>}
                                    </div>
                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-8">{tier.credits}</p>

                                    <div className="space-y-4 mb-8 flex-1">
                                        {tier.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="p-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                                                    <Check className="h-3 w-3 text-green-500 dark:text-green-400" />
                                                </div>
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <Button
                                        variant={tier.highlight ? "primary" : "secondary"}
                                        className="w-full"
                                    >
                                        {tier.cta}
                                    </Button>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Purchase History */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Purchase History</h2>
                        <Card className="overflow-hidden p-0 border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#fafbfc] dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-black border-b border-gray-100 dark:border-gray-700 text-[10px] uppercase tracking-widest">
                                        <tr>
                                            <th className="px-8 py-5">Date</th>
                                            <th className="px-8 py-5">Transaction ID</th>
                                            <th className="px-8 py-5">Payment Method</th>
                                            <th className="px-8 py-5 text-right">Amount</th>
                                            <th className="px-8 py-5 text-right">Credits</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800 font-medium transition-colors duration-300">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-12 text-center">
                                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
                                                    <p className="text-gray-400 dark:text-gray-500 mt-2">Loading payment history...</p>
                                                </td>
                                            </tr>
                                        ) : payments.length > 0 ? (
                                            payments.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-8 py-5 whitespace-nowrap text-gray-400 dark:text-gray-500 text-xs">
                                                        {new Date(payment.payment_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-8 py-5 font-mono text-gray-600 dark:text-gray-400 text-xs">
                                                        {payment.transaction_id}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold uppercase">
                                                            {payment.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-bold text-gray-800 dark:text-gray-200">
                                                        ${payment.amount_paid.toFixed(2)}
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-black text-green-600 dark:text-green-400">
                                                        +{payment.credits_added.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-12 text-center text-gray-400 dark:text-gray-500 italic">
                                                    No purchase history found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </section>

                    {/* Footer */}
                    <footer className="pt-8 border-t dark:border-gray-800 flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 pb-8 uppercase font-black tracking-widest transition-colors duration-300">
                        <p>© 2026 MailFlow. All rights reserved.</p>
                        <div className="flex gap-8">
                            <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy</span>
                            <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms</span>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}
