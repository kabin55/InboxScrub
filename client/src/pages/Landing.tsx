import { Footer } from "../components/layout/Footer";
import { Hero } from "../components/sections/Hero";
import { HowItWorks } from "../components/sections/HowItWorks";
import { Features } from "../components/sections/Features";
import { Navbar } from "../components/layout/Navbar";
import { ParameterSlider } from "../components/sections/ParameterSlider";
import { motion } from "framer-motion";
import { Users, Zap, ShieldCheck, Globe } from "lucide-react";

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-gray-950 overflow-hidden transition-colors duration-300">
      {/* Lava Lamp Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <motion.div
          animate={{
            x: [0, 150, 0],
            y: [0, -100, 0],
            scale: [1, 1.4, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-purple-300/30 to-blue-200/20 dark:from-purple-900/20 dark:to-blue-900/10 rounded-full filter blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, -200, 0],
            y: [0, 150, 0],
            scale: [1, 1.6, 1],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
            delay: 2
          }}
          className="absolute top-[30%] right-[-5%] w-[700px] h-[700px] bg-gradient-to-tr from-blue-300/20 to-indigo-200/30 dark:from-blue-900/10 dark:to-indigo-900/20 rounded-full filter blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 100, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
            delay: 5
          }}
          className="absolute bottom-[-15%] left-[10%] w-[800px] h-[800px] bg-gradient-to-bl from-pink-300/20 to-purple-200/20 dark:from-pink-900/10 dark:to-purple-900/20 rounded-full filter blur-[140px]"
        />
      </div>

      <div className="relative z-10">
        <Navbar />
        <Hero />

        {/* Statistics Section */}
        <section className="py-12 border-y border-gray-100 dark:border-gray-800 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm transition-colors duration-300">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />, label: "Happy Users", value: "50,000+" },
                { icon: <Zap className="w-5 h-5 text-orange-500 dark:text-orange-400" />, label: "EMAILS CLEANED", value: "10M+" },
                { icon: <ShieldCheck className="w-5 h-5 text-green-500 dark:text-green-400" />, label: "Accuracy", value: "99.9%" },
                { icon: <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />, label: "GLOBAL SERVERS", value: "24/7" },
              ].map((stat, i) => (
                <div key={i} className="text-center group">
                  <div className="flex justify-center mb-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 mb-1">{stat.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ParameterSlider />
        <Features />
        <HowItWorks />
        <Footer />
      </div>
    </div>
  );
}
