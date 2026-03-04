import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface CircularLoaderProps {
    progress: number; // 0 to 100
    size?: number;
    strokeWidth?: number;
    text?: string;
    color?: string;
}

export const CircularLoader = ({
    progress,
    size = 120,
    strokeWidth = 8,
    text,
    color = "#2563eb", // blue-600
}: CircularLoaderProps) => {
    const [displayProgress, setDisplayProgress] = useState(0);

    // Smoothly animate the number
    useEffect(() => {
        const target = Math.round(progress);
        if (displayProgress === target) return;

        const timer = setInterval(() => {
            setDisplayProgress((prev) => {
                if (prev === target) {
                    clearInterval(timer);
                    return target;
                }

                // Determine step size based on distance to target
                const diff = target - prev;
                if (Math.abs(diff) <= 1) return target;

                // Jump a bit faster if the gap is large, but stay smooth
                const step = diff > 0 ? Math.ceil(diff * 0.1) : Math.floor(diff * 0.1);
                return prev + step;
            });
        }, 16); // ~60fps for smoother counting

        return () => clearInterval(timer);
    }, [progress, displayProgress]);

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative" style={{ width: size, height: size }}>
                {/* Background Circle */}
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        className="text-gray-200 dark:text-gray-800"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Percentage Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-gray-700 dark:text-gray-200">
                        {Math.round(displayProgress)}%
                    </span>
                </div>
            </div>
            {text && <p className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-wider">{text}</p>}
        </div>
    );
};
