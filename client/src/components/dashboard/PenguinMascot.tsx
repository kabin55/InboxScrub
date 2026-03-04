import { motion } from "framer-motion";
import PenguinImg from "../../assets/penguin-3d.png";

interface PenguinMascotProps {
    mood?: "happy" | "neutral" | "sad";
}

export function PenguinMascot({ mood = "happy" }: PenguinMascotProps) {
    return (
        <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            {/* Soft glow behind penguin */}
            <motion.div
                className="absolute w-48 h-48 rounded-full bg-blue-200/40 blur-3xl"
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Penguin */}
            <motion.img
                src={PenguinImg}
                alt="Penguin Mascot"
                className="relative z-10 max-h-72 select-none"
                animate={{
                    y: [0, -12, 0],
                    rotate: mood === "happy" ? [0, 1.5, -1.5, 0] : 0,
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                whileHover={{
                    scale: 1.05,
                    rotate: 2,
                }}
                draggable={false}
            />
        </motion.div>
    );
}
