'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, Users, Clock, CheckCircle, UserPlus, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, useDashboardStats } from '@/hooks/useApi';
import { ViewUserDetailsModal } from '@/components/admin';

const StudentVerifierDashboard: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [viewingStudent, setViewingStudent] = useState<any>(null);
    const { logout, isAuthenticated } = useAuth();
    const { users, loading: usersLoading, approveUser, fetchUsers } = useUsers();
    const { stats, loading: statsLoading } = useDashboardStats();

    useEffect(() => {
        if (!isAuthenticated() && !usersLoading) {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
            }
        }
    }, [isAuthenticated, usersLoading]);

    const allUsers = Array.isArray(users) ? users : [];
    const students = allUsers.filter((u: any) => u.role === 'student');
    // Treat any student with is_approved === false as pending, regardless of is_active
    const pendingStudents = students.filter((u: any) => !u.is_approved);
    const approvedStudents = students.filter((u: any) => u.is_approved);

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

    const loading = usersLoading || statsLoading;

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4" />
                    <p className="text-sm text-slate-300">Loading Student Verifier dashboard...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center shadow-lg">
                            <UserCheck className="h-6 w-6 text-amber-300" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-300 font-semibold">BlockCred</p>
                            <h1 className="text-xl font-semibold text-white mt-1">Student Verifier Dashboard</h1>
                            <p className="text-xs text-indigo-200">Review and approve new student registrations</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                            Student Verifier
                        </span>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                router.push('/login');
                            }}
                            className="px-4 py-2 text-xs font-semibold text-white border border-white/20 rounded-lg hover:bg-white/10 transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                            onClick={() => setActiveTab('approve')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'approve'
                                ? 'bg-white/10 text-white border-t border-x border-white/20'
                                : 'text-indigo-200 hover:text-white'
                                }`}
                        >
                            Approve Students
                            {pendingStudents.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-xs">
                                    {pendingStudents.length}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-indigo-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-indigo-200/80">Students Created</p>
                                        <p className="text-2xl font-bold text-white mt-1">{stats?.total_students ?? students.length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                        <Clock className="h-6 w-6 text-amber-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-indigo-200/80">Pending Approvals</p>
                                        <p className="text-2xl font-bold text-white mt-1">{stats?.pending_users ?? pendingStudents.length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-emerald-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-indigo-200/80">Approved Students</p>
                                        <p className="text-2xl font-bold text-white mt-1">{approvedStudents.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold text-white mb-2">Quick actions</h3>
                            <p className="text-sm text-indigo-200/80">
                                Go to the <strong>Approve Students</strong> tab to review new registrations and approve students so they can log in.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'approve' && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10">
                            <h3 className="text-lg font-semibold text-white">Pending student registrations</h3>
                            <p className="text-sm text-indigo-200/80 mt-1">
                                {pendingStudents.length === 0
                                    ? 'No pending approvals.'
                                    : `${pendingStudents.length} student(s) awaiting approval.`}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            {pendingStudents.length === 0 ? (
                                <div className="p-12 text-center text-indigo-200/80">
                                    <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>All students have been approved.</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-indigo-200/80">
                                            <th className="px-6 py-4 font-semibold">Name</th>
                                            <th className="px-6 py-4 font-semibold">Email</th>
                                            <th className="px-6 py-4 font-semibold">Student ID</th>
                                            <th className="px-6 py-4 font-semibold">Department</th>
                                            <th className="px-6 py-4 font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {pendingStudents.map((user: any) => (
                                            <tr key={user.id} className="hover:bg-white/5">
                                                <td className="px-6 py-4 text-white font-medium">{user.name}</td>
                                                <td className="px-6 py-4 text-indigo-200">{user.email}</td>
                                                <td className="px-6 py-4 text-indigo-200">{user.student_id || '—'}</td>
                                                <td className="px-6 py-4 text-indigo-200">{user.department || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setViewingStudent(user)}
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 hover:bg-indigo-500/30 transition-all text-sm font-semibold"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveUser(user.id)}
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30 transition-all text-sm font-semibold"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                            Approve
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {viewingStudent && (
                <ViewUserDetailsModal
                    user={viewingStudent}
                    onClose={() => setViewingStudent(null)}
                    onApprove={async (id) => {
                        await handleApproveUser(id);
                        setViewingStudent(null);
                    }}
                />
            )}
        </main>
    );
};

export default StudentVerifierDashboard;
