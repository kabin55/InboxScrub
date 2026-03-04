import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Crown, Zap, Star, Loader2, CheckCircle2 } from "lucide-react";


interface User {
    id: string;
    name: string;
    email: string;
    credits: number;
    plan: "Basic" | "Standard" | "Premium";
}


interface AddCreditsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSuccess: (userId: string, newPlan: User["plan"], newCredits: number, newMassCredits: number) => void;
}


const PLAN_PRESETS = {
    Basic: { sanitization: 100, massMailing: 0 },
    Standard: { sanitization: 500, massMailing: 100 },
    Premium: { sanitization: 3000, massMailing: 1000 },
};


export const AddCreditsPanel: React.FC<AddCreditsPanelProps> = ({ isOpen, onClose, user, onSuccess }) => {
    const [selectedPlan, setSelectedPlan] = useState<User["plan"] | "">("");
    const [credits, setCredits] = useState<string>("");
    const [massCredits, setMassCredits] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);


    // Reset state when user changes or panel opens
    useEffect(() => {
        if (user) {
            setSelectedPlan(user.plan);
            setCredits(user.credits.toString());
            // @ts-ignore
            setMassCredits(user.massMalingCredits?.toString() || "0");
        }
    }, [user, isOpen]);


    // Auto-fill credits based on plan
    const handlePlanChange = (plan: User["plan"]) => {
        setSelectedPlan(plan);
        setCredits(PLAN_PRESETS[plan].sanitization.toString());
        setMassCredits(PLAN_PRESETS[plan].massMailing.toString());
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedPlan || !credits) return;


        setIsLoading(true);


        // Simulate API Request
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            onSuccess(user.id, selectedPlan as User["plan"], parseInt(credits), parseInt(massCredits));
            setIsSuccess(true);


            // Auto close after 2 seconds success
            setTimeout(() => {
                setIsSuccess(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Failed to add credits:", error);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-[60]"
                    />


                    {/* Main Dialog Container */}
                    <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
                        {/* Centered Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh] border border-gray-100 dark:border-gray-800"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 transition-colors">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        Credits Management
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage user's subscription plan and credit balance</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 group"
                                >
                                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>


                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-10">
                                {isSuccess ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="h-full flex flex-col items-center justify-center text-center space-y-4"
                                    >
                                        <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">Operation Successful!</h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                                            Credits successfully added to the user account. This panel will close in a moment.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-10 max-w-lg">
                                        {/* User Section */}
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Target User</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="p-5 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                                                        {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 dark:text-white">{user?.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>


                                        {/* Plan Selection */}
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Select New Plan</h4>
                                            <div className="grid grid-cols-1 gap-3">
                                                {(['Basic', 'Standard', 'Premium'] as const).map((plan) => (
                                                    <button
                                                        key={plan}
                                                        type="button"
                                                        onClick={() => handlePlanChange(plan)}
                                                        className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 ${selectedPlan === plan
                                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-2.5 rounded-xl ${plan === 'Premium' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' :
                                                                plan === 'Standard' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                                                                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                                }`}>
                                                                {plan === 'Premium' ? <Crown className="w-5 h-5" /> :
                                                                    plan === 'Standard' ? <Zap className="w-5 h-5" /> :
                                                                        <Star className="w-5 h-5" />}
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-black text-gray-900 dark:text-white">{plan} Tier</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{PLAN_PRESETS[plan].sanitization} Sanitization / {PLAN_PRESETS[plan].massMailing} Mass Email</p>
                                                            </div>
                                                        </div>
                                                        {selectedPlan === plan && (
                                                            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                                                <CheckCircle2 className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>


                                        {/* Credit Amount */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sanitization Credits</h4>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Manual Override Enabled</span>
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-focus-within:bg-blue-600 transition-colors">
                                                    <CreditCard className="w-4 h-4 text-gray-500 dark:text-gray-400 group-focus-within:text-white" />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={credits}
                                                    onChange={(e) => setCredits(e.target.value)}
                                                    placeholder="Enter sanitization credit amount..."
                                                    className="w-full pl-16 pr-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-lg font-black text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 transition-all"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between mt-4">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Mass Mailing Credits</h4>
                                            </div>
                                            <div className="relative group mt-2">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-focus-within:bg-blue-600 transition-colors">
                                                    <CreditCard className="w-4 h-4 text-gray-500 dark:text-gray-400 group-focus-within:text-white" />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={massCredits}
                                                    onChange={(e) => setMassCredits(e.target.value)}
                                                    placeholder="Enter mass mailing credit amount..."
                                                    className="w-full pl-16 pr-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-lg font-black text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 transition-all"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 pl-2 italic">Note: These credits will be immediately available to the user.</p>
                                        </div>


                                        {/* Action Button */}
                                        <div className="pt-6">
                                            <button
                                                type="submit"
                                                disabled={!selectedPlan || isLoading}
                                                className={`w-full py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all duration-300 transform ${!selectedPlan || isLoading
                                                    ? 'bg-gray-300 cursor-not-allowed translate-y-0 shadow-none'
                                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200 hover:-translate-y-1 active:translate-y-0'
                                                    }`}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Add Credits Now
                                                        <Zap className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};




