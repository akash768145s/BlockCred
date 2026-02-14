'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, Users, Clock, CheckCircle, UserPlus, Eye, GraduationCap, Search, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, useDashboardStats } from '@/hooks/useApi';
import { adminService } from '@/services/adminService';
import { DashboardHeader } from '@/components/DashboardHeader';
import { getRoleTheme } from '@/lib/roleTheme';
import { ViewUserDetailsModal, EditUserModal, DeleteConfirmationModal } from '@/components/admin';

const StudentVerifierDashboard: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'approve' | 'all'>('overview');
    const [viewingStudent, setViewingStudent] = useState<any>(null);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [deletingUser, setDeletingUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterApproval, setFilterApproval] = useState<'all' | 'approved' | 'pending'>('all');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterHasStudentId, setFilterHasStudentId] = useState<'all' | 'yes' | 'no'>('all');
    const [filterSemester, setFilterSemester] = useState('all');
    const [filterGraduationYear, setFilterGraduationYear] = useState('all');
    const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'created_desc' | 'created_asc'>('name_asc');
    const { user, logout, isAuthenticated } = useAuth();
    const { users, loading: usersLoading, error: usersError, approveUser, fetchUsers } = useUsers();
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

    const [departmentOptions, setDepartmentOptions] = useState<{ value: string; label: string }[]>([{ value: 'all', label: 'All departments' }]);
    useEffect(() => {
        let cancelled = false;
        // Use public academic departments so student-verifier doesn't need manage_departments permission.
        adminService.listPublicDepartments()
            .then((list: any[]) => {
                if (cancelled || !Array.isArray(list)) return;
                const academic = list.filter((d: any) => d.academic_department);
                setDepartmentOptions([
                    { value: 'all', label: 'All departments' },
                    ...academic.map((d: any) => ({ value: d.name, label: d.name })),
                ]);
            })
            .catch(() => { });
        return () => { cancelled = true; };
    }, []);

    const uniqueSemesters = Array.from(
        new Set(students.map((s: any) => (s.semester ?? '').toString().trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const uniqueGraduationYears = Array.from(
        new Set(students.map((s: any) => (s.graduation_year ?? '').toString().trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const filteredAllStudents = students
        .filter((u: any) => {
            const q = searchTerm.trim().toLowerCase();
            const matchesSearch =
                !q ||
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.student_id || '').toLowerCase().includes(q) ||
                (u.phone || '').toLowerCase().includes(q);

            const matchesDepartment =
                filterDepartment === 'all' ||
                ((u.department || '').toLowerCase() === filterDepartment.toLowerCase());

            const matchesApproval =
                filterApproval === 'all' ||
                (filterApproval === 'approved' ? !!u.is_approved : !u.is_approved);

            const isActive = u.is_active !== undefined ? !!u.is_active : true;
            const matchesActive =
                filterActive === 'all' ||
                (filterActive === 'active' ? isActive : !isActive);

            const hasStudentId = !!(u.student_id && String(u.student_id).trim());
            const matchesHasStudentId =
                filterHasStudentId === 'all' ||
                (filterHasStudentId === 'yes' ? hasStudentId : !hasStudentId);

            const matchesSemester =
                filterSemester === 'all' ||
                ((u.semester ?? '').toString().trim() === filterSemester);

            const matchesGraduationYear =
                filterGraduationYear === 'all' ||
                ((u.graduation_year ?? '').toString().trim() === filterGraduationYear);

            return (
                matchesSearch &&
                matchesDepartment &&
                matchesApproval &&
                matchesActive &&
                matchesHasStudentId &&
                matchesSemester &&
                matchesGraduationYear
            );
        })
        .sort((a: any, b: any) => {
            if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
            const aCreated = new Date(a.created_at || a.createdAt || 0).getTime();
            const bCreated = new Date(b.created_at || b.createdAt || 0).getTime();
            return sortBy === 'created_desc' ? bCreated - aCreated : aCreated - bCreated;
        });

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

    const handleUserUpdated = () => {
        setEditingUser(null);
        fetchUsers();
    };

    const loading = usersLoading || statsLoading;

    if (loading) {
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
            <DashboardHeader user={user ?? null} onLogout={handleLogout} maxWidth="max-w-6xl" />

            <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'overview' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('approve')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'approve' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Approve Students
                            {pendingStudents.length > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-full ${getRoleTheme(user?.role).badgeBg} ${getRoleTheme(user?.role).badgeText} text-xs`}>
                                    {pendingStudents.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'all' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            <GraduationCap className="h-4 w-4 inline-block mr-2" />
                            All Students
                            <span className="ml-2 text-indigo-300/80">({students.length})</span>
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
                                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                                        <button
                                                            onClick={() => setViewingStudent(user)}
                                                            title="View"
                                                            aria-label="View"
                                                            className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 hover:bg-indigo-500/30 transition-all"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingUser(user)}
                                                            title="Edit"
                                                            aria-label="Edit"
                                                            className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-slate-500/20 text-slate-200 border border-slate-400/30 hover:bg-slate-500/30 transition-all"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveUser(user.id)}
                                                            title="Approve"
                                                            aria-label="Approve"
                                                            className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30 transition-all"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingUser(user)}
                                                            title="Delete"
                                                            aria-label="Delete"
                                                            className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-red-500/20 text-red-300 border border-red-400/30 hover:bg-red-500/30 transition-all"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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

                {activeTab === 'all' && (
                    <div className="space-y-4">
                        {usersError && (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
                                {usersError}
                                <button type="button" onClick={() => fetchUsers()} className="ml-3 underline">Retry</button>
                            </div>
                        )}
                        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                            <div className="flex flex-col gap-4">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search name, email, student id, phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                                        <select
                                            value={filterDepartment}
                                            onChange={(e) => setFilterDepartment(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                        >
                                            {departmentOptions.map((d) => (
                                                <option key={d.value} value={d.value} className="bg-slate-900">
                                                    {d.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">Approval</label>
                                        <select
                                            value={filterApproval}
                                            onChange={(e) => setFilterApproval(e.target.value as any)}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                        >
                                            <option value="all" className="bg-slate-900">All</option>
                                            <option value="pending" className="bg-slate-900">Pending</option>
                                            <option value="approved" className="bg-slate-900">Approved</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">Active</label>
                                        <select
                                            value={filterActive}
                                            onChange={(e) => setFilterActive(e.target.value as any)}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                        >
                                            <option value="all" className="bg-slate-900">All</option>
                                            <option value="active" className="bg-slate-900">Active</option>
                                            <option value="inactive" className="bg-slate-900">Inactive</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">Has student id</label>
                                        <select
                                            value={filterHasStudentId}
                                            onChange={(e) => setFilterHasStudentId(e.target.value as any)}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                        >
                                            <option value="all" className="bg-slate-900">All</option>
                                            <option value="yes" className="bg-slate-900">Yes</option>
                                            <option value="no" className="bg-slate-900">No</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">Semester</label>
                                        <select
                                            value={filterSemester}
                                            onChange={(e) => setFilterSemester(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                        >
                                            <option value="all" className="bg-slate-900">All</option>
                                            {uniqueSemesters.map((s) => (
                                                <option key={s} value={s} className="bg-slate-900">{s}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-300 mb-1">Graduation year</label>
                                        <select
                                            value={filterGraduationYear}
                                            onChange={(e) => setFilterGraduationYear(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                        >
                                            <option value="all" className="bg-slate-900">All</option>
                                            {uniqueGraduationYears.map((y) => (
                                                <option key={y} value={y} className="bg-slate-900">{y}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2 lg:col-span-2">
                                        <label className="block text-xs font-medium text-slate-300 mb-1">Sort</label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                                        >
                                            <option value="name_asc" className="bg-slate-900">Name (A → Z)</option>
                                            <option value="name_desc" className="bg-slate-900">Name (Z → A)</option>
                                            <option value="created_desc" className="bg-slate-900">Created (newest)</option>
                                            <option value="created_asc" className="bg-slate-900">Created (oldest)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-indigo-200/80">
                                    <span>Showing <span className="text-white font-semibold">{filteredAllStudents.length}</span> of <span className="text-white font-semibold">{students.length}</span></span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterDepartment('all');
                                            setFilterApproval('all');
                                            setFilterActive('all');
                                            setFilterHasStudentId('all');
                                            setFilterSemester('all');
                                            setFilterGraduationYear('all');
                                            setSortBy('name_asc');
                                        }}
                                        className="underline hover:text-white"
                                    >
                                        Reset filters
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/10">
                                <h3 className="text-lg font-semibold text-white">All students</h3>
                                <p className="text-sm text-indigo-200/80 mt-1">
                                    {students.length === 0
                                        ? 'No students in the system.'
                                        : `${students.filter((u: any) => {
                                            const q = searchTerm.toLowerCase();
                                            return (!q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
                                        }).length} student(s).`}
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                {students.length === 0 ? (
                                    <div className="p-12 text-center text-indigo-200/80">
                                        <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No students found.</p>
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-indigo-200/80">
                                                <th className="px-6 py-4 font-semibold">Name</th>
                                                <th className="px-6 py-4 font-semibold">Email</th>
                                                <th className="px-6 py-4 font-semibold">Student ID</th>
                                                <th className="px-6 py-4 font-semibold">Department</th>
                                                <th className="px-6 py-4 font-semibold">Status</th>
                                                <th className="px-6 py-4 font-semibold">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {filteredAllStudents.map((user: any) => (
                                                <tr key={user.id} className="hover:bg-white/5">
                                                    <td className="px-6 py-4 text-white font-medium">{user.name}</td>
                                                    <td className="px-6 py-4 text-indigo-200">{user.email}</td>
                                                    <td className="px-6 py-4 text-indigo-200">{user.student_id || '—'}</td>
                                                    <td className="px-6 py-4 text-indigo-200">{user.department || '—'}</td>
                                                    <td className="px-6 py-4">
                                                        {user.is_approved ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                                                <CheckCircle className="h-3 w-3" /> Approved
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                                                <Clock className="h-3 w-3" /> Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 whitespace-nowrap">
                                                            <button
                                                                onClick={() => setViewingStudent(user)}
                                                                title="View"
                                                                aria-label="View"
                                                                className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 hover:bg-indigo-500/30 transition-all"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingUser(user)}
                                                                title="Edit"
                                                                aria-label="Edit"
                                                                className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-slate-500/20 text-slate-200 border border-slate-400/30 hover:bg-slate-500/30 transition-all"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            {!user.is_approved && (
                                                                <button
                                                                    onClick={() => handleApproveUser(user.id)}
                                                                    title="Approve"
                                                                    aria-label="Approve"
                                                                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30 transition-all"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setDeletingUser(user)}
                                                                title="Delete"
                                                                aria-label="Delete"
                                                                className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-red-500/20 text-red-300 border border-red-400/30 hover:bg-red-500/30 transition-all"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
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

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onUserUpdated={handleUserUpdated}
                />
            )}

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

export default StudentVerifierDashboard;
