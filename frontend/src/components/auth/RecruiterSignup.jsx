import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiBriefcase, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCpu, FiLock as FiSecureLock } from 'react-icons/fi';

const RecruiterSignup = () => {
    const { register, loading, error, token } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [company, setCompany] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Redirect if already logged in
    React.useEffect(() => {
        if (token) navigate('/');
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await register(email, password, fullName, company);
        if (success) {
            navigate('/login');
        }
    };

    return (
        <div className="bg-[#050B14] font-display min-h-screen flex flex-col relative overflow-hidden">
            {/* Grid Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#1E293B 1px, transparent 1px), linear-gradient(90deg, #1E293B 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}>
            </div>

            {/* HEADER */}
            <header className="w-full border-b border-white/5 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-[1400px] mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary border border-primary/20">
                            <FiCpu size={22} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-white tracking-tight">ResumeAI</h2>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">
                                Recruiter Hub
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                        <div className="size-2 rounded-full bg-slate-500"></div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Registration Mode
                        </span>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="flex-grow flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-[480px]">
                    <div className="bg-[#0F172A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                        {/* Top Accent Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opactiy-80"></div>

                        <div className="p-10">
                            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                                Create Account
                            </h1>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                Join the enterprise AI candidate analysis platform
                            </p>

                            {/* ERROR MESSAGE */}
                            {error && (
                                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-medium text-center">
                                    {error}
                                </div>
                            )}

                            {/* FORM */}
                            <form className="space-y-5" onSubmit={handleSubmit}>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* FULL NAME */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                                            Full Name
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                required
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="John Doe"
                                                className="w-full h-12 pl-11 pr-4 rounded-xl border border-white/10 bg-[#0B1120] text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-slate-600"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                                <FiUser size={18} />
                                            </span>
                                        </div>
                                    </div>

                                    {/* COMPANY */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                                            Company
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                required
                                                value={company}
                                                onChange={(e) => setCompany(e.target.value)}
                                                placeholder="Acme Corp"
                                                className="w-full h-12 pl-11 pr-4 rounded-xl border border-white/10 bg-[#0B1120] text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-slate-600"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                                <FiBriefcase size={18} />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* EMAIL */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                                        Work Email
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            className="w-full h-12 pl-11 pr-4 rounded-xl border border-white/10 bg-[#0B1120] text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-slate-600"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                            <FiMail size={18} />
                                        </span>
                                    </div>
                                </div>

                                {/* PASSWORD */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center pl-1">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            Password
                                        </label>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full h-12 pl-11 pr-12 rounded-xl border border-white/10 bg-[#0B1120] text-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-slate-600"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                            <FiLock size={18} />
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>

                                {/* SUBMIT */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full h-12 bg-primary hover:bg-primary-light text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 ${loading ? 'opacity-70 cursor-wait' : 'hover:-translate-y-0.5'}`}
                                >
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                    <FiArrowRight size={18} />
                                </button>
                            </form>

                            {/* SIGN IN LINK */}
                            <div className="mt-8 pt-6 border-t border-white/5 text-center">
                                <p className="text-sm text-slate-400">
                                    Already have an account?{" "}
                                    <Link to="/login" className="text-primary font-bold hover:text-primary-light transition-colors ml-1">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {/* Footer Info */}
            <div className="absolute bottom-6 left-8 flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                <FiSecureLock size={12} /> Secure Recruiter Access Only
                <span className="text-slate-800">|</span>
                v4.2.0-stable
            </div>
            <div className="absolute bottom-6 right-8 flex items-center gap-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                <span className="hover:text-slate-400 cursor-pointer transition-colors">Security Policy</span>
                <span className="hover:text-slate-400 cursor-pointer transition-colors">Trust Center</span>
                <span className="hover:text-slate-400 cursor-pointer transition-colors">System Status</span>
            </div>
        </div>
    );
};

export default RecruiterSignup;
