import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiBriefcase, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';

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
        <div className="bg-background-light dark:bg-background-dark font-display text-[#111418] dark:text-white min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-primary">
                    <svg fill="none" viewBox="0 0 48 48" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
                        <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
                    </svg>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-[#111418] dark:text-white">
                    Create Account
                </h2>
                <p className="mt-2 text-center text-sm text-[#617589] dark:text-gray-400">
                    Join the enterprise AI candidate analysis platform
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-[#111418] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[#f0f2f4] dark:border-gray-800">
                    
                    {error && (
                        <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 font-medium text-center">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-bold text-[#111418] dark:text-white mb-2">
                                    Full Name
                                </label>
                                <div className="relative rounded-lg shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
                                        <FiUser />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="John Doe"
                                        className="block w-full pl-10 pr-3 py-3 border border-[#f0f2f4] dark:border-gray-800 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white placeholder-[#617589] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors sm:text-sm"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-[#111418] dark:text-white mb-2">
                                    Company
                                </label>
                                <div className="relative rounded-lg shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
                                        <FiBriefcase />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        placeholder="Acme Corp"
                                        className="block w-full pl-10 pr-3 py-3 border border-[#f0f2f4] dark:border-gray-800 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white placeholder-[#617589] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#111418] dark:text-white mb-2">
                                Work Email
                            </label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
                                    <FiMail />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="block w-full pl-10 pr-3 py-3 border border-[#f0f2f4] dark:border-gray-800 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white placeholder-[#617589] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-[#111418] dark:text-white">
                                    Password
                                </label>
                            </div>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#617589]">
                                    <FiLock />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full pl-10 pr-10 py-3 border border-[#f0f2f4] dark:border-gray-800 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white placeholder-[#617589] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors sm:text-sm"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-[#617589] hover:text-[#111418] dark:hover:text-white focus:outline-none transition-colors"
                                    >
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all ${loading ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                                <FiArrowRight size={18} />
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#f0f2f4] dark:border-gray-800"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-[#111418] text-[#617589] dark:text-gray-400">
                                Already have an account? <Link to="/login" className="text-primary font-bold hover:text-primary/80 transition-colors">Sign In</Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecruiterSignup;
