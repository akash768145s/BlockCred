'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, FileText, GraduationCap, Award, Users, Eye } from 'lucide-react';

interface User {
    id: number;
    role: string;
    role_name: string;
    permissions: string[];
    token: string;
}

const Dashboard: React.FC = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            // Redirect to role-specific dashboards
            if (parsedUser.role === 'ssn_main_admin') {
                router.push('/admin-dashboard');
            } else if (parsedUser.role === 'coe') {
                router.push('/coe-dashboard');
            } else if (parsedUser.role === 'department_faculty') {
                router.push('/faculty-dashboard');
            } else if (parsedUser.role === 'club_coordinator') {
                router.push('/club-dashboard');
            } else if (parsedUser.role === 'student') {
                router.push('/student-dashboard');
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    }, [router]);

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ssn_main_admin':
                return <Shield className="h-8 w-8 text-red-600" />;
            case 'coe':
                return <FileText className="h-8 w-8 text-blue-600" />;
            case 'department_faculty':
                return <GraduationCap className="h-8 w-8 text-green-600" />;
            case 'club_coordinator':
                return <Award className="h-8 w-8 text-purple-600" />;
            case 'student':
                return <Users className="h-8 w-8 text-indigo-600" />;
            default:
                return <Users className="h-8 w-8 text-gray-600" />;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ssn_main_admin':
                return 'bg-red-100 text-red-800';
            case 'coe':
                return 'bg-blue-100 text-blue-800';
            case 'department_faculty':
                return 'bg-green-100 text-green-800';
            case 'club_coordinator':
                return 'bg-purple-100 text-purple-800';
            case 'student':
                return 'bg-indigo-100 text-indigo-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getDashboardDescription = (role: string) => {
        switch (role) {
            case 'ssn_main_admin':
                return 'Manage users, deploy contracts, and authorize validators';
            case 'coe':
                return 'Issue semester results and degree certificates';
            case 'department_faculty':
                return 'Issue NOC and other academic certificates';
            case 'club_coordinator':
                return 'Issue participation certificates for events and activities';
            case 'student':
                return 'View and manage your academic credentials';
            default:
                return 'Access your dashboard';
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4"></div>
                    <p className="text-sm text-slate-300">Loading dashboard...</p>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center max-w-md">
                    <p className="text-xs uppercase tracking-[0.3em] text-red-300">Access Denied</p>
                    <h1 className="text-2xl font-semibold mt-3 mb-4">Authentication Required</h1>
                    <p className="text-sm text-indigo-100 mb-6">You need to be logged in to access this page.</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-6 py-3 bg-white text-slate-900 rounded-2xl hover:bg-indigo-50 transition-all font-semibold shadow-lg"
                    >
                        Go to Login
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            {/* Header */}
            <div className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            {getRoleIcon(user.role)}
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                                <h1 className="text-2xl font-semibold mt-1">Welcome to BlockCred</h1>
                                <p className="text-sm text-indigo-100">{getDashboardDescription(user.role)}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                                {user.role_name}
                            </span>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    router.push('/login');
                                }}
                                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-2xl hover:bg-white/20 transition-all text-sm font-semibold"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="rounded-3xl bg-white/10 border border-white/10 backdrop-blur-lg shadow-2xl p-8 text-center">
                    <div className="mb-6">
                        {getRoleIcon(user.role)}
                    </div>
                    <h2 className="text-2xl font-semibold mb-4">
                        Redirecting to {user.role_name} Dashboard...
                    </h2>
                    <p className="text-sm text-indigo-100 mb-6">
                        You will be automatically redirected to your role-specific dashboard.
                    </p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto"></div>
                </div>
            </div>
        </main>
    );
};

export default Dashboard;