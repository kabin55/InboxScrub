import { motion } from "framer-motion";

const STEPS = [
  {
    id: 1,
    title: "Upload Your Email List",
    desc: "Securely upload your .txt or CSV files. Our system handles large volumes with ease and accuracy."
  },
  {
    id: 2,
    title: "Sanitize & Validate",
    desc: "Automatically remove invalid, duplicate, and high-risk emails, ensuring a clean and effective list."
  },
  {
    id: 3,
    title: "Send Targeted Campaigns",
    desc: "Utilize your verified lists to launch powerful and personalized mass email campaigns."
  },
  {
    id: 4,
    title: "View Comprehensive Reports",
    desc: "Track campaign performance, credit usage, and list health with detailed, easy-to-understand reports."
  }
];

export const HowItWorks = () => {
  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-24 transition-colors duration-300">
      <div className="mx-auto max-w-5xl px-6">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            How MailFlow Works
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            A simple, 4-step process to transform your email outreach.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-12 md:grid-cols-2 relative">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-start gap-6 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-100 dark:shadow-none">
                {step.id}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {step.title}
                </h3>
                <p className="mt-2 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
