'use client';

import React, { useState, useEffect } from 'react';
import { User, DashboardData, QuickAction, ActivityLog } from '@/types/auth';
import {
    Users,
    FileText,
    Award,
    Shield,
    Clock,
    TrendingUp,
    UserPlus,
    Code,
    CheckCircle,
    FileCheck,
    FileX,
    Search,
    Certificate
} from 'lucide-react';

interface RoleBasedDashboardProps {
    user: User;
    dashboardData: DashboardData;
}

const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = ({ user, dashboardData }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ssn_main_admin':
                return <Shield className="h-6 w-6" />;
            case 'coe':
                return <FileText className="h-6 w-6" />;
            case 'department_faculty':
                return <Users className="h-6 w-6" />;
            case 'club_coordinator':
                return <Award className="h-6 w-6" />;
            case 'external_verifier':
                return <Search className="h-6 w-6" />;
            case 'student':
                return <Certificate className="h-6 w-6" />;
            default:
                return <Users className="h-6 w-6" />;
        }
    };

    const getQuickActionIcon = (iconName: string) => {
        const iconMap: Record<string, React.ReactNode> = {
            'user-plus': <UserPlus className="h-5 w-5" />,
            'code': <Code className="h-5 w-5" />,
            'shield-check': <Shield className="h-5 w-5" />,
            'users': <Users className="h-5 w-5" />,
            'certificate': <Certificate className="h-5 w-5" />,
            'file-text': <FileText className="h-5 w-5" />,
            'file-check': <FileCheck className="h-5 w-5" />,
            'file-x': <FileX className="h-5 w-5" />,
            'award': <Award className="h-5 w-5" />,
            'search': <Search className="h-5 w-5" />,
        };
        return iconMap[iconName] || <Users className="h-5 w-5" />;
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardData.total_users !== undefined && (
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{dashboardData.total_users}</p>
                            </div>
                        </div>
                    </div>
                )}

                {dashboardData.pending_users !== undefined && (
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-yellow-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                                <p className="text-2xl font-bold text-gray-900">{dashboardData.pending_users}</p>
                            </div>
                        </div>
                    </div>
                )}

                {dashboardData.total_credentials !== undefined && (
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <div className="flex items-center">
                            <Certificate className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Credentials</p>
                                <p className="text-2xl font-bold text-gray-900">{dashboardData.total_credentials}</p>
                            </div>
                        </div>
                    </div>
                )}

                {dashboardData.issued_today !== undefined && (
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-purple-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Issued Today</p>
                                <p className="text-2xl font-bold text-gray-900">{dashboardData.issued_today}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.quick_actions.map((action) => (
                        <button
                            key={action.id}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                            onClick={() => {
                                // Handle navigation to action route
                                console.log(`Navigate to: ${action.route}`);
                            }}
                        >
                            <div className="flex items-center mb-2">
                                {getQuickActionIcon(action.icon)}
                                <span className="ml-2 font-medium text-gray-900">{action.title}</span>
                            </div>
                            <p className="text-sm text-gray-600">{action.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderActivity = () => (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
                {dashboardData.recent_activity?.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                            <p className="text-sm text-gray-600">{activity.details}</p>
                            <p className="text-xs text-gray-500">
                                by {activity.user_name} • {new Date(activity.timestamp).toLocaleString()}
                            </p>
                        </div>
                    </div>
                )) || (
                        <p className="text-gray-500 text-center py-8">No recent activity</p>
                    )}
            </div>
        </div>
    );

    const renderRoleSpecificContent = () => {
        switch (user.role) {
            case 'ssn_main_admin':
                return (
                    <div className="space-y-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-red-900 mb-2">Administrative Controls</h3>
                            <p className="text-red-700">
                                You have full administrative access to the BlockCred system.
                                You can onboard sub-admins, deploy contracts, and manage all users.
                            </p>
                        </div>
                    </div>
                );

            case 'coe':
                return (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">Examination Management</h3>
                            <p className="text-blue-700">
                                You can issue semester marksheets and view all examination-related credentials.
                            </p>
                        </div>
                    </div>
                );

            case 'department_faculty':
                return (
                    <div className="space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-green-900 mb-2">Department Services</h3>
                            <p className="text-green-700">
                                You can issue Bonafide certificates and No Objection Certificates (NOC) for students.
                            </p>
                        </div>
                    </div>
                );

            case 'club_coordinator':
                return (
                    <div className="space-y-6">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-purple-900 mb-2">Club Activities</h3>
                            <p className="text-purple-700">
                                You can issue participation certificates for club events and activities.
                            </p>
                        </div>
                    </div>
                );

            case 'external_verifier':
                return (
                    <div className="space-y-6">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Credential Verification</h3>
                            <p className="text-yellow-700">
                                You have read-only access to verify the authenticity of issued credentials.
                            </p>
                        </div>
                    </div>
                );

            case 'student':
                return (
                    <div className="space-y-6">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Credentials</h3>
                            <p className="text-gray-700">
                                View and manage your issued credentials and certificates.
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            {getRoleIcon(user.role)}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">BlockCred Dashboard</h1>
                                <p className="text-gray-600">Welcome back, {user.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.role === 'ssn_main_admin' ? 'bg-red-100 text-red-800' :
                                    user.role === 'coe' ? 'bg-blue-100 text-blue-800' :
                                        user.role === 'department_faculty' ? 'bg-green-100 text-green-800' :
                                            user.role === 'club_coordinator' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'external_verifier' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {user.role === 'ssn_main_admin' ? 'SSN Main Admin' :
                                    user.role === 'coe' ? 'Controller of Examinations' :
                                        user.role === 'department_faculty' ? 'Department Faculty' :
                                            user.role === 'club_coordinator' ? 'Club Coordinator' :
                                                user.role === 'external_verifier' ? 'External Verifier' :
                                                    'Student'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'activity'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Activity
                        </button>
                        <button
                            onClick={() => setActiveTab('role-specific')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'role-specific'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Role Specific
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'activity' && renderActivity()}
                {activeTab === 'role-specific' && renderRoleSpecificContent()}
            </div>
        </div>
    );
};

export default RoleBasedDashboard;
