'use client';

import React, { useState } from 'react';
import {
    Users,
    UserPlus,
    Shield,
    FileText,
    Award,
    GraduationCap,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, useCredentials, useDashboardStats } from '@/hooks/useApi';
import { getRoleIcon, getRoleDisplayName, getRoleColor, formatDate } from '@/lib/utils';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [viewingUser, setViewingUser] = useState<any>(null);
    const [deletingUser, setDeletingUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    const { logout } = useAuth();
    const { users, loading: usersLoading, error: usersError, approveUser } = useUsers();
    const { credentials, loading: credentialsLoading, error: credentialsError } = useCredentials();
    const { stats, loading: statsLoading, error: statsError } = useDashboardStats();

    const getRoleIconComponent = (role: string) => {
        const iconName = getRoleIcon(role as any);
        switch (iconName) {
            case 'Shield':
                return <Shield className="h-5 w-5 text-[#06B6D4]" />;
            case 'FileText':
                return <FileText className="h-5 w-5 text-[#06B6D4]" />;
            case 'GraduationCap':
                return <GraduationCap className="h-5 w-5 text-[#06B6D4]" />;
            case 'Award':
                return <Award className="h-5 w-5 text-[#06B6D4]" />;
            case 'Eye':
                return <Eye className="h-5 w-5 text-[#06B6D4]" />;
            case 'Users':
                return <Users className="h-5 w-5 text-[#06B6D4]" />;
            default:
                return <Users className="h-5 w-5 text-[#06B6D4]" />;
        }
    };

    const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const handleDeleteUser = (user: any) => {
        setDeletingUser(user);
    };

    const confirmDeleteUser = async () => {
        if (!deletingUser) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/admin/users/${deletingUser.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setDeletingUser(null);
                window.location.reload();
            } else {
                const data = await response.json();
                alert(`Error: ${data.message || 'Failed to delete user'}`);
                setDeletingUser(null);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user. Please try again.');
            setDeletingUser(null);
        }
    };

    const loading = usersLoading || credentialsLoading || statsLoading;

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-[#06B6D4]/10 rounded-lg">
                            <Users className="h-8 w-8 text-[#06B6D4]" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-[#64748B]">Total Users</p>
                            <p className="text-3xl font-bold text-[#1E293B]">{stats?.total_users || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-[#64748B]">Pending Approval</p>
                            <p className="text-3xl font-bold text-[#1E293B]">{stats?.pending_users || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-[#64748B]">Active Users</p>
                            <p className="text-3xl font-bold text-[#1E293B]">{(stats?.total_users || 0) - (stats?.pending_users || 0)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-[#06B6D4]/10 rounded-lg">
                            <FileText className="h-8 w-8 text-[#06B6D4]" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-[#64748B]">Total Credentials</p>
                            <p className="text-3xl font-bold text-[#1E293B]">{stats?.total_credentials || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-[#1E293B] mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                        onClick={() => setShowCreateUser(true)}
                        className="group p-6 border-2 border-gray-200 rounded-xl hover:border-[#06B6D4] hover:shadow-lg transition-all duration-200 text-left bg-white"
                    >
                        <div className="flex items-center mb-3">
                            <div className="p-3 bg-[#06B6D4]/10 rounded-lg group-hover:bg-[#06B6D4]/20 transition-colors">
                                <UserPlus className="h-6 w-6 text-[#06B6D4]" />
                            </div>
                            <span className="ml-3 font-semibold text-[#1E293B]">Create COE</span>
                        </div>
                        <p className="text-sm text-[#64748B] group-hover:text-[#1E293B] transition-colors">Add new Controller of Examinations</p>
                    </button>

                    <button
                        onClick={() => setShowCreateUser(true)}
                        className="group p-6 border-2 border-gray-200 rounded-xl hover:border-[#06B6D4] hover:shadow-lg transition-all duration-200 text-left bg-white"
                    >
                        <div className="flex items-center mb-3">
                            <div className="p-3 bg-[#06B6D4]/10 rounded-lg group-hover:bg-[#06B6D4]/20 transition-colors">
                                <GraduationCap className="h-6 w-6 text-[#06B6D4]" />
                            </div>
                            <span className="ml-3 font-semibold text-[#1E293B]">Create Faculty</span>
                        </div>
                        <p className="text-sm text-[#64748B] group-hover:text-[#1E293B] transition-colors">Add new Department Faculty</p>
                    </button>

                    <button
                        onClick={() => setShowCreateUser(true)}
                        className="group p-6 border-2 border-gray-200 rounded-xl hover:border-[#06B6D4] hover:shadow-lg transition-all duration-200 text-left bg-white"
                    >
                        <div className="flex items-center mb-3">
                            <div className="p-3 bg-[#06B6D4]/10 rounded-lg group-hover:bg-[#06B6D4]/20 transition-colors">
                                <Award className="h-6 w-6 text-[#06B6D4]" />
                            </div>
                            <span className="ml-3 font-semibold text-[#1E293B]">Create Club Coordinator</span>
                        </div>
                        <p className="text-sm text-[#64748B] group-hover:text-[#1E293B] transition-colors">Add new Club Coordinator</p>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                    <div className="md:w-48">
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full px-3 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                        >
                            <option value="all">All Roles</option>
                            <option value="coe">COE</option>
                            <option value="department_faculty">Faculty</option>
                            <option value="club_coordinator">Club Coordinator</option>
                            <option value="external_verifier">External Verifier</option>
                            <option value="student">Student</option>
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-3 bg-[#1E293B] text-white rounded-lg hover:bg-[#334155] transition-colors flex items-center font-medium shadow-md"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowCreateUser(true)}
                            className="px-4 py-3 bg-[#06B6D4] text-white rounded-lg hover:bg-[#0891B2] transition-colors flex items-center font-medium shadow-md"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create User
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#F8FAFC]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    Department
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    10th School
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    12th School
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-[#06B6D4]/10 flex items-center justify-center">
                                                    {getRoleIconComponent(user.role)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-[#1E293B]">{user.name}</div>
                                                <div className="text-sm text-[#64748B]">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-[#06B6D4]/10 text-[#06B6D4]">
                                            {getRoleDisplayName(user.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1E293B]">
                                        {user.department || user.club_name || user.institution || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1E293B]">
                                        {user.tenth_school || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1E293B]">
                                        {user.twelfth_school || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            {user.is_active ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <span className={`text-sm font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748B]">
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            {!user.is_approved && (
                                                <button
                                                    onClick={() => approveUser(user.id)}
                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors shadow-sm"
                                                    title="Approve User"
                                                >
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Approve
                                                </button>
                                            )}
                                            {user.is_approved && (
                                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Approved
                                                </span>
                                            )}
                                            <button
                                                onClick={() => setViewingUser(user)}
                                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-[#1E293B] bg-white hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-[#1E293B] bg-white hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user)}
                                                className="inline-flex items-center px-2.5 py-1.5 border border-red-300 text-xs font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderCredentials = () => (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-lg font-bold text-[#1E293B] mb-4">Recent Credentials</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#F8FAFC]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    Credential
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    Issued By
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(Array.isArray(credentials) ? credentials : []).slice(0, 10).map((credential) => (
                                <tr key={credential.id} className="hover:bg-[#F8FAFC] transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-[#1E293B]">{credential.title}</div>
                                        <div className="text-sm text-[#64748B]">{credential.type}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1E293B]">
                                        {credential.student_id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1E293B]">
                                        {credential.issued_by}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748B]">
                                        {formatDate(credential.issued_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${credential.status === 'issued' ? 'bg-green-100 text-green-700' :
                                            credential.status === 'verified' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                            {credential.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#E2E8F0] border-t-[#06B6D4] mx-auto"></div>
                    <p className="mt-4 text-[#64748B] font-medium">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F5F9]">
            {/* Header */}
            <div className="bg-[#1E293B] shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-[#06B6D4] rounded-xl shadow-lg">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                                <p className="text-gray-300">Manage users and credentials</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#06B6D4] text-white shadow-md">
                                SSN Main Administrator
                            </span>
                            <button
                                onClick={logout}
                                className="px-6 py-2.5 bg-white text-[#1E293B] rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold shadow-md"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${activeTab === 'overview'
                                ? 'border-[#06B6D4] text-[#06B6D4]'
                                : 'border-transparent text-[#64748B] hover:text-[#1E293B] hover:border-gray-300'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${activeTab === 'users'
                                ? 'border-[#06B6D4] text-[#06B6D4]'
                                : 'border-transparent text-[#64748B] hover:text-[#1E293B] hover:border-gray-300'
                                }`}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => setActiveTab('credentials')}
                            className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${activeTab === 'credentials'
                                ? 'border-[#06B6D4] text-[#06B6D4]'
                                : 'border-transparent text-[#64748B] hover:text-[#1E293B] hover:border-gray-300'
                                }`}
                        >
                            Credentials
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'credentials' && renderCredentials()}
            </div>

            {/* Create User Modal */}
            {showCreateUser && (
                <CreateUserModal
                    onClose={() => setShowCreateUser(false)}
                    onUserCreated={() => {
                        setShowCreateUser(false);
                        window.location.reload();
                    }}
                />
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onUserUpdated={() => {
                        setEditingUser(null);
                        window.location.reload();
                    }}
                />
            )}

            {/* View User Details Modal */}
            {viewingUser && (
                <ViewUserDetailsModal
                    user={viewingUser}
                    onClose={() => setViewingUser(null)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deletingUser && (
                <DeleteConfirmationModal
                    userName={deletingUser.name}
                    onConfirm={confirmDeleteUser}
                    onCancel={() => setDeletingUser(null)}
                />
            )}
        </div>
    );
};

// Create User Modal Component
const CreateUserModal: React.FC<{
    onClose: () => void;
    onUserCreated: () => void;
}> = ({ onClose, onUserCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'coe',
        department: '',
        institution: 'SSN College of Engineering',
        club_name: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            console.log('Creating user with data:', formData);
            console.log('Using token:', token);

            const response = await fetch('http://localhost:8080/api/admin/onboard', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            console.log('User creation response:', data);

            if (response.ok) {
                alert('User created successfully!');
                onUserCreated();
            } else {
                alert(`Error: ${data.message || 'Failed to create user'}`);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user. Please check if the backend server is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-[#1E293B]">Create New User</h3>
                        <button
                            onClick={onClose}
                            className="text-[#94A3B8] hover:text-[#1E293B] transition-colors p-1"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                                    placeholder="Enter email address"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                    Phone *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                    Role *
                                </label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                                >
                                    <option value="coe">Controller of Examinations</option>
                                    <option value="department_faculty">Department Faculty</option>
                                    <option value="club_coordinator">Club Coordinator</option>
                                    <option value="external_verifier">External Verifier</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                Password *
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                                placeholder="Enter password"
                            />
                        </div>

                        {(formData.role === 'department_faculty' || formData.role === 'coe') && (
                            <div>
                                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                    Department
                                </label>
                                <select
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                                >
                                    <option value="">Select Department</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Information Technology">Information Technology</option>
                                    <option value="Electronics and Communication">Electronics and Communication</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                    <option value="Civil Engineering">Civil Engineering</option>
                                </select>
                            </div>
                        )}

                        {formData.role === 'club_coordinator' && (
                            <div>
                                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                    Club Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.club_name}
                                    onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                                    placeholder="Enter club name"
                                />
                            </div>
                        )}

                        <div className="flex justify-end space-x-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-gray-300 rounded-lg text-[#1E293B] hover:bg-[#F8FAFC] transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-[#06B6D4] text-white rounded-lg hover:bg-[#0891B2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
                            >
                                {loading ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Edit User Modal Component
const EditUserModal: React.FC<{
    user: any;
    onClose: () => void;
    onUserUpdated: () => void;
}> = ({ user, onClose, onUserUpdated }) => {
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        tenth_school: user.tenth_school || '',
        twelfth_school: user.twelfth_school || '',
        tenth_marks: user.tenth_marks || '',
        twelfth_marks: user.twelfth_marks || '',
        cutoff: user.cutoff || '',
        dob: user.dob || '',
        father_name: user.father_name || '',
        aadhar_number: user.aadhar_number || '',
        school_name: user.school_name || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate Aadhar number
        if (formData.aadhar_number && formData.aadhar_number.length !== 12) {
            alert('Aadhar number must be exactly 12 digits');
            return;
        }

        // Validate phone number
        if (formData.phone && formData.phone.length !== 10) {
            alert('Phone number must be exactly 10 digits');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            
            // Convert date format from DD-MM-YYYY to YYYY-MM-DD if needed
            let dobFormatted = formData.dob;
            if (dobFormatted && dobFormatted.includes('-') && dobFormatted.split('-').length === 3) {
                const parts = dobFormatted.split('-');
                // Check if it's DD-MM-YYYY format (first part is > 12)
                if (parts[0].length === 2 && parseInt(parts[0]) > 12) {
                    // Convert DD-MM-YYYY to YYYY-MM-DD
                    dobFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
            
            // Convert marks and cutoff to integers
            const updateData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                department: formData.department || '', // Ensure department is included (even if empty)
                tenth_school: formData.tenth_school,
                twelfth_school: formData.twelfth_school,
                tenth_marks: formData.tenth_marks ? parseInt(formData.tenth_marks.toString()) : 0,
                twelfth_marks: formData.twelfth_marks ? parseInt(formData.twelfth_marks.toString()) : 0,
                cutoff: formData.cutoff ? parseInt(formData.cutoff.toString()) : 0,
                dob: dobFormatted,
                father_name: formData.father_name,
                aadhar_number: formData.aadhar_number,
                school_name: formData.school_name,
            };
            
            console.log('Updating user with data:', updateData); // Debug log
            
            const response = await fetch(`http://localhost:8080/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update user');
            }

            alert('User updated successfully!');
            onUserUpdated();
        } catch (error: any) {
            console.error('Error updating user:', error);
            alert(error.message || 'Failed to update user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-[#1E293B]">Edit User Details</h2>
                            <p className="text-sm text-[#64748B] mt-1">Update all required fields</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-[#94A3B8] hover:text-[#1E293B] transition-colors p-2 hover:bg-[#F8FAFC] rounded-lg"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    placeholder="Enter email"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    required
                                    pattern="[0-9]{10}"
                                    maxLength="10"
                                    minLength="10"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        // Only allow digits
                                        const value = e.target.value.replace(/\D/g, '');
                                        // Limit to 10 digits
                                        const limitedValue = value.slice(0, 10);
                                        setFormData({ ...formData, phone: limitedValue });
                                    }}
                                    onBlur={(e) => {
                                        // Validate on blur
                                        if (e.target.value.length !== 10) {
                                            e.target.setCustomValidity('Phone number must be exactly 10 digits');
                                        } else {
                                            e.target.setCustomValidity('');
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    placeholder="Enter phone number (10 digits)"
                                />
                                {formData.phone && formData.phone.length !== 10 && (
                                    <p className="mt-1 text-sm text-red-600">Phone number must be exactly 10 digits</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    Department <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                >
                                    <option value="" className="text-[#94A3B8]">Select Department</option>
                                    <option value="Electrical and Electronics Engineering" className="text-[#1E293B]">Electrical and Electronics Engineering</option>
                                    <option value="Electronics and Communication Engineering" className="text-[#1E293B]">Electronics and Communication Engineering</option>
                                    <option value="Computer Science and Engineering" className="text-[#1E293B]">Computer Science and Engineering</option>
                                    <option value="Information Technology" className="text-[#1E293B]">Information Technology</option>
                                    <option value="Mechanical Engineering" className="text-[#1E293B]">Mechanical Engineering</option>
                                    <option value="Chemical Engineering" className="text-[#1E293B]">Chemical Engineering</option>
                                    <option value="Biomedical Engineering" className="text-[#1E293B]">Biomedical Engineering</option>
                                    <option value="Civil Engineering" className="text-[#1E293B]">Civil Engineering</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    10th School <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.tenth_school}
                                    onChange={(e) => setFormData({ ...formData, tenth_school: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    placeholder="Enter 10th school"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    12th School <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.twelfth_school}
                                    onChange={(e) => setFormData({ ...formData, twelfth_school: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    placeholder="Enter 12th school"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    10th Marks <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    value={formData.tenth_marks}
                                    onChange={(e) => setFormData({ ...formData, tenth_marks: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    placeholder="Enter 10th marks"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    12th Marks <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    value={formData.twelfth_marks}
                                    onChange={(e) => setFormData({ ...formData, twelfth_marks: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    placeholder="Enter 12th marks"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    Cut-off Marks <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.cutoff}
                                    onChange={(e) => setFormData({ ...formData, cutoff: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    placeholder="Enter cut-off marks"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    Date of Birth <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                />
                                <p className="mt-1 text-xs text-[#64748B]">Format: YYYY-MM-DD (e.g., 2004-05-27)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    Father Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.father_name}
                                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    placeholder="Enter father's name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    Aadhar Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    pattern="[0-9]{12}"
                                    maxLength="12"
                                    minLength="12"
                                    value={formData.aadhar_number}
                                    onChange={(e) => {
                                        // Only allow digits
                                        const value = e.target.value.replace(/\D/g, '');
                                        // Limit to 12 digits
                                        const limitedValue = value.slice(0, 12);
                                        setFormData({ ...formData, aadhar_number: limitedValue });
                                    }}
                                    onBlur={(e) => {
                                        // Validate on blur
                                        if (e.target.value.length !== 12) {
                                            e.target.setCustomValidity('Aadhar number must be exactly 12 digits');
                                        } else {
                                            e.target.setCustomValidity('');
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    placeholder="Enter Aadhar number (12 digits)"
                                />
                                {formData.aadhar_number && formData.aadhar_number.length !== 12 && (
                                    <p className="mt-1 text-sm text-red-600">Aadhar number must be exactly 12 digits</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                    School Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.school_name}
                                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    placeholder="Enter school name"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-4 border-t border-[#E2E8F0]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] hover:bg-[#F8FAFC] transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-[#06B6D4] text-white rounded-lg hover:bg-[#0891B2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
                            >
                                {loading ? 'Updating...' : 'Update User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// View User Details Modal Component
const ViewUserDetailsModal: React.FC<{
    user: any;
    onClose: () => void;
}> = ({ user, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-[#1E293B]">User Details</h3>
                        <button
                            onClick={onClose}
                            className="text-[#94A3B8] hover:text-[#1E293B] transition-colors p-1"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-[#F8FAFC] p-6 rounded-xl">
                            <h4 className="text-lg font-semibold text-[#1E293B] mb-4">Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-[#64748B]">Name</p>
                                    <p className="text-base text-[#1E293B] font-medium">{user.name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#64748B]">Email</p>
                                    <p className="text-base text-[#1E293B] font-medium">{user.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#64748B]">Phone</p>
                                    <p className="text-base text-[#1E293B] font-medium">{user.phone || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#64748B]">Role</p>
                                    <p className="text-base text-[#1E293B] font-medium">{getRoleDisplayName(user.role)}</p>
                                </div>
                                {user.student_id && (
                                    <div>
                                        <p className="text-sm font-medium text-[#64748B]">Student ID</p>
                                        <p className="text-base text-[#1E293B] font-medium">{user.student_id}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-[#64748B]">Status</p>
                                    <div className="flex items-center space-x-2">
                                        {user.is_active ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className={`text-base font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#64748B]">Approval Status</p>
                                    <div className="flex items-center space-x-2">
                                        {user.is_approved ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Clock className="h-4 w-4 text-orange-500" />
                                        )}
                                        <span className={`text-base font-medium ${user.is_approved ? 'text-green-600' : 'text-orange-600'}`}>
                                            {user.is_approved ? 'Approved' : 'Pending Approval'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#64748B]">Created At</p>
                                    <p className="text-base text-[#1E293B] font-medium">{formatDate(user.created_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Department/Institution Information */}
                        {(user.department || user.institution || user.club_name) && (
                            <div className="bg-[#F8FAFC] p-6 rounded-xl">
                                <h4 className="text-lg font-semibold text-[#1E293B] mb-4">Organization Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.department && (
                                        <div>
                                            <p className="text-sm font-medium text-[#64748B]">Department</p>
                                            <p className="text-base text-[#1E293B] font-medium">{user.department}</p>
                                        </div>
                                    )}
                                    {user.institution && (
                                        <div>
                                            <p className="text-sm font-medium text-[#64748B]">Institution</p>
                                            <p className="text-base text-[#1E293B] font-medium">{user.institution}</p>
                                        </div>
                                    )}
                                    {user.club_name && (
                                        <div>
                                            <p className="text-sm font-medium text-[#64748B]">Club Name</p>
                                            <p className="text-base text-[#1E293B] font-medium">{user.club_name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Academic Information (for students) */}
                        {(user.tenth_school || user.twelfth_school || user.tenth_marks || user.twelfth_marks) && (
                            <div className="bg-[#F8FAFC] p-6 rounded-xl">
                                <h4 className="text-lg font-semibold text-[#1E293B] mb-4">Academic Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.tenth_school && (
                                        <div>
                                            <p className="text-sm font-medium text-[#64748B]">10th School</p>
                                            <p className="text-base text-[#1E293B] font-medium">{user.tenth_school}</p>
                                        </div>
                                    )}
                                    {user.tenth_marks && (
                                        <div>
                                            <p className="text-sm font-medium text-[#64748B]">10th Marks</p>
                                            <p className="text-base text-[#1E293B] font-medium">{user.tenth_marks}</p>
                                        </div>
                                    )}
                                    {user.twelfth_school && (
                                        <div>
                                            <p className="text-sm font-medium text-[#64748B]">12th School</p>
                                            <p className="text-base text-[#1E293B] font-medium">{user.twelfth_school}</p>
                                        </div>
                                    )}
                                    {user.twelfth_marks && (
                                        <div>
                                            <p className="text-sm font-medium text-[#64748B]">12th Marks</p>
                                            <p className="text-base text-[#1E293B] font-medium">{user.twelfth_marks}</p>
                                        </div>
                                    )}
                                    {user.cutoff && (
                                        <div>
                                            <p className="text-sm font-medium text-[#64748B]">Cut-off Marks</p>
                                            <p className="text-base text-[#1E293B] font-medium">{user.cutoff}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Personal Information (for students) */}
                        {(user.dob || user.father_name || user.aadhar_number || user.school_name) && (
                            <div className="bg-[#F8FAFC] p-6 rounded-xl">
                                <h4 className="text-lg font-semibold text-[#1E293B] mb-4">Personal Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.dob && (
                                        <div>
                                            <p className="text-sm font-medium text-[#64748B]">Date of Birth</p>
                                            <p className="text-base text-[#1E293B] font-medium">{user.dob}</p>
                                        </div>
                                    )}
                                    {user.father_name && (
                                        <div>
                                            <p className="text-sm font-medium text-[#64748B]">Father's Name</p>
                                            <p className="text-base text-[#1E293B] font-medium">{user.father_name}</p>
                                        </div>
                                    )}
                                    {user.aadhar_number && (
                                        <div>
                                            <p className="text-sm font-medium text-[#64748B]">Aadhar Number</p>
                                            <p className="text-base text-[#1E293B] font-medium">{user.aadhar_number}</p>
                                        </div>
                                    )}
                                    {user.school_name && (
                                        <div>
                                            <p className="text-sm font-medium text-[#64748B]">School Name</p>
                                            <p className="text-base text-[#1E293B] font-medium">{user.school_name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-[#06B6D4] text-white rounded-lg hover:bg-[#0891B2] transition-colors font-medium shadow-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal: React.FC<{
    userName: string;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ userName, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                <div className="p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-4 bg-red-100 rounded-full">
                            <Trash2 className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-[#1E293B] text-center mb-3">
                        Delete User?
                    </h3>
                    
                    <p className="text-center text-[#64748B] mb-6">
                        Are you sure you want to delete <span className="font-semibold text-[#1E293B]">{userName}</span>? 
                        <br />
                        <span className="text-red-600 font-medium">This action cannot be undone.</span>
                    </p>

                    <div className="flex space-x-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-[#1E293B] hover:bg-[#F8FAFC] transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
