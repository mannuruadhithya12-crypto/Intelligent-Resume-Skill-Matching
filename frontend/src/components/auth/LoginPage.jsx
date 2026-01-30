import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiCpu } from 'react-icons/fi';

const LoginPage = () => {
    const { login, loading, error, token } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Redirect if already logged in
    React.useEffect(() => {
        if (token) navigate('/');
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await login(email, password);
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

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5  rounded-full border border-white/5">
                        <div className="size-2 rounded-full bg-slate-500"></div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Session Inactive
                        </span>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="flex-grow flex items-center justify-center p-6 relative z-10">
                <div className="w-full max-w-[420px]">
                    <div className="bg-[#0F172A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                        {/* Top Accent Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opactiy-80"></div>

                        <div className="p-10">
                            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                                Recruiter Login
                            </h1>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                Access your enterprise candidate matching dashboard
                            </p>

                            {/* ERROR MESSAGE */}
                            {error && (
                                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 font-medium text-center">
                                    {error}
                                </div>
                            )}

                            {/* FORM */}
                            <form className="space-y-6" onSubmit={handleSubmit}>
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
                                        <button type="button" className="text-[11px] font-bold text-primary hover:text-primary-light transition-colors">Reset</button>
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
                                    {loading ? 'Signing In...' : 'Sign In'}
                                    <FiLogIn size={18} />
                                </button>
                            </form>

                            {/* SIGN UP LINK */}
                            <div className="mt-8 pt-6 border-t border-white/5 text-center">
                                <p className="text-sm text-slate-400">
                                    Need an account?{" "}
                                    <Link to="/signup" className="text-primary font-bold hover:text-primary-light transition-colors ml-1">
                                        Create Account
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Info - Updated */}
            <div className="absolute bottom-6 left-8 flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                <FiLock size={12} /> Secure Recruiter Access Only
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

export default LoginPage;
