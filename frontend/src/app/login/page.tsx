"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Try enhanced login first (supports all roles)
            const response = await fetch(`http://localhost:8080/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                const user = data.data?.user;
                const token = data.data?.token;
                if (!user || !token) {
                    setError("Invalid server response.");
                    setLoading(false);
                    return;
                }
                // Store user session with role information (fallback role_name)
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify({
                    id: user.id,
                    role: user.role,
                    role_name: user.role || "user",
                    permissions: [],
                }));

                setSuccess("Login successful! Redirecting...");

                // Redirect based on role
                setTimeout(() => {
                    if (user.role === "ssn_main_admin") {
                        router.push("/admin-dashboard");
                    } else if (user.role === "coe") {
                        router.push("/coe-dashboard");
                    } else if (user.role === "department_faculty") {
                        router.push("/faculty-dashboard");
                    } else if (user.role === "club_coordinator") {
                        router.push("/club-dashboard");
                    } else if (user.role === "external_verifier") {
                        router.push("/verifier-dashboard");
                    } else if (user.role === "student") {
                        router.push("/student-dashboard");
                    } else {
                        router.push("/dashboard");
                    }
                }, 300);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Connection error. Please ensure the backend server is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
                <div className="w-full h-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
            </div>

            <div className="relative max-w-md w-full">
                {/* Main Login Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">BlockCred</h1>
                        <p className="text-white/70">Secure Credential Management System</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Field */}
                        <div className="space-y-2">
                            <label htmlFor="username" className="block text-sm font-medium text-white/90">
                                Username or Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-white/50" />
                                </div>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Enter your username or email"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-white/90">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-white/50" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white/70 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center space-x-2 bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 text-green-200 px-4 py-3 rounded-xl">
                                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                                <span className="text-sm">{success}</span>
                            </div>
                        )}

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-white/70">
                            New user?{" "}
                            <button
                                onClick={() => router.push("/register")}
                                className="text-blue-300 hover:text-blue-200 font-medium transition-colors"
                            >
                                Register here
                            </button>
                        </p>
                    </div>
                </div>


                {/* Features */}
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                        <Shield className="h-6 w-6 text-blue-300 mx-auto mb-2" />
                        <p className="text-xs text-white/70">Secure</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                        <User className="h-6 w-6 text-purple-300 mx-auto mb-2" />
                        <p className="text-xs text-white/70">Role-Based</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                        <Lock className="h-6 w-6 text-green-300 mx-auto mb-2" />
                        <p className="text-xs text-white/70">Blockchain</p>
                    </div>
                </div>
            </div>
        </div >
    );
}
