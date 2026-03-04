import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    onClose: (id: string) => void;
    autoClose?: number;
}

const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
};

const bgColors = {
    success: "bg-white dark:bg-gray-800 border-green-500/20",
    error: "bg-white dark:bg-gray-800 border-red-500/20",
    info: "bg-white dark:bg-gray-800 border-blue-500/20",
    warning: "bg-white dark:bg-gray-800 border-yellow-500/20",
};

export const Toast = ({ id, type, message, onClose, autoClose = 5000 }: ToastProps) => {
    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(() => {
                onClose(id);
            }, autoClose);
            return () => clearTimeout(timer);
        }
    }, [id, autoClose, onClose]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`flex items-center gap-3 w-full max-w-sm p-4 rounded-xl shadow-lg border ${bgColors[type]} backdrop-blur-sm relative overflow-hidden`}
        >
            <div className="flex-shrink-0">{icons[type]}</div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{message}</p>
            <button
                onClick={() => onClose(id)}
                className="ml-auto p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Progress bar for autoClose */}
            {autoClose && (
                <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: autoClose / 1000, ease: "linear" }}
                    className={`absolute bottom-0 left-0 h-1 ${type === "success" ? "bg-green-500" :
                            type === "error" ? "bg-red-500" :
                                type === "info" ? "bg-blue-500" :
                                    "bg-yellow-500"
                        } opacity-30`}
                />
            )}
        </motion.div>
    );
};

export const ToastContainer = ({ toasts, removeToast }: { toasts: ToastProps[], removeToast: (id: string) => void }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast {...toast} onClose={removeToast} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};
