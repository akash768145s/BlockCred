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
            } else if (parsedUser.role === 'external_verifier') {
                router.push('/verifier-dashboard');
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
            case 'external_verifier':
                return <Eye className="h-8 w-8 text-yellow-600" />;
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
            case 'external_verifier':
                return 'bg-yellow-100 text-yellow-800';
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
            case 'external_verifier':
                return 'Verify authenticity of student credentials';
            case 'student':
                return 'View and manage your academic credentials';
            default:
                return 'Access your dashboard';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600 mb-4">You need to be logged in to access this page.</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            {getRoleIcon(user.role)}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Welcome to BlockCred</h1>
                                <p className="text-gray-600">{getDashboardDescription(user.role)}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                                {user.role_name}
                            </span>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user');
                                    router.push('/login');
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-md border p-8 text-center">
                    <div className="mb-6">
                        {getRoleIcon(user.role)}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Redirecting to {user.role_name} Dashboard...
                    </h2>
                    <p className="text-gray-600 mb-6">
                        You will be automatically redirected to your role-specific dashboard.
                    </p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;