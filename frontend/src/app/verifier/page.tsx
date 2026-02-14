'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useApi';
import { adminService } from '@/services/adminService';
import Link from 'next/link';
import { DashboardHeader } from '@/components/DashboardHeader';
import {
    StudentsTab,
    EditUserModal,
    ViewUserDetailsModal,
    DeleteConfirmationModal,
    CreateStudentModal,
} from '@/components/admin';

const VerifierDashboard: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'verify' | 'students'>('verify');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [academicDepartments, setAcademicDepartments] = useState<{ id?: string; name: string }[]>([]);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [viewingUser, setViewingUser] = useState<any>(null);
    const [deletingUser, setDeletingUser] = useState<any>(null);
    const [showCreateStudent, setShowCreateStudent] = useState(false);

    const { user, isAuthenticated } = useAuth();
    const { users, loading: usersLoading, approveUser, fetchUsers } = useUsers();

    useEffect(() => {
        adminService.listDepartments().then((list: any[]) => {
            if (Array.isArray(list)) setAcademicDepartments(list.filter((d: any) => d.academic_department));
        }).catch(() => { });
    }, []);

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
            await fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete student');
            setDeletingUser(null);
        }
    };

    const handleApproveUser = async (userId: string | number) => {
        const id = typeof userId === 'number' ? String(userId) : userId;
        if (!id) return;
        try {
            await approveUser(id);
            await fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to approve');
        }
    };

    const handleUserUpdated = () => {
        setEditingUser(null);
        fetchUsers();
    };

    if (usersLoading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4" />
                    <p className="text-sm text-slate-300">Loading dashboard...</p>
                </div>
            </main>
        );
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            <DashboardHeader user={user ?? null} onLogout={handleLogout} maxWidth="max-w-7xl" />

            <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('verify')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'verify' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            <Search className="h-4 w-4 inline-block mr-2" />
                            Verify Credential
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'students' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            <GraduationCap className="h-4 w-4 inline-block mr-2" />
                            All Students
                        </button>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'verify' && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm text-center">
                        <Search className="h-16 w-16 text-teal-400/80 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">Verify a credential</h2>
                        <p className="text-indigo-200/80 mb-6 max-w-md mx-auto">
                            Use the public verification page to check whether a certificate or credential is valid and issued by BlockCred.
                        </p>
                        <Link
                            href="/verify"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-500/20 text-teal-200 border border-teal-400/30 hover:bg-teal-500/30 transition-all font-semibold"
                        >
                            <Search className="h-5 w-5" />
                            Go to Verify
                        </Link>
                    </div>
                )}

                {activeTab === 'students' && (
                    <StudentsTab
                        users={users}
                        searchTerm={searchTerm}
                        filterDepartment={filterDepartment}
                        onSearchChange={setSearchTerm}
                        onFilterDepartmentChange={setFilterDepartment}
                        onCreateUser={() => setShowCreateStudent(true)}
                        onApproveUser={handleApproveUser}
                        onViewUser={setViewingUser}
                        onEditUser={setEditingUser}
                        onDeleteUser={handleDeleteUser}
                        departments={academicDepartments}
                    />
                )}
            </div>

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onUserUpdated={handleUserUpdated}
                />
            )}

            {viewingUser && (
                <ViewUserDetailsModal
                    user={viewingUser}
                    onClose={() => setViewingUser(null)}
                    onApprove={viewingUser.role === 'student' && !viewingUser.is_approved ? (id) => handleApproveUser(id) : undefined}
                />
            )}

            {deletingUser && (
                <DeleteConfirmationModal
                    userName={deletingUser.name}
                    onConfirm={confirmDeleteUser}
                    onCancel={() => setDeletingUser(null)}
                />
            )}

            {showCreateStudent && (
                <CreateStudentModal
                    onClose={() => setShowCreateStudent(false)}
                    onStudentCreated={() => {
                        setShowCreateStudent(false);
                        fetchUsers();
                    }}
                />
            )}
        </main>
    );
};

export default VerifierDashboard;
