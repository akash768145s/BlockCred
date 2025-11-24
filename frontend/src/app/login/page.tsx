"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        const result = await login({ username, password });

        if (result.success) {
            setSuccess(result.message);
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="relative max-w-md w-full">
                {/* Main Login Card */}
                <div className="rounded-3xl bg-white/10 border border-white/10 backdrop-blur-lg shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        
                        <p className="text-2xl uppercase tracking-[0.4em] text-indigo-300">BlockCred</p>
                        <p className="text-sm text-indigo-100 mt-2">Secure Credential Management System</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Field */}
                        <div className="space-y-2">
                            <label htmlFor="username" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                Username or Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-indigo-300" />
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-200"
                                    placeholder="Enter your username or email"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-xs uppercase tracking-[0.3em] font-semibold text-indigo-200 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-indigo-300" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-200"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-indigo-300 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center space-x-2 bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-3 rounded-2xl">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-4 py-3 rounded-2xl">
                                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                <span className="text-sm">{success}</span>
                            </div>
                        )}

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-slate-900 py-3 px-4 rounded-2xl hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-indigo-200">
                            New user?{" "}
                            <button
                                onClick={() => router.push("/register")}
                                className="text-white hover:text-indigo-200 font-semibold transition-colors underline"
                            >
                                Register here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
