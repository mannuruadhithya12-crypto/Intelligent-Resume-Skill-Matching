import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiUser, FiBell, FiLock, FiShield, FiMoon, FiMonitor, FiCheck, FiArrowLeft, FiX } from 'react-icons/fi';
import { getSettings, updateSettings, changePassword, getLoginHistory } from '../api';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { theme, changeTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');

    // Theme logic handled by Context now

    const handleBack = () => navigate(-1);

    const handleBackgroundClick = (e) => {
        // Close if clicking the background wrapper (outside the card)
        if (e.target === e.currentTarget) {
            navigate(-1);
        }
    };

    return (
        <div onClick={handleBackgroundClick} className="flex flex-col h-full cursor-default -m-8 p-8 transition-colors">
            <div className="mb-6 flex items-center justify-between max-w-6xl mx-auto w-full">
                <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-bold transition-colors px-4 py-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10">
                    <FiArrowLeft size={20} /> Back to Dashboard
                </button>
                <button onClick={handleBack} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors">
                    <FiX size={24} />
                </button>
            </div>

            <div className="bg-white dark:bg-bg-card rounded-2xl border border-slate-200 dark:border-border-subtle shadow-xl flex overflow-hidden min-h-[600px] flex-1 max-w-6xl mx-auto w-full animate-scale-in transition-colors">
                {/* Settings Sidebar */}
                <div className="w-64 bg-slate-50 dark:bg-bg-deep border-r border-slate-200 dark:border-border-subtle p-6 flex flex-col gap-1 transition-colors">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 px-3">Settings</h2>
                    <SidebarItem
                        icon={<FiUser />} label="Profile" active={activeTab === 'profile'}
                        onClick={() => setActiveTab('profile')}
                    />
                    <SidebarItem
                        icon={<FiBell />} label="Notifications" active={activeTab === 'notifications'}
                        onClick={() => setActiveTab('notifications')}
                    />
                    <SidebarItem
                        icon={<FiLock />} label="Security" active={activeTab === 'security'}
                        onClick={() => setActiveTab('security')}
                    />
                    <SidebarItem
                        icon={<FiMonitor />} label="Appearance" active={activeTab === 'appearance'}
                        onClick={() => setActiveTab('appearance')}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'profile' && <ProfileSettings />}
                    {activeTab === 'notifications' && <NotificationSettings />}
                    {activeTab === 'security' && <SecuritySettings />}
                    {activeTab === 'appearance' && <AppearanceSettings theme={theme} setTheme={changeTheme} />}
                </div>
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left w-full ${active
                ? 'bg-white dark:bg-bg-card text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-border-subtle'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

// --- SUB PAGES ---

function ProfileSettings() {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.full_name || user?.name || 'Alex Rivera',
        email: user?.email || 'alex.rivera@company.com',
        role: user?.role || 'Lead Recruiter',
        location: user?.location || 'San Francisco, CA',
        avatar: user?.avatar || ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                alert("File size exceeds 1MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setSuccess(false);
        // Call auth context update
        await updateUser({
            name: formData.name,
            full_name: formData.name,
            email: formData.email,
            role: formData.role,
            location: formData.location,
            avatar: formData.avatar
        });
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="max-w-2xl animate-fade-in">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Profile Settings</h3>

            <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shadow-sm relative">
                    <img
                        src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <label className="px-4 py-2 bg-white dark:bg-bg-deep border border-slate-300 dark:border-border-subtle rounded-lg text-slate-700 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer inline-block">
                        Change Avatar
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Full Name</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-bg-deep border border-slate-200 dark:border-border-subtle rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-700 dark:text-white font-medium" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Role</label>
                        <input name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-bg-deep border border-slate-200 dark:border-border-subtle rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-700 dark:text-white font-medium" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Email Address</label>
                    <input name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-bg-deep border border-slate-200 dark:border-border-subtle rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-700 dark:text-white font-medium" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Location</label>
                    <input name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 dark:bg-bg-deep border border-slate-200 dark:border-border-subtle rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-700 dark:text-white font-medium" />
                </div>

                <div className="pt-6 flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-70"
                    >
                        {loading ? 'Saving...' : <><FiSave /> Save Changes</>}
                    </button>
                    {success && <span className="text-emerald-600 font-bold flex items-center gap-2 animate-fade-in"><FiCheck /> Saved Successfully</span>}
                </div>
            </div>
        </div>
    );
}

function NotificationSettings() {
    const [toggles, setToggles] = useState({ email: true, push: true, weekly: false });

    useEffect(() => {
        getSettings().then(s => {
            if (s.notifications) setToggles(s.notifications);
        });
    }, []);

    const toggle = async (k) => {
        const newState = { ...toggles, [k]: !toggles[k] };
        setToggles(newState);
        // Persist
        try {
            const current = await getSettings();
            await updateSettings({ ...current, notifications: newState });
        } catch (e) {
            console.error("Failed to save settings", e);
        }
    };

    return (
        <div className="max-w-2xl animate-fade-in">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Notifications</h3>

            <div className="space-y-6">
                <ToggleRow
                    label="Email Notifications"
                    sub="Receive analysis reports via email."
                    checked={toggles.email}
                    onChange={() => toggle('email')}
                />
                <ToggleRow
                    label="Push Notifications"
                    sub="Real-time alerts for completed jobs."
                    checked={toggles.push}
                    onChange={() => toggle('push')}
                />
                <ToggleRow
                    label="Weekly Digest"
                    sub="Summary of all hiring activities."
                    checked={toggles.weekly}
                    onChange={() => toggle('weekly')}
                />
            </div>
        </div>
    );
}

function SecuritySettings() {
    const [isEditing, setIsEditing] = useState(false);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [showActivity, setShowActivity] = useState(false);
    const [activityData, setActivityData] = useState([]);

    useEffect(() => {
        if (showActivity) {
            getLoginHistory().then(data => setActivityData(data)).catch(console.error);
        }
    }, [showActivity]);

    const handleUpdate = async () => {
        if (!passData.current || !passData.new) {
            setMsg({ type: 'error', text: "Please fill in all fields" });
            return;
        }
        if (passData.new !== passData.confirm) {
            setMsg({ type: 'error', text: "New passwords don't match" });
            return;
        }
        setLoading(true);
        setMsg({ type: '', text: '' });
        try {
            await changePassword(passData.current, passData.new);
            setMsg({ type: 'success', text: 'Password updated successfully' });
            setTimeout(() => {
                setIsEditing(false);
                setPassData({ current: '', new: '', confirm: '' });
                setMsg({ type: '', text: '' });
            }, 2000);
        } catch (e) {
            console.error(e);
            setMsg({ type: 'error', text: e.response?.data?.detail || "Failed to update password" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl animate-fade-in">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Security</h3>
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-lg flex gap-3 text-amber-800 dark:text-amber-400 mb-6">
                <FiShield className="mt-1 flex-shrink-0" />
                <div>
                    <p className="font-bold">Two-Factor Authentication is disabled</p>
                    <p className="text-sm mt-1">We recommend enabling 2FA for account safety.</p>
                </div>
            </div>

            {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-blue-600 dark:text-blue-400 font-bold hover:underline mb-4 block">Change Password</button>
            ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-border-subtle mb-6 animate-fade-in-up">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4">Change Password</h4>
                    {msg.text && (
                        <div className={`p-3 rounded-lg text-sm font-bold mb-4 border ${msg.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'}`}>
                            {msg.text}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Current Password</label>
                            <input type="password"
                                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-bg-deep border border-slate-200 dark:border-border-subtle text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                value={passData.current} onChange={e => setPassData({ ...passData, current: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">New Password</label>
                                <input type="password"
                                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-bg-deep border border-slate-200 dark:border-border-subtle text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={passData.new} onChange={e => setPassData({ ...passData, new: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Confirm Password</label>
                                <input type="password"
                                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-bg-deep border border-slate-200 dark:border-border-subtle text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={passData.confirm} onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={handleUpdate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition hover:-translate-y-0.5 shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:hover:translate-y-0">
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white font-bold transition">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 border-t border-slate-100 dark:border-border-subtle pt-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><FiMonitor /> Login Activity</h4>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Monitor recent sessions and device access.</p>
                    </div>
                    <button
                        onClick={() => setShowActivity(!showActivity)}
                        className="px-4 py-2 border border-slate-200 dark:border-border-subtle rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-white flex items-center gap-2"
                    >
                        {showActivity ? 'Hide Activity' : 'View Activity'}
                    </button>
                </div>

                {showActivity && (
                    <div className="bg-slate-50 dark:bg-bg-deep/50 border border-slate-200 dark:border-border-subtle rounded-xl overflow-hidden animate-fade-in-up shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800/50 text-xs uppercase font-black text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-border-subtle">
                                <tr>
                                    <th className="px-5 py-3">Device & IP</th>
                                    <th className="px-5 py-3">Location</th>
                                    <th className="px-5 py-3">Last Active</th>
                                    <th className="px-5 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                {activityData.length > 0 ? activityData.map((a, i) => (
                                    <tr key={i} className="hover:bg-white dark:hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">
                                            <div className="flex flex-col">
                                                <span>{a.user_agent ? (a.user_agent.includes('Chrome') ? 'Chrome' : a.user_agent.includes('Firefox') ? 'Firefox' : a.user_agent.includes('Safari') ? 'Safari' : 'Browser') : 'Unknown Device'}</span>
                                                <span className="text-xs font-mono text-slate-400 font-normal">{a.ip_address}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600 dark:text-gray-300">{a.location || 'Unknown'}</td>
                                        <td className="px-5 py-3 text-slate-600 dark:text-gray-300 font-medium">
                                            {new Date(a.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            {i === 0 ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400">{a.status === 'success' ? 'Signed Out' : 'Failed'}</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-5 py-8 text-center text-slate-500 italic">No activity recorded yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function AppearanceSettings({ theme, setTheme }) {
    return (
        <div className="max-w-2xl animate-fade-in">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Appearance</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Customize your workspace appearance.</p>
            <div className="flex gap-4">
                <button
                    onClick={() => setTheme('light')}
                    className={`w-32 h-20 border-2 rounded-lg flex items-center justify-center font-bold transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500'}`}
                >
                    Light
                </button>
                <button
                    onClick={() => setTheme('dark')}
                    className={`w-32 h-20 border-2 rounded-lg flex items-center justify-center font-bold transition-all ${theme === 'dark' ? 'border-blue-500 bg-slate-900 text-white' : 'border-slate-200 dark:border-border-subtle bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                >
                    Dark
                </button>
            </div>
        </div>
    );
}

function ToggleRow({ label, sub, checked, onChange }) {
    return (
        <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-border-subtle rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <div>
                <p className="font-bold text-slate-900 dark:text-white">{label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{sub}</p>
            </div>
            <div
                onClick={onChange}
                className={`w-12 h-6 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition-colors duration-300 ${checked ? 'bg-emerald-500' : ''}`}
            >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : ''}`}></div>
            </div>
        </div>
    );
}
