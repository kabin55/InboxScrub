import React, { useState } from "react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
import { FileUp, FileCode2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/Button";
import { uploadTemplateApi } from "../api/template";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";

export default function UploadTemplate() {
    const [file, setFile] = useState<File | null>(null);
    const [templateName, setTemplateName] = useState("");
    const [description, setDescription] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useNotification();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === "text/html" || selectedFile.name.endsWith(".html")) {
                setFile(selectedFile);
                if (!templateName) setTemplateName(selectedFile.name.replace(".html", ""));
            } else {
                addToast('error', "Please select a valid HTML file.");
                e.target.value = "";
            }
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !templateName) return;

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("templateName", templateName);
            if (description) formData.append("description", description);

            const response = await uploadTemplateApi(formData);
            addToast('success', `Template "${response.name}" uploaded successfully!`);
            navigate("/templates");
        } catch (err: any) {
            console.error("Upload failed:", err);
            addToast('error', err.message || "Failed to upload template.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-[#fafafa] dark:bg-gray-950 min-h-screen transition-colors duration-300">
            <Sidebar />
            <Topbar />

            <main className="ml-64 pt-20 p-8">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <FileUp className="w-8 h-8 text-blue-600" />
                            Upload Template
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Upload your custom HTML email templates for bulk campaigns.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
                        <form onSubmit={handleUpload} className="space-y-6">

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    HTML Template File
                                </label>
                                <div className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors
                                    ${file ? 'border-blue-400 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>

                                    <input
                                        type="file"
                                        name="file"
                                        accept=".html,text/html"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        required
                                    />

                                    {file ? (
                                        <div className="text-center space-y-2 pointer-events-none">
                                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                                                <FileCode2 className="w-6 h-6" />
                                            </div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium pt-2">Click or drag to replace</p>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-3 pointer-events-none">
                                            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-500 dark:text-gray-400 mb-2">
                                                <FileUp className="w-6 h-6" />
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300 font-medium">
                                                Drag & drop your HTML file here
                                            </p>
                                            <p className="text-sm text-gray-400 px-4">
                                                or click to browse your files (Only .html accepted)
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="templateName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Template Name
                                    </label>
                                    <input
                                        id="templateName"
                                        type="text"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        placeholder="e.g. Welcome Newsletter 2026"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Brief description of this template's purpose"
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 transition-all resize-none placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400 text-sm p-4 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p>Make sure your HTML template includes proper inline styling. External stylesheets may not render in all email clients.</p>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={!file || !templateName || isUploading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                                >
                                    {isUploading ? "Uploading..." : "Save Template"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}