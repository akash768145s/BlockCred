'use client';

import React, { useState, useEffect } from 'react';
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
    const [filterDepartment, setFilterDepartment] = useState('all');

    const { logout, isAuthenticated } = useAuth();
    const { users, loading: usersLoading, error: usersError, approveUser } = useUsers();
    const { credentials, loading: credentialsLoading, error: credentialsError } = useCredentials();
    const { stats, loading: statsLoading, error: statsError } = useDashboardStats();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthenticated() && !usersLoading) {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
            }
        }
    }, [isAuthenticated, usersLoading]);

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
            case 'Users':
                return <Users className="h-5 w-5 text-[#06B6D4]" />;
            default:
                return <Users className="h-5 w-5 text-[#06B6D4]" />;
        }
    };

    // Define issuing authority roles
    const issuingAuthorityRoles = ['coe', 'department_faculty', 'club_coordinator'];

    const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterRole === 'all') {
            return matchesSearch;
        } else if (filterRole === 'student') {
            return matchesSearch && user.role === 'student';
        } else if (filterRole === 'issuing_authorities') {
            return matchesSearch && issuingAuthorityRoles.includes(user.role);
        } else {
            return matchesSearch && user.role === filterRole;
        }
    });

    // Separate students and issuing authorities
    const students = filteredUsers.filter(user => user.role === 'student');
    const issuingAuthorities = filteredUsers.filter(user => issuingAuthorityRoles.includes(user.role));

    const handleDeleteUser = (user: any) => {
        setDeletingUser(user);
    };

    const handleDeleteCredential = async (credentialId: number | string) => {
        if (!confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // Try DELETE endpoint first
            let response = await fetch(`http://localhost:8080/api/certificates/${credentialId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            // If DELETE doesn't work, try using the ID from the credential object
            if (!response.ok) {
                // Try with cert_id if available
                const credential = (Array.isArray(credentials) ? credentials : []).find((c: any) => c.id === credentialId || c._id === credentialId);
                if (credential && (credential as any).cert_id) {
                    response = await fetch(`http://localhost:8080/api/certificates/${(credential as any).cert_id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                }
            }

            if (response.ok) {
                alert('Credential deleted successfully!');
                window.location.reload();
            } else {
                const data = await response.json();
                alert(`Error: ${data.message || 'Failed to delete credential. The delete endpoint may not be available.'}`);
            }
        } catch (error) {
            console.error('Error deleting credential:', error);
            alert('Failed to delete credential. Please try again.');
        }
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

    // Calculate stats from actual data
    const allUsers = Array.isArray(users) ? users : [];
    const allStudents = allUsers.filter((u: any) => u.role === 'student');
    const allIssuers = allUsers.filter((u: any) => issuingAuthorityRoles.includes(u.role));
    const totalUsers = allStudents.length + allIssuers.length;
    const pendingUsers = allUsers.filter((u: any) => !u.is_approved && !u.is_active).length;
    const totalCredentials = Array.isArray(credentials) ? credentials.length : 0;

    // Use stats from hook if available, otherwise use calculated stats
    const displayStats = {
        total_users: stats?.total_users || totalUsers,
        pending_users: stats?.pending_users || pendingUsers,
        total_credentials: stats?.total_credentials || totalCredentials,
        total_students: allStudents.length,
        total_issuers: allIssuers.length,
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Users className="h-7 w-7 text-blue-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Total Users</p>
                        <p className="text-2xl font-bold text-white">{displayStats.total_users}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Shield className="h-7 w-7 text-indigo-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Issuers</p>
                        <p className="text-2xl font-bold text-white">{displayStats.total_issuers}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <GraduationCap className="h-7 w-7 text-cyan-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Students</p>
                        <p className="text-2xl font-bold text-white">{displayStats.total_students}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Clock className="h-7 w-7 text-yellow-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Pending Approval</p>
                        <p className="text-2xl font-bold text-white">{displayStats.pending_users}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <FileText className="h-7 w-7 text-green-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Total Credentials</p>
                        <p className="text-2xl font-bold text-white">{displayStats.total_credentials}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-indigo-300 mb-3 uppercase tracking-wide">Issuing Authorities</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => setShowCreateUser(true)}
                            className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                        >
                            <div className="flex items-center mb-2">
                                <UserPlus className="h-5 w-5 text-blue-400" />
                                <span className="ml-2 font-medium text-white">Create COE</span>
                            </div>
                            <p className="text-sm text-slate-300">Controller of Examinations</p>
                        </button>

                        <button
                            onClick={() => setShowCreateUser(true)}
                            className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                        >
                            <div className="flex items-center mb-2">
                                <GraduationCap className="h-5 w-5 text-green-400" />
                                <span className="ml-2 font-medium text-white">Create Faculty</span>
                            </div>
                            <p className="text-sm text-slate-300">Department Faculty</p>
                        </button>

                        <button
                            onClick={() => setShowCreateUser(true)}
                            className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                        >
                            <div className="flex items-center mb-2">
                                <Award className="h-5 w-5 text-purple-400" />
                                <span className="ml-2 font-medium text-white">Create Club Coordinator</span>
                            </div>
                            <p className="text-sm text-slate-300">Club Coordinator</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAuthorities = () => {
        // Filter only issuing authorities
        const issuingAuthorityRoles = ['coe', 'department_faculty', 'club_coordinator'];
        const filteredAuthorities = (Array.isArray(users) ? users : []).filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const isIssuingAuthority = issuingAuthorityRoles.includes(user.role);

            if (filterRole === 'all' || filterRole === 'issuing_authorities') {
                return matchesSearch && isIssuingAuthority;
            } else {
                return matchesSearch && user.role === filterRole && isIssuingAuthority;
            }
        });

        return (
            <div className="space-y-6">
                {/* Search and Filter */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search issuing authorities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg text-white placeholder-slate-400 bg-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/20"
                                />
                            </div>
                        </div>
                        <div className="md:w-56">
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full px-3 py-2 border border-white/20 rounded-lg text-white bg-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Authorities</option>
                                <option value="coe">COE</option>
                                <option value="department_faculty">Faculty</option>
                                <option value="club_coordinator">Club Coordinator</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setShowCreateUser(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Authority
                        </button>
                    </div>
                </div>

                {/* Issuing Authorities Table */}
                {filteredAuthorities.length > 0 ? (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <Shield className="h-5 w-5 mr-2 text-indigo-400" />
                                Issuing Authorities ({filteredAuthorities.length})
                            </h3>
                            <p className="text-xs text-slate-300 mt-1">COE, Faculty, and Club Coordinators</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-slate-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-slate-800/30 divide-y divide-white/10">
                                    {filteredAuthorities.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            {getRoleIconComponent(user.role)}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-white">{user.name}</div>
                                                        <div className="text-sm text-slate-400">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                    {getRoleDisplayName(user.role)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    {user.is_active ? (
                                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-yellow-400" />
                                                    )}
                                                    <span className={`text-sm ${user.is_active ? 'text-green-400' : 'text-yellow-400'}`}>
                                                        {user.is_active ? 'Active' : 'Pending'}
                                                    </span>
                                                </div>
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
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingUser(user)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Edit User"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg p-12 text-center">
                        <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No issuing authorities found</h3>
                        <p className="text-sm text-slate-300 mb-4">
                            {searchTerm || filterRole !== 'all'
                                ? 'Try adjusting your search or filter criteria'
                                : 'Get started by creating a new issuing authority'}
                        </p>
                        {!searchTerm && filterRole === 'all' && (
                            <button
                                onClick={() => setShowCreateUser(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Authority
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderStudents = () => {
        // Department options
        const departments = [
            { value: 'all', label: 'All Departments' },
            { value: 'Computer Science Engineering', label: 'CSE' },
            { value: 'Information Technology', label: 'IT' },
            { value: 'Electronics and Communication Engineering', label: 'ECE' },
            { value: 'Electrical and Electronics Engineering', label: 'EEE' },
            { value: 'Civil Engineering', label: 'Civil' },
            { value: 'Mechanical Engineering', label: 'Mech' },
            { value: 'Biomedical Engineering', label: 'Biomedical' },
            { value: 'Chemical Engineering', label: 'Chemical' }
        ];

        // Filter only students
        const filteredStudents = (Array.isArray(users) ? users : []).filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDepartment = filterDepartment === 'all' ||
                (user.department && user.department.toLowerCase() === filterDepartment.toLowerCase());
            return matchesSearch && matchesDepartment && user.role === 'student';
        });

        return (
            <div className="space-y-6">
                {/* Department Navbar */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/50 to-cyan-900/50">
                        <h3 className="text-sm font-semibold text-slate-200 mb-3">Filter by Department</h3>
                        <div className="flex flex-wrap gap-2">
                            {departments.map((dept) => (
                                <button
                                    key={dept.value}
                                    onClick={() => setFilterDepartment(dept.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterDepartment === dept.value
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/20'
                                        }`}
                                >
                                    {dept.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg text-white placeholder-slate-400 bg-white/10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/20"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateUser(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Student
                        </button>
                    </div>
                </div>

                {/* Students Table */}
                {filteredStudents.length > 0 ? (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/50 to-cyan-900/50">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <GraduationCap className="h-5 w-5 mr-2 text-blue-400" />
                                Students ({filteredStudents.length})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-slate-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Student ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Department
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            10th School
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            12th School
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-slate-800/30 divide-y divide-white/10">
                                    {filteredStudents.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/5">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                                            {getRoleIconComponent(user.role)}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-white">{user.name}</div>
                                                        <div className="text-sm text-slate-400">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {user.student_id || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {user.department || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {user.tenth_school || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                {user.twelfth_school || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    {user.is_active ? (
                                                        <CheckCircle className="h-4 w-4 text-green-400" />
                                                    ) : (
                                                        <Clock className="h-4 w-4 text-yellow-400" />
                                                    )}
                                                    <span className={`text-sm ${user.is_active ? 'text-green-400' : 'text-yellow-400'}`}>
                                                        {user.is_active ? 'Active' : 'Pending'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
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
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingUser(user)}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Edit User"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg p-12 text-center">
                        <GraduationCap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No students found</h3>
                        <p className="text-sm text-slate-300 mb-4">
                            {searchTerm
                                ? 'Try adjusting your search criteria'
                                : 'Get started by creating a new student'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setShowCreateUser(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Student
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderCredentials = () => (
        <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Issued Credentials</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Credential
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Issued By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800/30 divide-y divide-white/10">
                            {(Array.isArray(credentials) ? credentials : []).map((credential) => (
                                <tr key={credential.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{credential.title || 'N/A'}</div>
                                        <div className="text-sm text-slate-400">{credential.type || (credential as any).cert_type || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {credential.student_id || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {credential.issued_by || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {credential.issued_date ? formatDate(credential.issued_date) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${credential.status === 'issued' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                            credential.status === 'verified' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                                'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                            }`}>
                                            {credential.status || 'issued'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleDeleteCredential(credential.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                            title="Delete Credential"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
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
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4"></div>
                    <p className="text-sm text-slate-300">Loading admin dashboard...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center shadow-lg">
                            <Shield className="h-6 w-6 text-indigo-300" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-300 font-semibold">BlockCred</p>
                            <h1 className="text-xl font-semibold text-white mt-1">Main Admin Dashboard</h1>
                            <p className="text-xs text-indigo-200">Manage users and credentials</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/20">
                            SSN Main Administrator
                        </span>
                        <button
                            onClick={logout}
                            className="px-4 py-2 text-xs font-semibold text-white border border-white/20 rounded-lg hover:bg-white/10 transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'overview'
                                ? 'bg-white/10 text-white border-t border-x border-white/20'
                                : 'text-indigo-200 hover:text-white'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('authorities')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'authorities'
                                ? 'bg-white/10 text-white border-t border-x border-white/20'
                                : 'text-indigo-200 hover:text-white'
                                }`}
                        >
                            Authorities
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'students'
                                ? 'bg-white/10 text-white border-t border-x border-white/20'
                                : 'text-indigo-200 hover:text-white'
                                }`}
                        >
                            Students
                        </button>
                        <button
                            onClick={() => setActiveTab('credentials')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'credentials'
                                ? 'bg-white/10 text-white border-t border-x border-white/20'
                                : 'text-indigo-200 hover:text-white'
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
                {activeTab === 'authorities' && renderAuthorities()}
                {activeTab === 'students' && renderStudents()}
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
        </main>
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

        // Validate department for Department Faculty and Club Coordinator
        if ((formData.role === 'department_faculty' || formData.role === 'club_coordinator') && !formData.department) {
            alert('Department is required for this role');
            return;
        }

        // Validate club_name for Club Coordinator
        if (formData.role === 'club_coordinator' && !formData.club_name) {
            alert('Club name is required for Club Coordinator');
            return;
        }

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
                                    Issuing Authority Role *
                                </label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                                >
                                    <optgroup label="Issuing Authorities">
                                        <option value="coe">COE - Controller of Examinations</option>
                                        <option value="department_faculty">Faculty - Department Faculty</option>
                                        <option value="club_coordinator">Club - Club Coordinator</option>
                                    </optgroup>
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

                        {formData.role === 'department_faculty' && (
                            <div>
                                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                    Department <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                                >
                                    <option value="">Select Department</option>
                                    <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
                                    <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                                    <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                                    <option value="Information Technology">Information Technology</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                    <option value="Chemical Engineering">Chemical Engineering</option>
                                    <option value="Biomedical Engineering">Biomedical Engineering</option>
                                    <option value="Civil Engineering">Civil Engineering</option>
                                </select>
                            </div>
                        )}

                        {formData.role === 'club_coordinator' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                                    >
                                        <option value="">Select Department</option>
                                        <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
                                        <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                                        <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                                        <option value="Information Technology">Information Technology</option>
                                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                                        <option value="Chemical Engineering">Chemical Engineering</option>
                                        <option value="Biomedical Engineering">Biomedical Engineering</option>
                                        <option value="Civil Engineering">Civil Engineering</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#1E293B] mb-2">
                                        Club Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.club_name}
                                        onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-all"
                                        placeholder="Enter club name"
                                    />
                                </div>
                            </>
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
    const isStudent = user.role === 'student';

    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        department: user.department || '',
        club_name: (!isStudent ? (user.club_name || '') : ''),
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

        // For staff users, allow role, department, and club_name changes
        if (!isStudent) {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');

                // Ensure role is always included and not empty
                if (!formData.role || formData.role.trim() === '') {
                    alert('Role is required');
                    setLoading(false);
                    return;
                }

                const updateData: any = {
                    role: formData.role.trim()
                };

                // Add department for Department Faculty and Club Coordinator
                if (formData.role === 'department_faculty' || formData.role === 'club_coordinator') {
                    if (!formData.department) {
                        alert('Department is required for this role');
                        setLoading(false);
                        return;
                    }
                    updateData.department = formData.department;
                }

                // Add club_name for Club Coordinator
                if (formData.role === 'club_coordinator') {
                    if (!formData.club_name) {
                        alert('Club name is required for Club Coordinator');
                        setLoading(false);
                        return;
                    }
                    updateData.club_name = formData.club_name;
                }

                // Debug: Log what we're sending
                console.log('Updating user with data:', JSON.stringify(updateData, null, 2));
                console.log('User ID:', user.id);
                console.log('Current role:', user.role);
                console.log('New role:', formData.role);
                console.log('FormData role value:', formData.role);
                console.log('UpdateData role value:', updateData.role);

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
            return;
        }

        // For students, validate all fields
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
                        {!isStudent ? (
                            // Staff/Other Roles - Role, Department (for Faculty/Club), Club Name (for Club)
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                        Issuing Authority Role <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.role}
                                        onChange={(e) => {
                                            const newRole = e.target.value;
                                            // Clear department and club_name when changing to COE
                                            if (newRole === 'coe') {
                                                setFormData({ ...formData, role: newRole, department: '', club_name: '' });
                                            } else if (newRole === 'department_faculty') {
                                                // Clear club_name when changing to Department Faculty
                                                setFormData({ ...formData, role: newRole, club_name: '' });
                                            } else {
                                                setFormData({ ...formData, role: newRole });
                                            }
                                        }}
                                        className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                    >
                                        <option value="ssn_main_admin">SSN Main Admin</option>
                                        <optgroup label="Issuing Authorities">
                                            <option value="coe">COE - Controller of Examinations</option>
                                            <option value="department_faculty">Faculty - Department Faculty</option>
                                            <option value="club_coordinator">Club - Club Coordinator</option>
                                        </optgroup>
                                    </select>
                                </div>

                                {(formData.role === 'department_faculty' || formData.role === 'club_coordinator') && (
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
                                            <option value="">Select Department</option>
                                            <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
                                            <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                                            <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                                            <option value="Information Technology">Information Technology</option>
                                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                                            <option value="Chemical Engineering">Chemical Engineering</option>
                                            <option value="Biomedical Engineering">Biomedical Engineering</option>
                                            <option value="Civil Engineering">Civil Engineering</option>
                                        </select>
                                    </div>
                                )}

                                {formData.role === 'club_coordinator' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                                            Club Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.club_name}
                                            onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-[#E2E8F0] rounded-lg text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-[#06B6D4] transition-all"
                                            placeholder="Enter club name"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Students - All fields
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
                        )}

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