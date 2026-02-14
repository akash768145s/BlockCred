'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, BookOpen, Pencil, XCircle } from 'lucide-react';
import { adminService } from '@/services/adminService';
import type { Department } from '@/types/rbac';

interface DepartmentsTabProps {}

export const DepartmentsTab: React.FC<DepartmentsTabProps> = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Department | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [academicDepartment, setAcademicDepartment] = useState(true);

    const resetCreateForm = () => {
        setName('');
        setDescription('');
        setAcademicDepartment(true);
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        resetCreateForm();
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const data = await adminService.listDepartments();
            setDepartments(data ?? []);
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to load departments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setCreating(true);
        try {
            await adminService.createDepartment({
                name: name.trim(),
                description: description.trim() || undefined,
                academic_department: academicDepartment,
            });
            closeCreateModal();
            await fetchAll();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to create department');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this department?')) return;
        try {
            await adminService.deleteDepartment(id);
            setDepartments(departments.filter(d => d.id !== id));
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to delete department');
        }
    };

    const openEdit = (dept: Department) => {
        setEditing(dept);
        setName(dept.name);
        setDescription(dept.description ?? '');
        setAcademicDepartment(dept.academic_department ?? false);
    };

    const closeEdit = () => {
        setEditing(null);
        setName('');
        setDescription('');
        setAcademicDepartment(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing || !name.trim()) return;
        try {
            await adminService.updateDepartment(editing.id, {
                name: name.trim(),
                description: description.trim() || undefined,
                academic_department: academicDepartment,
            });
            closeEdit();
            await fetchAll();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to update department');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Departments</h2>
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Create Department
                    </button>
                </div>
                {loading ? (
                    <div className="p-6 text-sm text-slate-300">Loading departments...</div>
                ) : departments.length === 0 ? (
                    <div className="p-6 text-sm text-slate-300">No departments configured yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                                    <th className="px-6 py-3 font-semibold">Name</th>
                                    <th className="px-6 py-3 font-semibold">Description</th>
                                    <th className="px-6 py-3 font-semibold">Academic</th>
                                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {departments.map(dept => (
                                    <tr key={dept.id} className="text-sm">
                                        <td className="px-6 py-3 text-white font-medium">{dept.name}</td>
                                        <td className="px-6 py-3 text-slate-400 max-w-xs truncate" title={dept.description ?? ''}>
                                            {dept.description || '—'}
                                        </td>
                                        <td className="px-6 py-3">
                                            {dept.academic_department ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                                    <BookOpen className="h-3 w-3" />
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 text-xs">No</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(dept)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-indigo-300 hover:bg-indigo-500/20"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(dept.id)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-red-300 hover:bg-red-500/10"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800/95 border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Create Department</h3>
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Name <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Department name"
                                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Short description (optional)"
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm resize-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="create_academic_dept"
                                    checked={academicDepartment}
                                    onChange={e => setAcademicDepartment(e.target.checked)}
                                    className="rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                                />
                                <label htmlFor="create_academic_dept" className="text-sm font-medium text-slate-300">
                                    Academic department
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="px-4 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/10 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editing && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800/95 border border-white/10 rounded-2xl max-w-lg w-full shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Edit Department</h3>
                            <button
                                type="button"
                                onClick={closeEdit}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Name <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Department name"
                                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Short description (optional)"
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm resize-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="edit_academic_dept"
                                    checked={academicDepartment}
                                    onChange={e => setAcademicDepartment(e.target.checked)}
                                    className="rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                                />
                                <label htmlFor="edit_academic_dept" className="text-sm font-medium text-slate-300">
                                    Academic department
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEdit}
                                    className="px-4 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/10 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white"
                                >
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

