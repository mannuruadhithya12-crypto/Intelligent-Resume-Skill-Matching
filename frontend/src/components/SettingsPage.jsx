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
        <div className="flex flex-col flex-1 font-sans">
            <div className="mb-6 flex items-center justify-between w-full animate-fade-in">
                <button onClick={handleBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-bold transition-colors px-4 py-2 rounded-xl hover:bg-[#F5ECE7] border border-transparent hover:border-[#E9E1DC]">
                    <FiArrowLeft size={20} /> Back to Dashboard
                </button>
            </div>

            <div className="bg-white rounded-[24px] border border-[#E9E1DC] shadow-paper flex flex-col md:flex-row min-h-[700px] w-full animate-scale-in relative overflow-hidden">
                {/* Subtle top indicator bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-primary-sage opacity-80 z-20"></div>

                {/* Settings Sidebar */}
                <div className="w-full md:w-72 bg-[#F4F1EA] border-b md:border-b-0 md:border-r border-[#E9E1DC] p-8 flex flex-col gap-2 relative z-10 shrink-0">
                    <h2 className="text-2xl font-serif font-black text-text-primary mb-8 tracking-tight px-2">Preferences</h2>
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
                <div className="flex-1 p-8 lg:p-12 bg-white relative z-10">
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
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-[14px] font-bold transition-all text-left w-full border ${active
                ? 'bg-white text-primary-sage border-[#E9E1DC] shadow-sm'
                : 'border-transparent text-text-secondary hover:bg-[#E9E1DC]/50 hover:text-text-primary'
                }`}
        >
            <div className={`${active ? 'text-primary-sage' : 'text-text-secondary'}`}>{icon}</div>
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
        await new Promise(r => setTimeout(r, 600));
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="max-w-2xl animate-fade-in-up">
            <h3 className="text-3xl font-serif font-black text-text-primary mb-2 tracking-tight">Professional Profile</h3>
            <p className="text-text-secondary mb-10 text-[15px]">Manage your enterprise identity and corporate contact details.</p>

            <div className="flex items-center gap-8 mb-10 bg-[#FBF9F4] p-6 rounded-2xl border border-[#E9E1DC]">
                <div className="w-24 h-24 rounded-2xl bg-white border border-[#E9E1DC] overflow-hidden shadow-sm relative group">
                    <img
                        src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`}
                        alt="Avatar"
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                </div>
                <div>
                    <label className="px-5 py-2.5 bg-white border border-[#E9E1DC] rounded-full text-text-primary font-bold hover:bg-[#F5ECE7] hover:border-outline-variant transition-all cursor-pointer inline-block shadow-sm text-[13px]">
                        Upload New Photo
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <p className="text-[11px] font-bold text-outline uppercase tracking-widest mt-3 flex items-center gap-1.5"><FiGlobe /> Supported formats: JPG, PNG (Max 1MB)</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-2">Legal/Full Name</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full px-5 py-3.5 bg-white border border-[#E9E1DC] rounded-xl focus:ring-1 focus:ring-primary-sage focus:border-primary-sage outline-none transition-all text-text-primary font-medium shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-2">Corporate Role</label>
                        <input name="role" value={formData.role} onChange={handleChange} className="w-full px-5 py-3.5 bg-white border border-[#E9E1DC] rounded-xl focus:ring-1 focus:ring-primary-sage focus:border-primary-sage outline-none transition-all text-text-primary font-medium shadow-sm" />
                    </div>
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-2">Enterprise Email Address</label>
                    <input name="email" value={formData.email} onChange={handleChange} className="w-full px-5 py-3.5 bg-[#F5ECE7] border border-[#E9E1DC] rounded-xl focus:outline-none transition-all text-text-secondary font-medium cursor-not-allowed shadow-sm" disabled />
                    <p className="text-xs text-text-secondary mt-2 italic">Email cannot be modified without IT administrator approval.</p>
                </div>

                <div>
                    <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-2">Office Location</label>
                    <input name="location" value={formData.location} onChange={handleChange} className="w-full px-5 py-3.5 bg-white border border-[#E9E1DC] rounded-xl focus:ring-1 focus:ring-primary-sage focus:border-primary-sage outline-none transition-all text-text-primary font-medium shadow-sm" />
                </div>

                <div className="pt-8 flex items-center gap-4 border-t border-[#E9E1DC]">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-3.5 bg-primary-sage text-white font-bold rounded-full hover:bg-primary-sage/90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {loading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Syncing...</span> : <><FiSave /> Save Profile</>}
                    </button>
                    {success && <span className="text-primary-sage font-bold flex items-center gap-2 animate-fade-in bg-[#CAECBC]/30 px-4 py-2 rounded-xl border border-[#CAECBC]"><FiCheck /> Profile Synchronized</span>}
                </div>
            </div>
        </div>
    );
}

