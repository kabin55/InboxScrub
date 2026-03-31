import { useState, useEffect } from "react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
import { FileCode2, Search, Trash2, Eye } from "lucide-react";
import { Button } from "../components/ui/Button";
import { fetchTemplates, deleteTemplate, getTemplateDetails, type Template } from "../api/template";
import { useNotification } from "../context/NotificationContext";

export default function TemplateList() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { addToast } = useNotification();

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await fetchTemplates();
            setTemplates(data);
        } catch (error) {
            console.error("Failed to load templates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;
        try {
            await deleteTemplate(id);
            setTemplates(prev => prev.filter(t => t._id !== id));
            addToast('success', `Template "${name}" deleted successfully.`);
        } catch (error: any) {
            addToast('error', error?.response?.data?.message || "Failed to delete template");
        }
    };

    const handlePreview = async (id: string) => {
        try {
            const data = await getTemplateDetails(id);
            if (data.previewUrl) {
                window.open(data.previewUrl, '_blank');
            } else {
                addToast('warning', "Preview not available.");
            }
        } catch (error) {
            console.error("Failed to fetch preview URL", error);
            addToast('error', "Unable to show preview.");
        }
    };

    const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="bg-[#fafafa] dark:bg-gray-950 min-h-screen transition-colors duration-300">
            <Sidebar />
            <Topbar />

            <main className="ml-64 pt-20 p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                                <FileCode2 className="w-8 h-8 text-blue-600" />
                                HTML Templates
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                Manage and preview your uploaded templates for mass campaigns.
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white text-gray-900 dark:text-gray-100 transition-all"
                            />
                        </div>
                        <Button
                            onClick={() => window.location.href = '/upload-template'}
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                        >
                            Upload New
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Template Name</th>
                                        <th className="px-6 py-4">Created</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                Loading templates...
                                            </td>
                                        </tr>
                                    ) : filteredTemplates.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500 bg-gray-50/50 dark:bg-gray-800/10">
                                                <FileCode2 className="w-8 h-8 mx-auto text-gray-400 mb-3" />
                                                <p>No templates found.</p>
                                                {searchQuery === "" && (
                                                    <p className="text-xs mt-1 text-gray-400">Click &quot;Upload New&quot; to add your first template.</p>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTemplates.map(template => (
                                            <tr key={template._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-gray-900 dark:text-white block">
                                                        {template.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400">ID: {template._id}</span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                    {new Date(template.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => handlePreview(template._id)}
                                                        className="p-2 h-auto text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(template._id, template.name)}
                                                        className="p-2 h-auto text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
