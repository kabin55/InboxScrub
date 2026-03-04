import { Button } from "../ui/Button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export const Hero = () => {
  const navigate = useNavigate();

  const handleScrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      {/* Refined Background Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-30 blur-[100px]">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-400 rounded-full" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-400 rounded-full" />
        </div>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.03]"
          style={{
            backgroundImage: "url('../../images/hero-bg.png')",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block rounded-full bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 text-xs font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase mb-6">
            The Ultimate Email Solution
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 leading-[1.1]">
            Clean, Verify & Send <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Emails at Scale
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
        >
          Streamline your email management with precision. Ensure pristine lists
          and better campaign performance with our AI-powered sanitization.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex flex-col sm:flex-row justify-center gap-4"
        >
          <Button
            className="text-base px-8 py-4 rounded-full"
            onClick={() => navigate("/login")}
          >
            Get Started Free
          </Button>
          <Button
            variant="secondary"
            className="text-base px-8 py-4 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm dark:text-gray-200"
            onClick={handleScrollToFeatures}
          >
            View Features
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

