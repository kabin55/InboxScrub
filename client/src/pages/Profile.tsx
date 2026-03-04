import { useState, useEffect } from "react";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Topbar } from "../components/dashboard/Topbar";
import { User, Mail, Camera, Loader2, Calendar, Shield } from "lucide-react";
import { getUserProfile, updateUserProfile, type UserProfile } from "../api/profile";

export default function Profile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getUserProfile();
                setProfile(data);
                setName(data.user.name);
            } catch (err) {
                setError("Failed to load profile");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const updated = await updateUserProfile({ name: name.trim() });
            setProfile(updated);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError("Failed to save changes");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-[#fafafa] dark:bg-gray-950 min-h-screen transition-colors duration-300">
            <Sidebar />
            <Topbar />

            <main className="ml-64 pt-20 p-8">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            Your Profile
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account information and preferences.</p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
                            <p className="text-gray-400 dark:text-gray-500 font-medium">Loading profile...</p>
                        </div>
                    ) : error && !profile ? (
                        <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-100 dark:border-red-900/20">
                            <p className="font-bold">{error}</p>
                        </div>
                    ) : profile ? (
                        <>
                            {/* Profile Card */}
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors duration-300">
                                {/* Avatar Section */}
                                <div className="flex items-center gap-8 pb-8 border-b border-gray-100 dark:border-gray-800">
                                    <div className="relative group">
                                        <div className="h-24 w-24 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                                            {profile.user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'JD'}
                                        </div>
                                        <button className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <Camera className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.user.name || 'User'}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                            <Mail className="w-4 h-4" />
                                            {profile.user.email}
                                        </p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="inline-block px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-100 dark:border-green-900/30">
                                                Verified Account
                                            </span>
                                            {profile.user.oauth_provider === 'google' && (
                                                <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-100 dark:border-blue-900/30">
                                                    Google
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="pt-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={profile.user.email}
                                                readOnly
                                                className="w-full rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 px-4 py-4 text-sm text-gray-900 dark:text-gray-300 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Credits Info */}
                                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/20">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Available Credits</p>
                                                <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{profile.credits.balance.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Purchased</p>
                                                <p className="text-lg font-bold text-gray-600 dark:text-gray-400">{profile.credits.total_purchased.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/20">
                                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Mass Mailing Credits</p>
                                            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{profile.credits.massMalingCredits?.toLocaleString() ?? 0}</p>
                                        </div>
                                    </div>

                                    {/* Account Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Member since {new Date(profile.user.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4" />
                                            OAuth: {profile.user.oauth_provider}
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/20">
                                            {error}
                                        </div>
                                    )}
                                    {success && (
                                        <div className="bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 p-3 rounded-xl text-sm font-medium border border-green-100 dark:border-green-900/20">
                                            Profile updated successfully!
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving || name === profile.user.name}
                                            className="px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}

                    {/* Footer */}
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-8">
                        © 2026 MailFlow. All rights reserved.
                    </p>
                </div>
            </main>
        </div>
    );
}
