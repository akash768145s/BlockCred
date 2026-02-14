'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, useDashboardStats } from '@/hooks/useApi';
import { DashboardHeader } from '@/components/DashboardHeader';
import { adminService } from '@/services/adminService';
import {
    CreateUserModal,
    EditUserModal,
    ViewUserDetailsModal,
    DeleteConfirmationModal,
    OverviewTab,
    UsersTab,
    RolesTab,
    DepartmentsTab,
    CredentialTypesTab,
} from '@/components/admin';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'roles' | 'departments' | 'credentialTypes'>('overview');
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [viewingUser, setViewingUser] = useState<any>(null);
    const [deletingUser, setDeletingUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');

    const { user, logout, isAuthenticated } = useAuth();
    const { users, loading: usersLoading, error: usersError, approveUser } = useUsers();
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

    const handleDeleteUser = (user: any) => {
        setDeletingUser(user);
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
        const id = typeof userId === 'number' ? String(userId) : userId;
        if (!id) {
            console.error('Invalid user ID:', userId);
            return;
        }
        await approveUser(id);
    };

    const loading = usersLoading || statsLoading;

    // Calculate stats from actual data
    const allUsers = Array.isArray(users) ? users : [];
    const allStudents = allUsers.filter((u: any) => u.role === 'student');
    const totalUsers = allUsers.length;
    const pendingUsers = allUsers.filter((u: any) => !u.is_approved && !u.is_active).length;

    // Use stats from hook if available, otherwise use calculated stats
    const displayStats = {
        total_users: stats?.total_users || totalUsers,
        pending_users: stats?.pending_users || pendingUsers,
        total_students: allStudents.length,
        total_issuers: totalUsers - allStudents.length,
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

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            <DashboardHeader user={user ?? null} onLogout={logout} maxWidth="max-w-7xl" />

            <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'overview' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'users' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'roles' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Roles
                        </button>
                        <button
                            onClick={() => setActiveTab('departments')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'departments' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Departments
                        </button>
                        <button
                            onClick={() => setActiveTab('credentialTypes')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'credentialTypes' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Credential Types
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
                {activeTab === 'users' && (
                    <UsersTab
                        users={users}
                        searchTerm={searchTerm}
                        filterRole={filterRole}
                        filterDepartment={filterDepartment}
                        onSearchChange={setSearchTerm}
                        onFilterRoleChange={setFilterRole}
                        onFilterDepartmentChange={setFilterDepartment}
                        onCreateUser={() => setShowCreateUser(true)}
                        onApproveUser={handleApproveUser}
                        onViewUser={setViewingUser}
                        onEditUser={setEditingUser}
                        onDeleteUser={handleDeleteUser}
                    />
                )}
                {activeTab === 'roles' && <RolesTab />}
                {activeTab === 'departments' && <DepartmentsTab />}
                {activeTab === 'credentialTypes' && <CredentialTypesTab />}
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
