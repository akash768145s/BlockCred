"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function GenericDashboard() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated, logout } = useAuth();

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated()) {
            router.push("/login");
            return;
        }
        // If user has a dashboard_route that's not /dashboard, redirect to it.
        const route = (user?.dashboard_route || "").trim();
        if (route && route !== "/dashboard" && route.startsWith("/")) {
            router.push(route);
            return;
        }
    }, [authLoading, isAuthenticated, user, router]);

    if (authLoading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4"></div>
                    <p className="text-sm text-slate-300">Loading authentication...</p>
                </div>
            </main>
        );
    }

    if (!user || !isAuthenticated()) {
        return null;
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
            <DashboardHeader user={user} onLogout={logout} />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-8 text-center">
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Dashboard Not Configured</h1>
                            <p className="text-slate-400">
                                Your role <span className="text-indigo-300 font-medium">{user.role_name || user.role}</span> doesn't have a dashboard configured yet.
                            </p>
                        </div>

                        <div className="bg-slate-900/50 rounded-lg p-6 text-left">
                            <h2 className="text-lg font-semibold text-white mb-4">What you can do:</h2>
                            <ul className="space-y-3 text-slate-300">
                                <li className="flex items-start">
                                    <span className="text-indigo-400 mr-2">•</span>
                                    <span>Contact your administrator to configure a dashboard route for your role</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-400 mr-2">•</span>
                                    <span>If you're an admin, go to <span className="text-indigo-300">Admin → Roles</span> and set a <span className="text-indigo-300">Dashboard Route</span> for this role</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-indigo-400 mr-2">•</span>
                                    <span>Once configured, you'll be automatically redirected to your dashboard on next login</span>
                                </li>
                            </ul>
                        </div>

                        {user.role === 'ssn_main_admin' && (
                            <div className="mt-6">
                                <button
                                    onClick={() => router.push('/admin')}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    Go to Admin Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}