import { motion } from "framer-motion";
import { CheckCircle2, Shield, Globe, Server, UserX, Mail } from "lucide-react";

export const ParameterSlider = () => {
    const parameters = [
        {
            icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
            title: "Syntax Check",
            description: "Ensures the email address follows standard formatting rules (RFC 5322)."
        },
        {
            icon: <Globe className="w-8 h-8 text-blue-500" />,
            title: "Domain Validation",
            description: "Verifies that the domain name actually exists and is registered."
        },
        {
            icon: <Server className="w-8 h-8 text-purple-500" />,
            title: "MX Record Check",
            description: "Checks if the domain has valid Mail Exchange records to receive emails."
        },
        {
            icon: <Shield className="w-8 h-8 text-indigo-500" />,
            title: "SMTP Verification",
            description: "Connects to the mail server to verify if the specific mailbox exists."
        },
        {
            icon: <UserX className="w-8 h-8 text-red-400" />,
            title: "Disposable Check",
            description: "Detects temporary or throwaway email addresses to improve list quality."
        },
        {
            icon: <Mail className="w-8 h-8 text-orange-400" />,
            title: "Role-Based Detection",
            description: "Flags generic addresses like admin@, support@ which may have low open rates."
        }
    ];

    // Duplicate parameters for infinite effect
    const duplicatedParameters = [...parameters, ...parameters];

    return (
        <section className="py-24 relative overflow-hidden bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-950 dark:to-gray-900 transition-colors duration-300">
            <div className="container mx-auto px-4 z-10 relative mb-16">
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-800"
                    >
                        Quality Assurance
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-gray-100 mb-6 tracking-tight">
                        Comprehensive <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">7-Step Verification</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
                        We don't just check if an email looks right. We perform deep analysis on every single address to ensure maximum deliverability.
                    </p>
                </div>
            </div>

            {/* Infinite Slider */}
            <div className="flex overflow-hidden relative">
                <motion.div
                    className="flex gap-6 px-4"
                    animate={{
                        x: [0, -1920], // Adjust based on content width
                    }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    {duplicatedParameters.map((param, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 w-[350px] bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white dark:border-gray-700 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_20px_50px_rgba(59,130,246,0.1)] transition-all duration-500 group"
                        >
                            <div className="mb-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-600 group-hover:scale-110 transition-transform duration-500">
                                {param.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{param.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{param.description}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Gradient Fades */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#fafafa] to-transparent dark:from-gray-950 z-10"></div>
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#fafafa] to-transparent dark:from-gray-950 z-10"></div>
            </div>
        </section>
    );
};
