import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Login attempt', { username, password });
        setIsLoading(false);
        navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-light via-white to-blue-50 dark:from-background-dark dark:via-surface-dark dark:to-background-dark transition-colors duration-300 p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-slide-up" style={{ opacity: 0, animationDelay: '0.1s' }}>
                {/* Card */}
                <div className="bg-white dark:bg-surface-dark p-8 md:p-10 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-800/80">
                    {/* Logo/Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <LogIn size={28} className="icon-gray" strokeWidth={1.5} />
                        </div>
                        <h1 className="text-3xl font-bold gradient-text mb-2">Welcome Back</h1>
                        <p className="text-gray-500 dark:text-gray-400">Sign in to manage your campaigns</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 icon-gray" strokeWidth={1.75} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none transition-all text-base"
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 icon-gray" strokeWidth={1.75} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none transition-all text-base"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary" />
                                <span className="text-gray-600 dark:text-gray-400">Remember me</span>
                            </label>
                            <a href="#" className="text-primary hover:underline font-medium">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 px-4 btn-primary text-white font-semibold rounded-xl shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={18} strokeWidth={2} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                        Don't have an account?{' '}
                        <a href="#" className="text-primary hover:underline font-medium">
                            Contact Admin
                        </a>
                    </p>
                </div>

                {/* Branding */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    <span className="gradient-text font-semibold">WhatsSMS</span> — WhatsApp Marketing Platform
                </p>
            </div>
        </div>
    );
};

export default Login;
