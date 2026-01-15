import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, isAuthenticated } = useAuth();

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isRegisterMode) {
                await register(username, password);
            } else {
                await login(username, password);
            }

            // Navigate to the page they were trying to access, or home
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-light via-white to-emerald-50 dark:from-background-dark dark:via-surface-dark dark:to-background-dark transition-colors duration-300 p-4">
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
                        <h1 className="text-3xl font-bold gradient-text mb-2">
                            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            {isRegisterMode
                                ? 'Sign up to start managing campaigns'
                                : 'Sign in to manage your campaigns'}
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
                            <AlertCircle size={20} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none transition-all text-base text-gray-900 dark:text-white placeholder:text-gray-400"
                                    placeholder="Enter your username"
                                    required
                                    autoComplete="username"
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
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-700 outline-none transition-all text-base text-gray-900 dark:text-white placeholder:text-gray-400"
                                    placeholder={isRegisterMode ? 'Create a password (min 6 chars)' : 'Enter your password'}
                                    required
                                    minLength={isRegisterMode ? 6 : undefined}
                                    autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                                />
                            </div>
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
                                    <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
                                    <ArrowRight size={18} strokeWidth={2} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Register/Login */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                        {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            onClick={() => {
                                setIsRegisterMode(!isRegisterMode);
                                setError('');
                            }}
                            className="text-primary hover:underline font-medium"
                        >
                            {isRegisterMode ? 'Sign In' : 'Create one'}
                        </button>
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
