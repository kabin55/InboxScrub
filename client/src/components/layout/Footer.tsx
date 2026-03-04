import { Container } from "./Container";
import { Mail, Github, Twitter, Linkedin } from "lucide-react";
import { motion } from "framer-motion";

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <Container className="py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid gap-12 md:grid-cols-4"
        >
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">MailFlow</span>
            </div>

            <p className="mt-6 text-base leading-relaxed text-gray-500 dark:text-gray-400">
              The professional choice for email list hygiene and high-delivery mass mailing.
            </p>

            <div className="mt-8 flex gap-5">
              <Twitter className="h-5 w-5 cursor-pointer hover:text-blue-400 transition-colors" />
              <Github className="h-5 w-5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors" />
              <Linkedin className="h-5 w-5 cursor-pointer hover:text-blue-600 transition-colors" />
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li className="hover:text-blue-600 dark:hover:text-white cursor-pointer transition-colors">Email Verifier</li>
              <li className="hover:text-blue-600 dark:hover:text-white cursor-pointer transition-colors">Mass Sender</li>
              <li className="hover:text-blue-600 dark:hover:text-white cursor-pointer transition-colors">API Access</li>
              <li className="hover:text-blue-600 dark:hover:text-white cursor-pointer transition-colors">Pricing</li>
            </ul>
          </div>

          <div>
            <h4 className="text-gray-900 dark:text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm">
              <li className="hover:text-blue-600 dark:hover:text-white cursor-pointer transition-colors">About Us</li>
              <li className="hover:text-blue-600 dark:hover:text-white cursor-pointer transition-colors">Careers</li>
              <li className="hover:text-blue-600 dark:hover:text-white cursor-pointer transition-colors">Press Kit</li>
              <li className="hover:text-blue-600 dark:hover:text-white cursor-pointer transition-colors">Privacy</li>
            </ul>
          </div>

          <div>
            <h4 className="text-gray-900 dark:text-white font-bold mb-6">Newsletter</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Get the latest updates on deliverability and growth.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Email address"
                className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-l-lg px-4 py-2 text-sm w-full focus:ring-1 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg text-sm font-semibold transition-colors">
                Join
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
          <p>© 2026 MailFlow Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <span className="hover:text-gray-900 dark:hover:text-gray-300 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-gray-900 dark:hover:text-gray-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-gray-900 dark:hover:text-gray-300 cursor-pointer transition-colors">Cookie Settings</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};
