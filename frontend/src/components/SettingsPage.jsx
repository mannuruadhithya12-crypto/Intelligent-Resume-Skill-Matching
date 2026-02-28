import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiUser, FiBell, FiLock, FiShield, FiMonitor, FiCheck, FiArrowLeft, FiX, FiActivity, FiGlobe } from 'react-icons/fi';
import { getSettings, updateSettings, changePassword, getLoginHistory } from '../api';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');

    const handleBack = () => navigate(-1);

    const handleBackgroundClick = (e) => {
        if (e.target === e.currentTarget) {
            navigate(-1);
        }
    };

    return (
        <div onClick={handleBackgroundClick} className="flex flex-col h-full cursor-default -m-8 p-8 transition-colors bg-[#050B14]">
            <div className="mb-6 flex items-center justify-between max-w-6xl mx-auto w-full animate-fade-in">
                <button onClick={handleBack} className="flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-colors px-4 py-2 rounded-xl hover:bg-[#0f172a] border border-transparent hover:border-gray-800">
                    <FiArrowLeft size={20} /> Back to Dashboard
                </button>
                <button onClick={handleBack} className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-[#0f172a] transition-colors border border-transparent hover:border-gray-800">
                    <FiX size={24} />
                </button>
            </div>

            <div className="bg-[#0f172a] rounded-3xl border border-gray-800 shadow-card flex overflow-hidden min-h-[700px] flex-1 max-w-6xl mx-auto w-full animate-scale-in transition-colors relative">

                {/* Subtle top gradient bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-primary to-purple-600 opacity-80"></div>

                {/* Settings Sidebar */}
                <div className="w-72 bg-[#050B14] border-r border-gray-800 p-8 flex flex-col gap-2 transition-colors relative z-10">
                    <h2 className="text-2xl font-display font-black text-white mb-8 tracking-tight px-2">Preferences</h2>
                    <SidebarItem
                        icon={<FiUser size={18} />} label="Professional Profile" active={activeTab === 'profile'}
                        onClick={() => setActiveTab('profile')}
                    />
                    <SidebarItem
                        icon={<FiBell size={18} />} label="Alerts & Digests" active={activeTab === 'notifications'}
                        onClick={() => setActiveTab('notifications')}
                    />
                    <SidebarItem
                        icon={<FiLock size={18} />} label="Access & Security" active={activeTab === 'security'}
                        onClick={() => setActiveTab('security')}
                    />
                    <SidebarItem
                        icon={<FiMonitor size={18} />} label="Workspace UI" active={activeTab === 'appearance'}
                        onClick={() => setActiveTab('appearance')}
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 p-10 lg:p-12 overflow-y-auto bg-[#0f172a] relative z-10 styled-scrollbar">
                    {activeTab === 'profile' && <ProfileSettings user={user} updateUser={updateUser} />}
                    {activeTab === 'notifications' && <NotificationSettings />}
                    {activeTab === 'security' && <SecuritySettings />}
                    {activeTab === 'appearance' && <AppearanceSettings theme={theme} />}
                </div>
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all text-left w-full border ${active
                ? 'bg-[#0f172a] text-primary border-gray-800 shadow-sm'
                : 'border-transparent text-gray-500 hover:bg-[#0f172a]/50 hover:text-gray-300'
                }`}
        >
            <div className={`${active ? 'text-primary-glow' : 'text-gray-500'}`}>{icon}</div>
            {label}
        </button>
    );
}

// --- SUB PAGES ---

function ProfileSettings({ user, updateUser }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.full_name || user?.name || 'Administrator',
        email: user?.email || 'admin@recruitai.enterprise',
        role: user?.role || 'Lead Recruiter',
        location: user?.location || 'San Francisco, CA',
        avatar: user?.avatar || ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                alert("File size exceeds 1MB limitation for avatar cache.");
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
        if (updateUser) {
            await updateUser({
                name: formData.name,
                full_name: formData.name,
                email: formData.email,
                role: formData.role,
                location: formData.location,
                avatar: formData.avatar
            });
        }
        // Simulated network delay for professional feel if updateUser is fast/mocked
        await new Promise(r => setTimeout(r, 600));
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="max-w-2xl animate-fade-in-up">
            <h3 className="text-3xl font-display font-black text-white mb-2 tracking-tight">Professional Profile</h3>
            <p className="text-gray-400 mb-10 text-sm">Manage your enterprise identity and corporate contact details.</p>

            <div className="flex items-center gap-8 mb-10 bg-[#050B14] p-6 rounded-2xl border border-gray-800 shadow-inner">
                <div className="w-24 h-24 rounded-2xl bg-[#0f172a] border border-gray-700 overflow-hidden shadow-sm relative group">
                    <img
                        src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`}
                        alt="Avatar"
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                </div>
                <div>
                    <label className="px-5 py-2.5 bg-[#0f172a] border border-gray-700 rounded-xl text-gray-300 font-bold hover:bg-gray-800 hover:text-white transition-all cursor-pointer inline-block shadow-sm">
                        Upload New Photo
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-3 flex items-center gap-1.5"><FiGlobe /> Supported formats: JPG, PNG (Max 1MB)</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Legal/Full Name</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full px-5 py-3.5 bg-[#050B14] border border-gray-800 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-white font-medium" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Corporate Role</label>
                        <input name="role" value={formData.role} onChange={handleChange} className="w-full px-5 py-3.5 bg-[#050B14] border border-gray-800 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-white font-medium" />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Enterprise Email Address</label>
                    <input name="email" value={formData.email} onChange={handleChange} className="w-full px-5 py-3.5 bg-[#050B14] border border-gray-800 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-gray-400 font-medium cursor-not-allowed" disabled />
                    <p className="text-xs text-gray-600 mt-2 italic">Email cannot be modified without IT administrator approval.</p>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Office Location</label>
                    <input name="location" value={formData.location} onChange={handleChange} className="w-full px-5 py-3.5 bg-[#050B14] border border-gray-800 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-white font-medium" />
                </div>

                <div className="pt-8 flex items-center gap-4 border-t border-gray-800">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:scale-[1.02] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Syncing...</span> : <><FiSave /> Save Identity Configuration</>}
                    </button>
                    {success && <span className="text-emerald-400 font-bold flex items-center gap-2 animate-fade-in bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20"><FiCheck /> Profile Synchronized</span>}
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
            console.error("Failed to sync toggles", e);
        }
    };

    return (
        <div className="max-w-2xl animate-fade-in-up">
            <h3 className="text-3xl font-display font-black text-white mb-2 tracking-tight">Alerts & Digests</h3>
            <p className="text-gray-400 mb-10 text-sm">Configure how RecruitAI communicates important hiring events.</p>

            <div className="space-y-4">
                <ToggleRow
                    label="Email Notifications"
                    sub="Receive full breakdown analysis reports via enterprise email."
                    checked={toggles.email}
                    onChange={() => toggle('email')}
                />
                <ToggleRow
                    label="Push Notifications"
                    sub="Real-time browser alerts for completed AI parsing jobs."
                    checked={toggles.push}
                    onChange={() => toggle('push')}
                />
                <ToggleRow
                    label="Weekly Executive Digest"
                    sub="High-level summary of all hiring activities and AI metrics."
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
            setMsg({ type: 'error', text: "Please enter your cryptographic credentials." });
            return;
        }
        if (passData.new !== passData.confirm) {
            setMsg({ type: 'error', text: "Verification tokens do not match." });
            return;
        }
        setLoading(true);
        setMsg({ type: '', text: '' });
        try {
            await changePassword(passData.current, passData.new);
            setMsg({ type: 'success', text: 'Authentication token updated successfully in the vault.' });
            setTimeout(() => {
                setIsEditing(false);
                setPassData({ current: '', new: '', confirm: '' });
                setMsg({ type: '', text: '' });
            }, 3000);
        } catch (e) {
            console.error(e);
            setMsg({ type: 'error', text: e.response?.data?.detail || "Vault connection failed. Token rejected." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl animate-fade-in-up">
            <h3 className="text-3xl font-display font-black text-white mb-2 tracking-tight">Access & Security</h3>
            <p className="text-gray-400 mb-10 text-sm">Manage security protocols, passwords, and track system access.</p>

            <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex gap-4 text-amber-500 mb-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mt-10 -mr-10 pointer-events-none"></div>
                <div className="p-2 bg-[#0f172a] rounded-xl self-start text-amber-500 border border-amber-500/20 shadow-inner">
                    <FiShield size={20} />
                </div>
                <div className="relative z-10">
                    <p className="font-bold text-base mb-1 tracking-wide">Multi-Factor Authentication (MFA) Inactive</p>
                    <p className="text-xs text-amber-500/80 font-medium">Your corporate policy highly recommends enabling MFA logic via Authenticator app. Please contact your administrator if you need a hardware key setup.</p>
                </div>
            </div>

            {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-[#050B14] border border-gray-800 text-white font-bold rounded-xl hover:bg-gray-800 hover:border-gray-700 transition-all flex items-center gap-2 shadow-sm">
                    <FiLock /> Update Cryptographic Password
                </button>
            ) : (
                <div className="bg-[#050B14] p-8 rounded-2xl border border-gray-800 mb-8 animate-fade-in-up shadow-inner relative">
                    <h4 className="font-bold text-white text-lg mb-6 tracking-wide">Change Security Token</h4>
                    {msg.text && (
                        <div className={`p-4 rounded-xl text-sm font-bold mb-6 border flex items-center gap-3 ${msg.type === 'error' ? 'bg-[#0f172a] text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-[#0f172a] text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
                            {msg.type === 'error' ? <div className="p-1 bg-red-500/20 rounded-md"><FiX size={16} /></div> : <div className="p-1 bg-emerald-500/20 rounded-md"><FiCheck size={16} /></div>}
                            {msg.text}
                        </div>
                    )}
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Current Token</label>
                            <input type="password"
                                className="w-full px-5 py-3.5 rounded-xl bg-[#0f172a] border border-gray-800 text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                                value={passData.current} onChange={e => setPassData({ ...passData, current: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">New Token Definition</label>
                                <input type="password"
                                    className="w-full px-5 py-3.5 rounded-xl bg-[#0f172a] border border-gray-800 text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                                    value={passData.new} onChange={e => setPassData({ ...passData, new: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Verify Token Definition</label>
                                <input type="password"
                                    className="w-full px-5 py-3.5 rounded-xl bg-[#0f172a] border border-gray-800 text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                                    value={passData.confirm} onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-gray-800">
                            <button onClick={handleUpdate} disabled={loading} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:scale-[1.02] transition shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50">
                                {loading ? 'Transmitting...' : 'Apply Token Update'}
                            </button>
                            <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-gray-400 hover:text-white hover:bg-gray-800 font-bold rounded-xl transition">Revert</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-12 pt-10 border-t border-gray-800">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h4 className="text-xl font-bold text-white flex items-center gap-3 tracking-wide">
                            <div className="p-2 bg-[#050B14] border border-gray-800 rounded-lg text-primary shadow-inner"><FiMonitor size={18} /></div>
                            Access Telemetry
                        </h4>
                        <p className="text-sm text-gray-500 mt-2">Historical audit logs of interface and API access handshakes.</p>
                    </div>
                    <button
                        onClick={() => setShowActivity(!showActivity)}
                        className="px-6 py-3 border border-gray-800 bg-[#050B14] rounded-xl text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors text-white flex items-center gap-2"
                    >
                        {showActivity ? 'Collapse Telemetry' : (<><FiActivity className="text-primary-glow" /> Execute Query</>)}
                    </button>
                </div>

                {showActivity && (
                    <div className="bg-[#050B14] border border-gray-800 rounded-2xl overflow-hidden animate-fade-in-up shadow-inner">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#0f172a] text-[10px] uppercase font-bold tracking-widest text-gray-500 border-b border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap">Origin Device & IP Frame</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Approximate Node Location</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Timestamp (Local)</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap">Handshake Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/50">
                                    {activityData.length > 0 ? activityData.map((a, i) => (
                                        <tr key={i} className="hover:bg-[#0f172a] transition-colors">
                                            <td className="px-6 py-4 font-bold text-white">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm">{a.user_agent ? (a.user_agent.includes('Chrome') ? 'Google Chrome (V8)' : a.user_agent.includes('Firefox') ? 'Mozilla Firefox' : a.user_agent.includes('Safari') ? 'Apple Safari' : 'Unknown Agent') : 'Unidentified Origin'}</span>
                                                    <span className="text-[10px] font-mono text-gray-500 font-bold bg-gray-900/50 inline-flex px-1.5 py-0.5 rounded max-w-max">{a.ip_address}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FiGlobe size={14} className="text-gray-600" /> {a.location || 'Encrypted / Unknown node'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300 font-mono text-xs">
                                                {new Date(a.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {i === 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Authorized (Active)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/50 text-gray-400 text-xs font-bold border border-gray-700">
                                                        {a.status === 'success' ? 'Session Terminated' : 'Handshake Failed'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-gray-500 font-medium">No telemetry payload available for this query.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function AppearanceSettings({ theme }) {
    return (
        <div className="max-w-2xl animate-fade-in-up">
            <h3 className="text-3xl font-display font-black text-white mb-2 tracking-tight">Workspace UI</h3>
            <p className="text-gray-400 mb-10 text-sm">Theme constraints and accessibility preferences.</p>

            <div className="bg-[#050B14] border border-gray-800 p-8 rounded-2xl shadow-inner">
                <div className="flex items-center gap-4 mb-6 text-primary">
                    <FiMonitor size={24} className="text-primary-glow" />
                    <h4 className="font-bold text-white text-lg tracking-wide">Interface Mode Locked</h4>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-6 font-medium">
                    The RecruitAI Enterprise interface is currently constrained to <strong className="text-white">Dark Theme (Deep Space #050B14)</strong> by default to support complex continuous data visualization workflows and minimize eye strain for recruiters operating high-density analytics dashboards.
                </p>
                <div className="flex gap-4">
                    <div className="px-6 py-3 border-2 border-primary bg-primary/10 text-primary-glow rounded-xl font-bold flex items-center gap-2 shadow-neon cursor-default">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div> Active Theme
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToggleRow({ label, sub, checked, onChange }) {
    return (
        <div className="flex items-center justify-between p-5 md:p-6 bg-[#050B14] border border-gray-800 rounded-2xl hover:border-gray-600 transition-colors shadow-sm group cursor-pointer" onClick={onChange}>
            <div>
                <p className="font-bold text-white tracking-wide mb-1 group-hover:text-primary transition-colors">{label}</p>
                <p className="text-sm text-gray-500 font-medium">{sub}</p>
            </div>
            <div
                className={`w-14 h-7 flex items-center rounded-full p-1 transition-all duration-300 shadow-inner ${checked ? 'bg-primary shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-gray-800'}`}
            >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </div>
        </div>
    );
}
