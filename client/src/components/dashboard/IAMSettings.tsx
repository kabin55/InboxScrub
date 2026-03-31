import { useState, useEffect } from "react";
import { Copy, Key, Check, Plus, Trash2, Edit2, AlertTriangle, RefreshCw } from "lucide-react";
import type { Permission } from "../../api/auth";
import { createToken, fetchTokens, revokeToken, updateTokenPermissions, type IamToken } from "../../api/iam";
import { Button } from "../ui/Button";
import { useNotification } from "../../context/NotificationContext";

const AVAILABLE_PERMISSIONS: Permission[] = [
    'Email Sanitization',
    'Bulk Mailing',
    'Upload Template'
];

export const IAMSettings = () => {
    const [tokens, setTokens] = useState<IamToken[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useNotification();

    // Create Token State
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
    const [note, setNote] = useState("");
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

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
        if (selectedPermissions.length === 0) return;
        setIsGenerating(true);
        try {
            const res = await createToken(selectedPermissions, note);
            setGeneratedToken(res.token.tokenValue || "Error: Token not returned");
            setSelectedPermissions([]);
            setNote("");
            addToast('success', "New API token generated successfully.");
            loadTokens();
        } catch (error) {
            console.error("Failed to generate token", error);
            addToast('error', "Failed to generate token. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (generatedToken) {
            navigator.clipboard.writeText(generatedToken);
            setCopied(true);
            addToast('info', "Token copied to clipboard.");
            setTimeout(() => setCopied(false), 2000);
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

    const handleUpdatePermissions = async (id: string, perms: Permission[]) => {
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

    const togglePermission = (perm: Permission, currentList: Permission[]) => {
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage API tokens and system access</p>
                    </div>
                </div>
            </div>

            {/* Token Generation Form */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 mb-8 border border-gray-100 dark:border-gray-800">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 text-sm uppercase tracking-wider">Generate New Token</h4>

                <div className="space-y-4 mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Select Permissions:</p>
                    <div className="flex flex-wrap gap-3">
                        {AVAILABLE_PERMISSIONS.map(perm => (
                            <label key={perm} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${selectedPermissions.includes(perm) ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300'}`}>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedPermissions.includes(perm)}
                                    onChange={() => setSelectedPermissions(togglePermission(perm, selectedPermissions))}
                                />
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedPermissions.includes(perm) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                    {selectedPermissions.includes(perm) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm font-semibold">{perm}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Add a Note (Optional):</p>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. For marketing team campaign"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <Button onClick={handleCreateToken} disabled={isGenerating || selectedPermissions.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">{isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Generate Token</Button>
                </div>

                {generatedToken && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                            <div className="w-full">
                                <h5 className="font-bold text-green-800 dark:text-green-300 text-sm mb-1">Token Generated Successfully</h5>
                                <p className="text-sm text-green-700 dark:text-green-400 mb-3">Please copy this token now. You will not be able to see it again.</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 block p-3 bg-white dark:bg-gray-900 border border-green-100 dark:border-green-800 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200 tracking-wider">
                                        {generatedToken}
                                    </code>
                                    <button
                                        onClick={handleCopy}
                                        className="p-3 bg-white dark:bg-gray-900 border border-green-100 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 transition-colors tooltip text-gray-500 dark:text-gray-400"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
                                <th className="px-4 py-3 rounded-l-lg">ID</th>
                                <th className="px-4 py-3">Permissions</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Note</th>
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
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                        ...{token._id.slice(-6)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {editingToken?._id === token._id ? (
                                            <div className="flex flex-wrap gap-1">
                                                {AVAILABLE_PERMISSIONS.map(perm => (
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
                                                        {perm.split(' ')[0]} {/* Short name */}
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
                                        {new Date(token.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider whitespace-nowrap ${token.status === 'Active'
                                            ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:border-green-800'
                                            : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:border-red-800'
                                            }`}>
                                            {token.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate" title={token.note}>
                                        {token.note || '-'}
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
