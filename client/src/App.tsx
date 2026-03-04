import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Spline from "@splinetool/react-spline";
/**
 * Lazy-loaded pages
 */
import "./index.css";

const Landing = lazy(() => import("./pages/Landing"));
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import BulkEmail from "./pages/BulkEmail";
import SingleEmail from "./pages/SingleMail";
import MassEmail from "./pages/MassEmail";
import Pricing from "./pages/Pricing";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import UploadTemplate from "./pages/UploadTemplate";
import TemplateList from "./pages/TemplateList";

import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { ThemeProvider } from "./context/ThemeContext";

import { RoleRoute } from "./components/RoleRoute";
import { PermissionRoute } from "./components/PermissionRoute";
import SuperAdmin from "./pages/SuperAdmin/SuperAdmin";
import EmailHistory from "./pages/SuperAdmin/EmailHistory";
import SuperDashboard from "./pages/SuperAdmin/SuperDashboard";
import CampaignList from "./pages/SuperAdmin/CampaignList";
import CampaignDetails from "./pages/SuperAdmin/CampaignDetails";
import UserCampaignDetails from "./pages/UserCampaignDetails";

import { NotificationProvider } from "./context/NotificationContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <DataProvider>
            <BrowserRouter>
              <Suspense
                fallback={
                  <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
                    Loading MailFlow…
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Signup />} />
                  {/* The original /admin-campaigns route is moved and wrapped below */}


                  <Route element={<RoleRoute allowedRoles={["Superadmin"]} />}>
                    {/* Original routes */}
                    <Route path="/admin-users" element={<SuperAdmin />} />
                    <Route path="/admin-dashboard" element={<SuperDashboard />} />
                    <Route path="/admin-history" element={<EmailHistory />} />
                    <Route path="/admin-campaigns" element={<CampaignList />} />
                    <Route path="/admin/campaigns/:id" element={<CampaignDetails />} />
                    {/* New and modified routes based on instruction */}
                  </Route>

                  <Route element={<RoleRoute allowedRoles={["User", "Admin"]} />}>
                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route element={<PermissionRoute requiredPermission="Email Sanitization" />}>
                      <Route path="/bulk-email" element={<BulkEmail />} />
                      <Route path="/single-email" element={<SingleEmail />} />
                    </Route>

                    <Route element={<PermissionRoute requiredPermission="Bulk Mailing" />}>
                      <Route path="/campaigns" element={<MassEmail />} />
                    </Route>

                    <Route element={<PermissionRoute requiredPermission="Upload Template" />}>
                      <Route path="/upload-template" element={<UploadTemplate />} />
                      <Route path="/templates" element={<TemplateList />} />
                    </Route>

                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/reports/campaign/:id" element={<UserCampaignDetails />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}