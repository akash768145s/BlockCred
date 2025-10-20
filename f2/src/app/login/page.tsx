"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginType, setLoginType] = useState("admin"); // "admin" or "student"
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const endpoint = loginType === "admin" ? "/api/login" : "/api/student-login";
            const response = await fetch(`http://localhost:8080${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                if (loginType === "admin") {
                    localStorage.setItem("admin_session", JSON.stringify(data.data));
                    router.push("/dashboard");
                } else {
                    localStorage.setItem("student_session", JSON.stringify(data.data));
                    router.push("/student-dashboard");
                }
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">BlockCred</h1>
                    <p className="text-gray-600">
                        {loginType === "admin" ? "Admin Dashboard Login" : "Student Portal Login"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            I am a:
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${loginType === "admin"
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-300 hover:border-gray-400"
                                }`}>
                                <input
                                    type="radio"
                                    value="admin"
                                    checked={loginType === "admin"}
                                    onChange={(e) => setLoginType(e.target.value)}
                                    className="sr-only"
                                />
                                <div className="text-center">
                                    <div className="text-lg font-medium">Admin</div>
                                    <div className="text-xs text-gray-500">System Administrator</div>
                                </div>
                            </label>
                            <label className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${loginType === "student"
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-300 hover:border-gray-400"
                                }`}>
                                <input
                                    type="radio"
                                    value="student"
                                    checked={loginType === "student"}
                                    onChange={(e) => setLoginType(e.target.value)}
                                    className="sr-only"
                                />
                                <div className="text-center">
                                    <div className="text-lg font-medium">Student</div>
                                    <div className="text-xs text-gray-500">Registered Student</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                            {loginType === "admin" ? "Username" : "Student ID"}
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                            placeholder={loginType === "admin" ? "Enter admin username" : "Enter your Student ID"}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                            placeholder={loginType === "admin" ? "Enter admin password" : "Enter your password"}
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        New user?{" "}
                        <button
                            onClick={() => router.push("/register")}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Register here
                        </button>
                    </p>
                </div>

                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Demo Credentials:</h3>
                    <p className="text-sm text-gray-600">Username: admin</p>
                    <p className="text-sm text-gray-600">Password: admin123</p>
                </div>
            </div>
        </div>
    );
}
