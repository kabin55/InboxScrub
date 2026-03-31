import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { googleLogin } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { Mail, Lock, User, ArrowRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { addToast } = useNotification();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignup = async (
    credentialResponse: CredentialResponse
  ): Promise<void> => {
    try {
      if (!credentialResponse.credential) {
        addToast("error", "Google signup failed: no credential.");
        return;
      }

      setIsLoading(true);
      const response = await googleLogin(credentialResponse.credential);
      setUser(response.user);
      addToast("success", "Signup successful!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      addToast("error", err.response?.data?.message || "Signup Failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log("Signup with:", name, email, password);
      addToast("warning", "Manual signup not implemented yet");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4 overflow-hidden transition-colors duration-300">
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-[120px] opacity-60" />
      </div>

      {/* Back to Home */}
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[460px] my-10"
      >
        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-10 shadow-2xl shadow-blue-100/50 dark:shadow-none border border-white dark:border-gray-800 transition-colors duration-300">

          {/* Header */}
          <div className="mb-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200 dark:shadow-none"
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              Create Account
            </h1>
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">
              Join MailFlow and start managing your emails with precision
            </p>
          </div>

          {/* Google Signup */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center w-full mb-8"
          >
            <div className="w-full max-w-[300px]">
              <GoogleLogin
                onSuccess={handleGoogleSignup}
                onError={() => addToast("error", "Google signup failed")}
                useOneTap
                theme="outline"
                shape="pill"
                size="large"
                width="300"
                text="signup_with"
              />
            </div>
          </motion.div>

          {/* Divider */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">or use email</span>
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex items-start gap-3">
              <div className="mt-0.5">
                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold italic">i</div>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-200 font-medium leading-relaxed">
                Please use <span className="font-bold">Google Authentication</span> to create your account. Manual signup is currently disabled.
              </p>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleManualSignup}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                Full Name
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 pl-12 pr-4 py-4 text-sm font-medium focus:border-blue-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all outline-none text-gray-900 dark:text-gray-100"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 pl-12 pr-4 py-4 text-sm font-medium focus:border-blue-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all outline-none text-gray-900 dark:text-gray-100"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 pl-12 pr-4 py-4 text-sm font-medium focus:border-blue-600 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all outline-none text-gray-900 dark:text-gray-100"
                />
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-blue-200 dark:shadow-none disabled:opacity-70"
            >
              {isLoading ? "Creating account..." : "Create Account"}
              {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-500 group-hover:translate-x-full" />
            </motion.button>
          </form>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 text-center text-sm text-gray-500"
          >
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-blue-600 hover:text-blue-700 transition-colors underline-offset-4 hover:underline"
            >
              Sign In
            </Link>
          </motion.p>
        </div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-xs text-gray-400 mt-10"
        >
          © 2026 MailFlow. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Signup;