function NotificationSettings() {
    const [toggles, setToggles] = useState({ email: true, push: true, weekly: false });
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        getSettings().then(s => {
            if (s.notifications) setToggles(s.notifications);
        });
    }, []);

    const toggle = async (k) => {
        const oldState = { ...toggles };
        const newState = { ...toggles, [k]: !toggles[k] };
        setToggles(newState);
        setErrorMsg(null);
        try {
            const current = await getSettings();
            await updateSettings({ ...current, notifications: newState });
        } catch (e) {
            console.error("Failed to sync toggles", e);
            setToggles(oldState); // Revert on failure
            setErrorMsg("Failed to save preference. Connection error.");
            setTimeout(() => setErrorMsg(null), 4000);
        }
    };

    return (
        <div className="max-w-2xl animate-fade-in-up">
            <h3 className="text-3xl font-serif font-black text-text-primary mb-2 tracking-tight">Alerts & Digests</h3>
            <p className="text-text-secondary mb-6 text-[15px]">Configure how RecruitAI communicates important hiring events.</p>

            {errorMsg && (
                <div className="mb-6 p-4 rounded-xl text-sm font-bold border flex items-center gap-3 bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2] animate-fade-in">
                    <div className="p-1 bg-[#C62828]/20 rounded-md"><FiX size={16} /></div>
                    {errorMsg}
                </div>
            )}

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
            setMsg({ type: 'error', text: "Please enter your credentials." });
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
            setMsg({ type: 'success', text: 'Password updated successfully.' });
            setTimeout(() => {
                setIsEditing(false);
                setPassData({ current: '', new: '', confirm: '' });
                setMsg({ type: '', text: '' });
            }, 3000);
        } catch (e) {
            console.error(e);
            setMsg({ type: 'error', text: e.response?.data?.detail || "Authentication failed." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl animate-fade-in-up">
            <h3 className="text-3xl font-serif font-black text-text-primary mb-2 tracking-tight">Access & Security</h3>
            <p className="text-text-secondary mb-10 text-[15px]">Manage security protocols, passwords, and track system access.</p>

            <div className="bg-[#FFF4E5] border border-[#FFE0B2] p-5 rounded-2xl flex gap-4 text-[#E65100] mb-8 shadow-sm relative overflow-hidden">
                <div className="p-2 bg-white rounded-xl self-start text-[#E65100] border border-[#FFE0B2] shadow-sm">
                    <FiShield size={20} />
                </div>
                <div className="relative z-10">
                    <p className="font-bold text-base mb-1 tracking-wide">Multi-Factor Authentication (MFA) Inactive</p>
                    <p className="text-[13px] text-[#E65100]/80 font-medium">Your corporate policy highly recommends enabling MFA logic via Authenticator app. Please contact your administrator if you need a hardware key setup.</p>
                </div>
            </div>

            {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-white border border-[#E9E1DC] text-text-primary font-bold rounded-full hover:bg-[#F5ECE7] transition-all flex items-center gap-2 shadow-sm text-[14px]">
                    <FiLock /> Update Password
                </button>
            ) : (
                <div className="bg-[#FBF9F4] p-8 rounded-2xl border border-[#E9E1DC] mb-8 animate-fade-in-up shadow-sm">
                    <h4 className="font-bold text-text-primary text-lg mb-6 tracking-wide">Change Password</h4>
                    {msg.text && (
                        <div className={`p-4 rounded-xl text-sm font-bold mb-6 border flex items-center gap-3 ${msg.type === 'error' ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]' : 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'}`}>
                            {msg.type === 'error' ? <div className="p-1 bg-[#C62828]/20 rounded-md"><FiX size={16} /></div> : <div className="p-1 bg-[#2E7D32]/20 rounded-md"><FiCheck size={16} /></div>}
                            {msg.text}
                        </div>
                    )}
                    <div className="space-y-6">
                        <div>
                            <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-2">Current Password</label>
                            <input type="password"
                                className="w-full px-5 py-3.5 rounded-xl bg-white border border-[#E9E1DC] text-text-primary outline-none focus:ring-1 focus:ring-primary-sage focus:border-primary-sage transition-all shadow-sm"
                                value={passData.current} onChange={e => setPassData({ ...passData, current: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-2">New Password</label>
                                <input type="password"
                                    className="w-full px-5 py-3.5 rounded-xl bg-white border border-[#E9E1DC] text-text-primary outline-none focus:ring-1 focus:ring-primary-sage focus:border-primary-sage transition-all shadow-sm"
                                    value={passData.new} onChange={e => setPassData({ ...passData, new: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-outline uppercase tracking-widest block mb-2">Verify Password</label>
                                <input type="password"
                                    className="w-full px-5 py-3.5 rounded-xl bg-white border border-[#E9E1DC] text-text-primary outline-none focus:ring-1 focus:ring-primary-sage focus:border-primary-sage transition-all shadow-sm"
                                    value={passData.confirm} onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-[#E9E1DC]">
                            <button onClick={handleUpdate} disabled={loading} className="px-6 py-3 bg-primary-sage text-white font-bold rounded-full hover:bg-primary-sage/90 transition shadow-sm disabled:opacity-50 text-[14px]">
                                {loading ? 'Transmitting...' : 'Apply Token Update'}
                            </button>
                            <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-text-secondary hover:text-text-primary hover:bg-[#F5ECE7] font-bold rounded-full transition text-[14px]">Revert</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-12 pt-10 border-t border-[#E9E1DC]">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h4 className="text-xl font-bold text-text-primary flex items-center gap-3 tracking-wide">
                            <div className="p-2 bg-white border border-[#E9E1DC] rounded-lg text-primary-sage shadow-sm"><FiMonitor size={18} /></div>
                            Access Telemetry
                        </h4>
                        <p className="text-[14px] text-text-secondary mt-2">Historical audit logs of interface and API access handshakes.</p>
                    </div>
                    <button
                        onClick={() => setShowActivity(!showActivity)}
                        className="px-6 py-3 border border-[#E9E1DC] bg-white rounded-full text-[13px] font-bold shadow-sm hover:bg-[#F5ECE7] transition-colors text-text-primary flex items-center gap-2"
                    >
                        {showActivity ? 'Collapse Telemetry' : (<><FiActivity className="text-primary-sage" /> View History</>)}
                    </button>
                </div>

                {showActivity && (
                    <div className="bg-white border border-[#E9E1DC] rounded-2xl overflow-hidden animate-fade-in-up shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px] text-left">
                                <thead className="bg-[#FBF9F4] text-[10px] uppercase font-bold tracking-widest text-outline border-b border-[#E9E1DC]">
                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap">Origin Device & IP</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Location</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Timestamp</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E9E1DC]">
                                    {activityData.length > 0 ? activityData.map((a, i) => (
                                        <tr key={i} className="hover:bg-[#FBF9F4] transition-colors">
                                            <td className="px-6 py-4 font-bold text-text-primary">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[13px]">{a.user_agent ? (a.user_agent.includes('Chrome') ? 'Google Chrome' : a.user_agent.includes('Firefox') ? 'Mozilla Firefox' : a.user_agent.includes('Safari') ? 'Apple Safari' : 'Unknown Agent') : 'Unidentified Origin'}</span>
                                                    <span className="text-[11px] font-mono text-text-secondary font-bold bg-[#F5ECE7] inline-flex px-1.5 py-0.5 rounded max-w-max">{a.ip_address}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FiGlobe size={14} className="text-outline" /> {a.location || 'Encrypted / Unknown node'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary font-mono text-xs">
                                                {new Date(a.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {i === 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#CAECBC]/30 text-primary-sage text-[11px] font-bold border border-[#CAECBC]">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-sage animate-pulse"></span> Authorized (Active)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5ECE7] text-text-secondary text-[11px] font-bold border border-[#E9E1DC]">
                                                        {a.status === 'success' ? 'Session Terminated' : 'Handshake Failed'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-text-secondary font-medium">No telemetry payload available for this query.</td>
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
            <h3 className="text-3xl font-serif font-black text-text-primary mb-2 tracking-tight">Workspace UI</h3>
            <p className="text-text-secondary mb-10 text-[15px]">Theme constraints and accessibility preferences.</p>

            <div className="bg-[#FBF9F4] border border-[#E9E1DC] p-8 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4 mb-6 text-primary-sage">
                    <FiMonitor size={24} className="text-primary-sage" />
                    <h4 className="font-bold text-text-primary text-lg tracking-wide">Interface Mode Locked</h4>
                </div>
                <p className="text-[14px] text-text-secondary leading-relaxed mb-6 font-medium">
                    The RecruitAI Enterprise interface is currently constrained to <strong className="text-text-primary">Warm Light Theme (Oatmeal #FBF9F4)</strong> by default to support complex continuous data visualization workflows and provide a natural, paper-like reading experience for recruiters operating high-density analytics dashboards.
                </p>
                <div className="flex gap-4">
                    <div className="px-6 py-3 border border-primary-sage bg-[#CAECBC]/20 text-primary-sage rounded-full font-bold flex items-center gap-2 shadow-sm cursor-default text-[13px]">
                        <div className="w-2 h-2 rounded-full bg-primary-sage animate-pulse"></div> Active Theme
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToggleRow({ label, sub, checked, onChange }) {
    return (
        <div 
            className="flex items-center justify-between p-5 md:p-6 bg-white border border-[#E9E1DC] rounded-2xl hover:border-[#D8D5CE] hover:bg-[#FBF9F4] transition-colors shadow-sm group cursor-pointer" 
            onClick={onChange}
            role="switch"
            aria-checked={checked}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onChange();
                }
            }}
        >
            <div>
                <p className="font-bold text-text-primary tracking-wide mb-1 group-hover:text-[#3F7655] transition-colors text-[15px]">{label}</p>
                <p className="text-[13px] text-text-secondary font-medium">{sub}</p>
            </div>
            <div
                className={`w-[46px] h-[26px] flex items-center rounded-full p-1 shadow-inner ${checked ? 'bg-[#3F7655]' : 'bg-[#D8D5CE]'}`}
                style={{ transition: 'background-color 160ms ease-in-out' }}
            >
                <div 
                    className={`bg-white w-[18px] h-[18px] rounded-full shadow-md transform ${checked ? 'translate-x-[20px]' : 'translate-x-0'}`}
                    style={{ transition: 'transform 160ms ease-in-out' }}
                ></div>
            </div>
        </div>
    );
}
