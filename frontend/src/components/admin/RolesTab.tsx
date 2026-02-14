'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, XCircle, Pencil } from 'lucide-react';
import { adminService } from '@/services/adminService';
import type { Role, Department } from '@/types/rbac';

const emptyForm = {
    name: '',
    description: '',
    department_id: '',
    can_issue_credentials: false,
    permissions: [] as string[],
    dashboard_route: '',
};

interface RolesTabProps {}

export const RolesTab: React.FC<RolesTabProps> = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [form, setForm] = useState(emptyForm);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [rolesData, deptData] = await Promise.all([
                adminService.listRoles(),
                adminService.listDepartments(),
            ]);
            setRoles(rolesData ?? []);
            setDepartments(deptData ?? []);
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await adminService.createRole({
                name: form.name,
                description: form.description,
                department_id: form.department_id || undefined,
                can_issue_credentials: form.can_issue_credentials,
                permissions: form.permissions,
                dashboard_route: form.dashboard_route || undefined,
            });
            setForm(emptyForm);
            setShowCreateModal(false);
            await fetchAll();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to create role');
        } finally {
            setCreating(false);
        }
    };

    const openEdit = (role: Role) => {
        setForm({
            name: role.name,
            description: role.description ?? '',
            department_id: role.department_id ?? '',
            can_issue_credentials: role.can_issue_credentials,
            permissions: role.permissions ?? [],
            dashboard_route: role.dashboard_route ?? '',
        });
        setEditingRole(role);
    };

    const closeRoleModal = () => {
        setShowCreateModal(false);
        setEditingRole(null);
        setForm(emptyForm);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole) return;
        setCreating(true);
        try {
            await adminService.updateRole(editingRole.id, {
                name: form.name,
                description: form.description || undefined,
                department_id: form.department_id || undefined,
                can_issue_credentials: form.can_issue_credentials,
                permissions: form.permissions,
                dashboard_route: form.dashboard_route || undefined,
            });
            closeRoleModal();
            await fetchAll();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to update role');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this role?')) return;
        try {
            await adminService.deleteRole(id);
            setRoles(roles.filter(r => r.id !== id));
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to delete role');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Roles</h2>
                    <button
                        type="button"
                        onClick={() => { setEditingRole(null); setForm(emptyForm); setShowCreateModal(true); }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Create Role
                    </button>
                </div>
                {loading ? (
                    <div className="p-6 text-sm text-slate-300">Loading roles...</div>
                ) : roles.length === 0 ? (
                    <div className="p-6 text-sm text-slate-300">No roles configured yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10 text-sm">
                            <thead className="bg-slate-900/60">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-slate-300">Name</th>
                                    <th className="px-6 py-3 text-left font-medium text-slate-300">Department</th>
                                    <th className="px-6 py-3 text-left font-medium text-slate-300">Can Issue</th>
                                    <th className="px-6 py-3 text-left font-medium text-slate-300">Permissions</th>
                                    <th className="px-6 py-3 text-right font-medium text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 bg-slate-800/40">
                                {roles.map(role => {
                                    const dept = departments.find(d => d.id === role.department_id);
                                    return (
                                        <tr key={role.id} className="hover:bg-white/5">
                                            <td className="px-6 py-3 text-white">{role.name}</td>
                                            <td className="px-6 py-3 text-slate-300">{dept?.name ?? '—'}</td>
                                            <td className="px-6 py-3 text-slate-300">
                                                {role.can_issue_credentials ? 'Yes' : 'No'}
                                            </td>
                                            <td className="px-6 py-3 text-slate-300">
                                                {role.permissions && role.permissions.length > 0
                                                    ? role.permissions.join(', ')
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(role)}
                                                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-300 hover:bg-white/10 border border-white/20"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(role.id)}
                                                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-red-300 hover:bg-red-500/20 border border-red-400/30"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {(showCreateModal || editingRole) && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800/95 border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">{editingRole ? 'Edit Role' : 'Create Role'}</h3>
                            <button
                                type="button"
                                onClick={closeRoleModal}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={editingRole ? handleUpdate : handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-200 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-200 mb-1">Department</label>
                                    <select
                                        value={form.department_id}
                                        onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                                    >
                                        <option value="">None</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id} className="bg-slate-900 text-white">
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-200 mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="inline-flex items-center space-x-2 text-sm text-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={form.can_issue_credentials}
                                        onChange={e => setForm(f => ({ ...f, can_issue_credentials: e.target.checked }))}
                                        className="rounded border-white/30 bg-slate-900"
                                    />
                                    <span>Can issue credentials</span>
                                </label>
                                <div>
                                    <label className="block text-sm text-slate-200 mb-1">Dashboard route</label>
                                    <input
                                        type="text"
                                        value={form.dashboard_route}
                                        onChange={e => setForm(f => ({ ...f, dashboard_route: e.target.value }))}
                                        placeholder="/admin, /coe, /faculty, /verifier ..."
                                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeRoleModal}
                                    className="px-4 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/10 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {creating ? (editingRole ? 'Updating...' : 'Creating...') : (editingRole ? 'Update Role' : 'Create Role')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

