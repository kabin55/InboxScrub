import {
  ShieldCheck,
  Send,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "Email Sanitizer",
    desc: "Clean your email lists by removing invalid, disposable, and risky addresses to improve deliverability.",
    icon: ShieldCheck,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Mass Email Sender",
    desc: "Launch targeted email campaigns to your verified lists with ease and track performance.",
    icon: Send,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    title: "Credit-based System",
    desc: "Flexible pay-as-you-go pricing that fits your needs for verification and email sending.",
    icon: CreditCard,
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    title: "History & Reports",
    desc: "Access detailed logs and analytics for all your email sanitization and campaign activities.",
    icon: BarChart3,
    color: "text-blue-700",
    bg: "bg-blue-100/50",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-white dark:bg-gray-950 transition-colors duration-300 relative">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Our Core Features
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
            Everything you need to manage your email marketing with confidence and precision.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm transition-all hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900"
              >
                {/* Glow Effect on Hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} dark:bg-blue-900/20 mb-6 transition-transform group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 ${feature.color} dark:text-blue-400`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

