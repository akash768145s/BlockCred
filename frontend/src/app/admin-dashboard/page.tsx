'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    department?: string;
    institution?: string;
    club_name?: string;
    is_active: boolean;
    is_approved: boolean;
    created_at: string;
}

interface Credential {
    id: number;
    type: string;
    title: string;
    student_id: string;
    student_name: string;
    issued_by: string;
    issued_date: string;
    status: string;
}

const AdminDashboard: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState<User[]>([]);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    useEffect(() => {
        fetchUsers();
        fetchCredentials();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Users API Response:', data);
                // Ensure we have an array of users
                const usersData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
                console.log('Processed users data:', usersData);
                setUsers(usersData);
            } else {
                console.error('Failed to fetch users:', response.statusText);
                setUsers([]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCredentials = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/credentials', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                // Ensure we have an array of credentials
                const credentialsData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
                setCredentials(credentialsData);
            } else {
                console.error('Failed to fetch credentials:', response.statusText);
                setCredentials([]);
            }
        } catch (error) {
            console.error('Error fetching credentials:', error);
            setCredentials([]);
        }
    };

    const approveUser = async (userId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/users/${userId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                await fetchUsers();
            } else {
                const data = await response.json().catch(() => ({}));
                console.error('Failed to approve user:', data.message || response.statusText);
                alert(`Failed to approve user: ${data.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Error approving user:', error);
            alert('Error approving user.');
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ssn_main_admin':
                return <Shield className="h-5 w-5 text-red-500" />;
            case 'coe':
                return <FileText className="h-5 w-5 text-blue-500" />;
            case 'department_faculty':
                return <GraduationCap className="h-5 w-5 text-green-500" />;
            case 'club_coordinator':
                return <Award className="h-5 w-5 text-purple-500" />;
            case 'external_verifier':
                return <Eye className="h-5 w-5 text-yellow-500" />;
            case 'student':
                return <Users className="h-5 w-5 text-gray-500" />;
            default:
                return <Users className="h-5 w-5 text-gray-500" />;
        }
    };

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'ssn_main_admin':
                return 'SSN Main Admin';
            case 'coe':
                return 'Controller of Examinations';
            case 'department_faculty':
                return 'Department Faculty';
            case 'club_coordinator':
                return 'Club Coordinator';
            case 'external_verifier':
                return 'External Verifier';
            case 'student':
                return 'Student';
            default:
                return role;
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
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const stats = {
        totalUsers: Array.isArray(users) ? users.length : 0,
        pendingApproval: Array.isArray(users) ? users.filter(u => !u.is_approved).length : 0,
        activeUsers: Array.isArray(users) ? users.filter(u => u.is_active).length : 0,
        totalCredentials: Array.isArray(credentials) ? credentials.length : 0,
        issuedToday: Array.isArray(credentials) ? credentials.filter(c => {
            const today = new Date().toISOString().split('T')[0];
            return c.issued_date === today;
        }).length : 0
    };

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="flex items-center">
                        <Clock className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pendingApproval}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Users</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="flex items-center">
                        <FileText className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Credentials</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalCredentials}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setShowCreateUser(true)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="flex items-center mb-2">
                            <UserPlus className="h-5 w-5 text-blue-600" />
                            <span className="ml-2 font-medium text-gray-900">Create COE</span>
                        </div>
                        <p className="text-sm text-gray-600">Add new Controller of Examinations</p>
                    </button>

                    <button
                        onClick={() => setShowCreateUser(true)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="flex items-center mb-2">
                            <GraduationCap className="h-5 w-5 text-green-600" />
                            <span className="ml-2 font-medium text-gray-900">Create Faculty</span>
                        </div>
                        <p className="text-sm text-gray-600">Add new Department Faculty</p>
                    </button>

                    <button
                        onClick={() => setShowCreateUser(true)}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="flex items-center mb-2">
                            <Award className="h-5 w-5 text-purple-600" />
                            <span className="ml-2 font-medium text-gray-900">Create Club Coordinator</span>
                        </div>
                        <p className="text-sm text-gray-600">Add new Club Coordinator</p>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="md:w-48">
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            onClick={() => fetchUsers()}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowCreateUser(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create User
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Department/Club
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    {getRoleIcon(user.role)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                                            {getRoleDisplayName(user.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {user.department || user.club_name || user.institution || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            {user.is_active ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <span className={`text-sm ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            {!user.is_approved && (
                                                <button
                                                    onClick={() => approveUser(user.id)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button className="text-blue-600 hover:text-blue-900">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button className="text-gray-600 hover:text-gray-900">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button className="text-red-600 hover:text-red-900">
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
        </div>
    );

    const renderCredentials = () => (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Credentials</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Credential
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Issued By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(Array.isArray(credentials) ? credentials : []).slice(0, 10).map((credential) => (
                                <tr key={credential.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{credential.title}</div>
                                        <div className="text-sm text-gray-500">{credential.type}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {credential.student_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {credential.issued_by}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(credential.issued_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${credential.status === 'issued' ? 'bg-green-100 text-green-800' :
                                            credential.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
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
                            <Shield className="h-8 w-8 text-red-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                                <p className="text-gray-600">Manage users and credentials</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                SSN Main Administrator
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
                            onClick={() => setActiveTab('users')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => setActiveTab('credentials')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'credentials'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                        fetchUsers();
                    }}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Create New User</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter email address"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Role *
                                </label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="coe">Controller of Examinations</option>
                                    <option value="department_faculty">Department Faculty</option>
                                    <option value="club_coordinator">Club Coordinator</option>
                                    <option value="external_verifier">External Verifier</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password *
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter password"
                            />
                        </div>

                        {(formData.role === 'department_faculty' || formData.role === 'coe') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department
                                </label>
                                <select
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Club Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.club_name}
                                    onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter club name"
                                />
                            </div>
                        )}

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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

export default AdminDashboard;
