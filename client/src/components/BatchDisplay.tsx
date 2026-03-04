import { useState, useEffect } from "react";
import { getBatchList, updateBatchName, type Batch } from "../api/batch";
import { Card } from "./ui/Card";
import { Package, RefreshCw, Calendar, ChevronDown, ChevronUp, Edit2, Check, X } from "lucide-react";
import { Button } from "./ui/Button";

interface BatchDisplayProps {
    onSelect?: (batch: Batch) => void;
    selectedBatchId?: string | null;
}

export const BatchDisplay = ({ onSelect, selectedBatchId }: BatchDisplayProps) => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
    const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");


    const fetchBatches = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getBatchList();
            if (data.success && data.batches) {
                setBatches(data.batches);
            } else {
                setBatches([]);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load batches");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedBatchId(prev => prev === id ? null : id);
    };

    const handleStartEdit = (batch: Batch) => {
        setEditingBatchId(batch._id);
        setEditName(batch.batchName);
    };

    const handleCancelEdit = () => {
        setEditingBatchId(null);
        setEditName("");
    };

    const handleSaveEdit = async (batchId: string) => {
        if (!editName.trim()) return;

        try {
            const result = await updateBatchName(batchId, editName);
            if (result.success) {
                setBatches(batches.map(b => b._id === batchId ? { ...b, batchName: editName } : b));
                setEditingBatchId(null);
                setEditName("");
            } else {
                // Optional: set an error state specific to editing
                console.error("Failed to update batch name");
            }
        } catch (error) {
            console.error("Error updating batch name:", error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const hasBatches = batches.length > 0;

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        Saved Batches
                    </h2>
                </div>
                <Button
                    onClick={fetchBatches}
                    variant="secondary"
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Loading batches...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="text-center py-8">
                    <p className="text-sm text-red-600 dark:text-red-400 font-semibold">{error}</p>
                    <Button onClick={fetchBatches} variant="secondary" className="mt-4">
                        Try Again
                    </Button>
                </div>
            )}

            {!loading && !error && !hasBatches && (
                <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No batches saved yet. Upload and validate emails to create batches.
                    </p>
                </div>
            )}

            {!loading && !error && hasBatches && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {batches.map((batch) => (
                        <div
                            key={batch._id}
                            className={`bg-white dark:bg-gray-900 border rounded-xl p-5 transition-all shadow-sm hover:shadow-md flex flex-col h-full ${selectedBatchId === batch._id
                                ? 'border-green-500 ring-2 ring-green-500/20 dark:border-green-500 dark:ring-green-500/20'
                                : 'border-gray-200 dark:border-gray-800 hover:border-blue-600 dark:hover:border-blue-400'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-xs font-black text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 px-3 py-1 rounded-full whitespace-nowrap">
                                    {batch.emails.length} emails
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                {editingBatchId === batch._id ? (
                                    <div className="flex items-center gap-2 mb-1">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="min-w-0 flex-1 px-2 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()} // Prevent card click
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSaveEdit(batch._id);
                                            }}
                                            className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded transition-colors"
                                            title="Save"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCancelEdit();
                                            }}
                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors"
                                            title="Cancel"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="group flex items-center gap-2 mb-1">
                                        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 truncate" title={batch.batchName}>
                                            {batch.batchName}
                                        </h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartEdit(batch);
                                            }}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-all"
                                            title="Edit Name"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                {onSelect && selectedBatchId === batch._id && (
                                    <div className="mt-1">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            Selected
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(batch.createdAt)}</span>
                            </div>

                            <div className="mt-auto space-y-3">
                                {onSelect && selectedBatchId !== batch._id && (
                                    <Button
                                        onClick={() => onSelect(batch)}
                                        variant="secondary"
                                        className="w-full justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-900/30"
                                    >
                                        Use Batch
                                    </Button>
                                )}
                                <div className={`overflow-hidden transition-all duration-300 ${expandedBatchId === batch._id ? 'max-h-60 mb-3' : 'max-h-0'}`}>
                                    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                        {batch.emails.map((email, idx) => (
                                            <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                                                {email}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleExpand(batch._id)}
                                    className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    {expandedBatchId === batch._id ? (
                                        <>
                                            <ChevronUp className="w-3 h-3" />
                                            Hide Emails
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-3 h-3" />
                                            View Emails
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};
