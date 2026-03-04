import React, { useState, useEffect } from "react";
import { Search, ShieldAlert, ShieldCheck, MoreVertical, Mail, CreditCard, User as UserIcon, Crown, Star, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SuperSidebar } from "../../components/dashboard/SuperSidebar";
import { SuperTopbar } from "../../components/dashboard/SuperTopbar";
import { AddCreditsPanel } from "../../components/dashboard/AddCreditsPanel";


import { fetchUsers, updateUser, type AdminUser } from "../../api/admin";

// MOCK_USERS removed


const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};


const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 }
    }
};


const SuperAdmin: React.FC = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddCreditsOpen, setIsAddCreditsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch users (with debounce for search could be better, but simple effect for now)
    useEffect(() => {
        const loadUsers = async () => {
            setLoading(true);
            try {
                const data = await fetchUsers(searchQuery);
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            loadUsers();
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);


    const toggleBlockStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await updateUser(userId, { isBlocked: !currentStatus });
            // Optimistic update
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId ? { ...user, isBlocked: !currentStatus } : user
                )
            );
        } catch (error) {
            console.error("Failed to update user status", error);
            alert("Failed to update user status");
        }
    };


    const handleOpenAddCredits = (user: AdminUser) => {
        setSelectedUser(user);
        setIsAddCreditsOpen(true);
    };


    const handleCreditsUpdate = async (userId: string, newPlan: AdminUser["plan"], newCredits: number, newMassCredits: number) => {
        try {
            await updateUser(userId, { plan: newPlan, credits: newCredits, massMalingCredits: newMassCredits });
            setUsers(prev => prev.map(u =>
                u.id === userId ? {
                    ...u,
                    plan: newPlan,
                    credits: u.credits + newCredits,
                    massMalingCredits: (u.massMalingCredits || 0) + newMassCredits
                } : u
            ));
        } catch (error) {
            console.error("Failed to update credits/plan", error);
            alert("Failed to update user");
        }
    };


    const getPlanBadge = (plan: AdminUser["plan"]) => {
        switch (plan) {
            case "Premium":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-100">
                        <Crown className="w-3 h-3" /> Premium
                    </span>
                );
            case "Standard":
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                        <Zap className="w-3 h-3" /> Standard
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-50 text-gray-600 border border-gray-100">
                        <Star className="w-3 h-3" /> Basic
                    </span>
                );
        }
    };


    return (
        <div className="relative bg-[#fafafa] dark:bg-gray-950 min-h-screen overflow-hidden transition-colors duration-300">



            <SuperSidebar />


            <SuperTopbar title="Management Console" />




            <main className="ml-64 pt-28 p-8">
                <motion.div
                    className="max-w-7xl mx-auto space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Header Section */}
                    <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300">
                        <div>
                            <span className="inline-block px-4 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">
                                User Analytics
                            </span>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                Management <span className="text-blue-600 dark:text-blue-500">Console</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time overview of all system participants</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-2 flex items-center gap-4 shadow-sm">
                                <div className="text-right px-2">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Users</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white">{users.length}</p>
                                </div>
                                <div className="h-8 w-px bg-gray-100 dark:bg-gray-700"></div>
                                <div className="text-right px-2">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active Credits</p>
                                    <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                                        {users.reduce((acc, u) => acc + u.credits, 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>


                    {/* Table Container */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300">
                        {/* Table Header / Toolbar */}
                        <div className="p-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                                </div>
                                User Directory
                            </h3>


                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>


                        {/* User Table */}
                        <div className="overflow-x-auto px-4 pb-6 mt-4">
                            <table className="w-full text-left border-separate border-spacing-y-3 px-4">
                                <thead className="text-gray-400 uppercase tracking-widest text-[10px] font-black">
                                    <tr>
                                        <th className="px-6 py-2">Account</th>
                                        <th className="px-6 py-2">Plan</th>
                                        <th className="px-6 py-2">Sanitization</th>
                                        <th className="px-6 py-2">Bulk Email</th>
                                        <th className="px-6 py-2">Status</th>
                                        <th className="px-6 py-2 text-right">Operation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {users.map((user) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className={`group transition-all duration-300 ${user.isBlocked ? 'opacity-70' : ''}`}
                                            >
                                                <td className="px-6 py-4 bg-gray-50/30 dark:bg-gray-800/30 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 rounded-l-[1.5rem] border-y border-l border-gray-50 dark:border-gray-800 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-sm transition-transform duration-300 group-hover:scale-105 ${user.isBlocked ? 'bg-gray-400 dark:bg-gray-600' : 'bg-gradient-to-br from-blue-600 to-indigo-600'}`}>
                                                            {(user.name || 'User').split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors ${user.isBlocked ? 'line-through decoration-gray-400 dark:decoration-gray-500' : ''}`}>
                                                                {user.name || 'Anonymous User'}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                                                <Mail className="w-3 h-3" />
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 bg-gray-50/30 dark:bg-gray-800/30 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 border-y border-gray-50 dark:border-gray-800 transition-colors">
                                                    {getPlanBadge(user.plan)}
                                                </td>
                                                <td className="px-6 py-4 bg-gray-50/30 dark:bg-gray-800/30 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 border-y border-gray-50 dark:border-gray-800 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <span className="font-black text-gray-900 dark:text-white text-lg">
                                                            {user.credits.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 bg-gray-50/30 dark:bg-gray-800/30 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 border-y border-gray-50 dark:border-gray-800 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                                            <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                        </div>
                                                        <span className="font-black text-gray-900 dark:text-white text-lg">
                                                            {user.massMalingCredits ? user.massMalingCredits.toLocaleString() : "0"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 bg-gray-50/30 dark:bg-gray-800/30 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 border-y border-gray-50 dark:border-gray-800 transition-colors">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${user.isBlocked
                                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30'
                                                        : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30'
                                                        }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${user.isBlocked ? 'bg-red-500' : 'bg-green-500'}`} />
                                                        {user.isBlocked ? 'Blocked' : 'Active'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 bg-gray-50/30 dark:bg-gray-800/30 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 rounded-r-[1.5rem] border-y border-r border-gray-50 dark:border-gray-800 text-right transition-colors">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleOpenAddCredits(user)}
                                                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-blue-600 dark:text-blue-400 text-[11px] font-black rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:border-blue-500 transition-all shadow-sm active:scale-95"
                                                        >
                                                            Add Credits
                                                        </button>
                                                        <button
                                                            onClick={() => toggleBlockStatus(user.id, user.isBlocked)}
                                                            className={`flex items-center gap-2 px-4 py-2 border text-[11px] font-black rounded-xl transition-all shadow-sm active:scale-95 ${user.isBlocked
                                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-white'
                                                                : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white'
                                                                }`}
                                                        >
                                                            {user.isBlocked ? (
                                                                <><ShieldCheck className="w-3.5 h-3.5" /> Unblock</>
                                                            ) : (
                                                                <><ShieldAlert className="w-3.5 h-3.5" /> Block</>
                                                            )}
                                                        </button>
                                                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>


                            {!loading && users.length === 0 && (
                                <div className="py-20 text-center">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h4 className="text-gray-900 font-bold">No results matched</h4>
                                    <p className="text-gray-400 text-sm mt-1">Try searching for other parameters</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            </main>


            <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-10 py-8 text-[10px] text-gray-400 dark:text-gray-500 flex justify-between uppercase font-black tracking-widest ml-64 transition-colors duration-300">
                <span>© 2026 MailFlow HQ. Super Admin Authority.</span>
                <div className="flex gap-6">
                    <span className="text-blue-600/50 dark:text-blue-400/50">System Status: Optimal</span>
                    <span>v1.2.0-PRO</span>
                </div>
            </footer>


            <AddCreditsPanel
                isOpen={isAddCreditsOpen}
                user={selectedUser}
                onClose={() => setIsAddCreditsOpen(false)}
                onSuccess={handleCreditsUpdate}
            />
        </div >
    );
};


export default SuperAdmin;



