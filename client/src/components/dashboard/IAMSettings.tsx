import { useState, useEffect } from "react";
import { Key, Check, Plus, Trash2, Edit2, RefreshCw, Mail, Calendar, Activity } from "lucide-react";
import { createToken, fetchTokens, revokeToken, updateTokenPermissions, type IamToken } from "../../api/iam";
import { Button } from "../ui/Button";
import { useNotification } from "../../context/NotificationContext";

const AVAILABLE_ACTIONS = ['Email Sanitization', 'Bulk Mailing', 'Upload Template'];

export const IAMSettings = () => {
    const [tokens, setTokens] = useState<IamToken[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useNotification();

    // Create Token State
    const [isGenerating, setIsGenerating] = useState(false);
    const [email, setEmail] = useState("");
    const [selectedActions, setSelectedActions] = useState<string[]>([AVAILABLE_ACTIONS[0]]);
    const [note, setNote] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [trackEmail, setTrackEmail] = useState(false);

    // Edit Token State
    const [editingToken, setEditingToken] = useState<IamToken | null>(null);

    const loadTokens = async () => {
        setLoading(true);
        try {
            const res = await fetchTokens();
            setTokens(res.tokens);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTokens();
    }, []);

    const handleCreateToken = async () => {
        if (!email) {
            addToast('error', 'User Email is required');
            return;
        }
        
        setIsGenerating(true);
        try {
            const res = await createToken(email, selectedActions, note, expiresAt || undefined, trackEmail);
            setEmail("");
            setSelectedActions([AVAILABLE_ACTIONS[0]]);
            setNote("");
            setExpiresAt("");
            setTrackEmail(false);
            addToast('success', res.message || "New API token generated and emailed successfully.");
            loadTokens();
        } catch (error: any) {
            console.error("Failed to generate token", error);
            addToast('error', error.response?.data?.message || "Failed to generate token. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!window.confirm("Are you sure you want to revoke this token?")) return;
        try {
            await revokeToken(id);
            addToast('success', "Token revoked successfully.");
            loadTokens();
        } catch (error) {
            console.error("Failed to revoke token", error);
            addToast('error', "Failed to revoke token.");
        }
    };

    const handleUpdatePermissions = async (id: string, perms: string[]) => {
        try {
            await updateTokenPermissions(id, perms);
            setEditingToken(null);
            addToast('success', "Permissions updated successfully.");
            loadTokens();
        } catch (error) {
            console.error("Failed to update token", error);
            addToast('error', "Failed to update permissions.");
        }
    };

    const togglePermission = (perm: string, currentList: string[]) => {
        if (currentList.includes(perm)) {
            return currentList.filter(p => p !== perm);
        }
        return [...currentList, perm];
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                        <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">Access Management (iAM)</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Generate and securely email system access tokens</p>
                    </div>
                </div>
            </div>

            {/* Token Generation Form */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 mb-8 border border-gray-100 dark:border-gray-800">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-sm uppercase tracking-wider">Generate & Assign New Token</h4>

                <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Assign Permissions</label>
                    <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                        {AVAILABLE_ACTIONS.map(act => (
                            <label key={act} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedActions.includes(act)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedActions([...selectedActions, act]);
                                        } else {
                                            setSelectedActions(selectedActions.filter(a => a !== act));
                                        }
                                    }}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 bg-white"
                                />
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{act}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" /> User Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 dark:text-gray-200"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" /> Expiration Date (Optional)
                        </label>
                        <div className="space-y-2">
                            <input
                                type="date"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 dark:text-gray-200"
                            />
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Add quickly:</span>
                                {[7, 15, 20, 30].map(days => (
                                    <button
                                        key={days}
                                        type="button"
                                        onClick={() => {
                                            const d = new Date();
                                            d.setDate(d.getDate() + days);
                                            setExpiresAt(d.toISOString().split('T')[0]);
                                        }}
                                        className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-600 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-md transition-colors"
                                    >
                                        +{days} Days
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 space-y-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Add a Note (Optional)</label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. For marketing campaign"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 dark:text-gray-200"
                    />
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={trackEmail}
                            onChange={(e) => setTrackEmail(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 bg-white"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Track Token Delivery Email</span>
                    </label>
                </div>

                <div className="flex items-center gap-4">
                    <Button onClick={handleCreateToken} disabled={isGenerating || !email} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 
                        Generate & Email Token
                    </Button>
                </div>
            </div>

            {/* Token List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wider">Active & Recent Tokens</h4>
                    <button onClick={loadTokens} className="text-gray-400 hover:text-indigo-600 transition-colors p-1" title="Refresh list">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">User Email</th>
                                <th className="px-4 py-3">Action(s)</th>
                                <th className="px-4 py-3">Expires At</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Tracking</th>
                                <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokens.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No tokens generated yet.
                                    </td>
                                </tr>
                            )}
                            {tokens.map(token => (
                                <tr key={token._id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                        {token.assignedEmail || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {editingToken?._id === token._id ? (
                                            <div className="flex flex-wrap gap-1">
                                                {AVAILABLE_ACTIONS.map(perm => (
                                                    <label key={perm} className="flex items-center gap-1 text-xs whitespace-nowrap bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only"
                                                            checked={editingToken.permissions.includes(perm)}
                                                            onChange={() => setEditingToken({
                                                                ...editingToken,
                                                                permissions: togglePermission(perm, editingToken.permissions)
                                                            })}
                                                        />
                                                        <div className={`w-3 h-3 rounded-sm flex items-center justify-center ${editingToken.permissions.includes(perm) ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                            {editingToken.permissions.includes(perm) && <Check className="w-2 h-2 text-white" />}
                                                        </div>
                                                        {perm}
                                                    </label>
                                                ))}
                                                <div className="flex gap-1 ml-2">
                                                    <button onClick={() => handleUpdatePermissions(token._id, editingToken.permissions)} className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                                                        <Check className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                                {token.permissions.map(p => (
                                                    <span key={p} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-xs whitespace-nowrap">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                        {token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider whitespace-nowrap ${token.status === 'Active'
                                            ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:border-green-800'
                                            : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:border-red-800'
                                            }`}>
                                            {token.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        {token.jobId ? (
                                            <span className="text-xs text-indigo-500 flex items-center gap-1" title={token.jobId}><Activity className="w-3 h-3"/> Tracked</span>
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {token.status === 'Active' && (
                                                <>
                                                    <button
                                                        onClick={() => setEditingToken(editingToken?._id === token._id ? null : token)}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors tooltip"
                                                        title="Edit Permissions"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRevoke(token._id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors tooltip"
                                                        title="Revoke Token"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
