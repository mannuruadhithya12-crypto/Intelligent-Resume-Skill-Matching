import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

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
            navigate('/');
        }
    };

    return (
        <div className="bg-[#F4F1EA] font-sans text-text-primary min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="flex justify-center text-primary-sage mb-6">
                    <span className="material-symbols-outlined text-[48px]">psychology</span>
                </div>
                <h2 className="text-[32px] font-serif font-bold text-text-primary tracking-tight">
                    Create your workspace
                </h2>
                <p className="mt-2 text-[15px] text-text-secondary">
                    Set up your recruitment workspace and begin reviewing candidates.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-8 shadow-paper rounded-[20px]">
                    
                    {error && (
                        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-[12px] text-sm text-error font-medium text-center">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className="block text-[13px] font-bold text-text-secondary mb-2 uppercase tracking-wide">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                                        <span className="material-symbols-outlined text-[20px]">person</span>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Jane Doe"
                                        className="block w-full pl-11 pr-4 h-[52px] border-none rounded-[10px] bg-[#F4F1EA] text-text-primary placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary-sage/30 transition-all sm:text-[15px]"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[13px] font-bold text-text-secondary mb-2 uppercase tracking-wide">
                                    Company
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                                        <span className="material-symbols-outlined text-[20px]">work</span>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        placeholder="Acme Corp"
                                        className="block w-full pl-11 pr-4 h-[52px] border-none rounded-[10px] bg-[#F4F1EA] text-text-primary placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary-sage/30 transition-all sm:text-[15px]"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-text-secondary mb-2 uppercase tracking-wide">
                                Work Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="block w-full pl-11 pr-4 h-[52px] border-none rounded-[10px] bg-[#F4F1EA] text-text-primary placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary-sage/30 transition-all sm:text-[15px]"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-[13px] font-bold text-text-secondary uppercase tracking-wide">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full pl-11 pr-11 h-[52px] border-none rounded-[10px] bg-[#F4F1EA] text-text-primary placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary-sage/30 transition-all sm:text-[15px]"
                                />
                                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-2 text-outline hover:text-text-primary focus:outline-none transition-colors rounded-lg"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`btn-primary w-full flex justify-center items-center gap-2 h-[52px] text-[15px] font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-sage ${loading ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#E9E1DC]"></div>
                        </div>
                        <div className="relative flex justify-center text-[14px]">
                            <span className="px-4 bg-white text-text-secondary">
                                Already have an account? <Link to="/login" className="text-terracotta font-bold hover:text-terracotta-light transition-colors ml-1">Sign In</Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecruiterSignup;
