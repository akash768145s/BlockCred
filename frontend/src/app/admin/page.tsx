'use client';

import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, useCredentials, useDashboardStats } from '@/hooks/useApi';
import { adminService } from '@/services/adminService';
import {
    CreateUserModal,
    EditUserModal,
    ViewUserDetailsModal,
    DeleteConfirmationModal,
    OverviewTab,
    AuthoritiesTab,
    StudentsTab,
    CredentialsTab
} from '@/components/admin';

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
            // Convert to string if it's a number
            const idToDelete = typeof credentialId === 'number' ? credentialId.toString() : credentialId;
            await adminService.deleteCredential(idToDelete);
            alert('Credential deleted successfully!');
            window.location.reload();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to delete credential. Please try again.');
        }
    };

    const confirmDeleteUser = async () => {
        if (!deletingUser) return;

        try {
            await adminService.deleteUser(deletingUser.id);
            setDeletingUser(null);
            window.location.reload();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to delete user. Please try again.');
            setDeletingUser(null);
        }
    };

    const handleApproveUser = async (userId: string | number) => {
        const userIdNumber = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        if (isNaN(userIdNumber)) {
            console.error('Invalid user ID:', userId);
            return;
        }
        await approveUser(userIdNumber);
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
                {activeTab === 'overview' && (
                    <OverviewTab
                        displayStats={displayStats}
                        onCreateUser={() => setShowCreateUser(true)}
                    />
                )}
                {activeTab === 'authorities' && (
                    <AuthoritiesTab
                        users={users}
                        searchTerm={searchTerm}
                        filterRole={filterRole}
                        onSearchChange={setSearchTerm}
                        onFilterChange={setFilterRole}
                        onCreateUser={() => setShowCreateUser(true)}
                        onApproveUser={handleApproveUser}
                        onViewUser={setViewingUser}
                        onEditUser={setEditingUser}
                        onDeleteUser={handleDeleteUser}
                    />
                )}
                {activeTab === 'students' && (
                    <StudentsTab
                        users={users}
                        searchTerm={searchTerm}
                        filterDepartment={filterDepartment}
                        onSearchChange={setSearchTerm}
                        onFilterDepartmentChange={setFilterDepartment}
                        onCreateUser={() => setShowCreateUser(true)}
                        onApproveUser={handleApproveUser}
                        onViewUser={setViewingUser}
                        onEditUser={setEditingUser}
                        onDeleteUser={handleDeleteUser}
                    />
                )}
                {activeTab === 'credentials' && (
                    <CredentialsTab
                        credentials={credentials}
                        onDeleteCredential={handleDeleteCredential}
                    />
                )}
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

export default AdminDashboard;
