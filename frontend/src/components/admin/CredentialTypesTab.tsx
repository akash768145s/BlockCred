'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, XCircle, Pencil } from 'lucide-react';
import { adminService } from '@/services/adminService';
import type { Role, CredentialTypeConfig, CredentialFieldConfig, CredentialFieldType } from '@/types/rbac';

const emptyForm = {
    name: '',
    description: '',
    role_ids: [] as string[],
    fields: [] as CredentialFieldConfig[],
};

interface CredentialTypesTabProps { }

export const CredentialTypesTab: React.FC<CredentialTypesTabProps> = () => {
    const [credentialTypes, setCredentialTypes] = useState<CredentialTypeConfig[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCt, setEditingCt] = useState<CredentialTypeConfig | null>(null);
    const [form, setForm] = useState(emptyForm);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [ctData, roleData] = await Promise.all([
                adminService.listCredentialTypes(),
                adminService.listRoles(),
            ]);
            setCredentialTypes(ctData ?? []);
            setRoles(roleData ?? []);
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to load credential types');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const issuingRoles = roles.filter(r => r.can_issue_credentials);

    const toggleRole = (id: string) => {
        setForm(f => {
            const selected = new Set(f.role_ids);
            if (selected.has(id)) {
                selected.delete(id);
            } else {
                selected.add(id);
            }
            return { ...f, role_ids: Array.from(selected) };
        });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || form.role_ids.length === 0) {
            alert('Name and at least one issuer role are required');
            return;
        }
        setCreating(true);
        try {
            await adminService.createCredentialType({
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                role_ids: form.role_ids,
                fields: form.fields,
            });
            setForm(emptyForm);
            setShowCreateModal(false);
            await fetchAll();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to create credential type');
        } finally {
            setCreating(false);
        }
    };

    const openEdit = (ct: CredentialTypeConfig) => {
        setForm({
            name: ct.name,
            description: ct.description ?? '',
            role_ids: Array.isArray(ct.issuer_role_ids) ? ct.issuer_role_ids : [],
            fields: Array.isArray(ct.fields) ? ct.fields : [],
        });
        setEditingCt(ct);
    };

    const closeCtModal = () => {
        setShowCreateModal(false);
        setEditingCt(null);
        setForm(emptyForm);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCt) return;
        if (!form.name.trim() || form.role_ids.length === 0) {
            alert('Name and at least one issuer role are required');
            return;
        }
        setCreating(true);
        try {
            await adminService.updateCredentialType(editingCt.id, {
                name: form.name.trim(),
                description: form.description.trim() || undefined,
                role_ids: form.role_ids,
                fields: form.fields,
            });
            closeCtModal();
            await fetchAll();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to update credential type');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this credential type?')) return;
        try {
            await adminService.deleteCredentialType(id);
            setCredentialTypes(credentialTypes.filter(ct => ct.id !== id));
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Failed to delete credential type');
        }
    };

    const addField = () => {
        setForm(f => ({
            ...f,
            fields: [
                ...f.fields,
                {
                    key: '',
                    label: '',
                    type: 'text' as CredentialFieldType,
                    required: false,
                    options: [],
                },
            ],
        }));
    };

    const updateField = (index: number, patch: Partial<CredentialFieldConfig>) => {
        setForm(f => {
            const next = [...f.fields];
            next[index] = { ...next[index], ...patch };
            return { ...f, fields: next };
        });
    };

    const removeField = (index: number) => {
        setForm(f => {
            const next = [...f.fields];
            next.splice(index, 1);
            return { ...f, fields: next };
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Credential Types</h2>
                    <button
                        type="button"
                        onClick={() => { setEditingCt(null); setForm(emptyForm); setShowCreateModal(true); }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Create Credential Type
                    </button>
                </div>
                {loading ? (
                    <div className="p-6 text-sm text-slate-300">Loading credential types...</div>
                ) : credentialTypes.length === 0 ? (
                    <div className="p-6 text-sm text-slate-300">No credential types configured yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10 text-sm">
                            <thead className="bg-slate-900/60">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-slate-300">Name</th>
                                    <th className="px-6 py-3 text-left font-medium text-slate-300">Description</th>
                                    <th className="px-6 py-3 text-left font-medium text-slate-300">Issuer Roles</th>
                                    <th className="px-6 py-3 text-right font-medium text-slate-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 bg-slate-800/40">
                                {credentialTypes.map(ct => (
                                    <tr key={ct.id} className="hover:bg-white/5">
                                        <td className="px-6 py-3 text-white">{ct.name}</td>
                                        <td className="px-6 py-3 text-slate-300">{ct.description || '—'}</td>
                                        <td className="px-6 py-3 text-slate-300">
                                            {ct.issuer_role_ids
                                                ?.map(roleId => roles.find(r => r.id === roleId)?.name || roleId)
                                                .join(', ') || '—'}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(ct)}
                                                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-300 hover:bg-white/10 border border-white/20"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(ct.id)}
                                                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-red-300 hover:bg-red-500/20 border border-red-400/30"
                                                    title="Delete"
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
                )}
            </div>

            {(showCreateModal || editingCt) && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800/95 border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">{editingCt ? 'Edit Credential Type' : 'Create Credential Type'}</h3>
                            <button
                                type="button"
                                onClick={closeCtModal}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={editingCt ? handleUpdate : handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-200 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="marksheet, degree, bonafide..."
                                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-200 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-200 mb-2">
                                    Issuer roles (only roles with &quot;Can Issue Credentials&quot;)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {issuingRoles.map(role => {
                                        const selected = form.role_ids.includes(role.id);
                                        return (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => toggleRole(role.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${selected
                                                        ? 'bg-indigo-600 border-indigo-400 text-white'
                                                        : 'bg-white/5 border-white/20 text-slate-200 hover:bg-white/10'
                                                    }`}
                                            >
                                                {role.name}
                                            </button>
                                        );
                                    })}
                                    {issuingRoles.length === 0 && (
                                        <span className="text-xs text-slate-400">
                                            No roles with &quot;Can Issue Credentials&quot; found. Configure roles first.
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Dynamic form fields configuration */}
                            <div className="border-t border-white/10 pt-4 mt-2 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-white">Form fields (optional)</h4>
                                    <button
                                        type="button"
                                        onClick={addField}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white"
                                    >
                                        <Plus className="h-3 w-3" />
                                        Add field
                                    </button>
                                </div>
                                {form.fields.length === 0 ? (
                                    <p className="text-xs text-slate-400">
                                        Leave empty to keep existing hard-coded forms. Add fields to make this credential type dynamic.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {form.fields.map((field, idx) => (
                                            <div
                                                key={idx}
                                                className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start bg-white/5 rounded-lg p-3"
                                            >
                                                <div className="md:col-span-2">
                                                    <label className="block text-[11px] text-slate-300 mb-1">Key *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={field.key}
                                                        onChange={e => updateField(idx, { key: e.target.value })}
                                                        placeholder="e.g. semester"
                                                        className="w-full px-2 py-1.5 rounded bg-slate-900/60 border border-white/20 text-xs text-white"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-[11px] text-slate-300 mb-1">Label *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={field.label}
                                                        onChange={e => updateField(idx, { label: e.target.value })}
                                                        placeholder="Semester"
                                                        className="w-full px-2 py-1.5 rounded bg-slate-900/60 border border-white/20 text-xs text-white"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="block text-[11px] text-slate-300 mb-1">Type</label>
                                                    <select
                                                        value={field.type}
                                                        onChange={e => updateField(idx, { type: e.target.value as CredentialFieldType })}
                                                        className="w-full px-2 py-1.5 rounded bg-slate-900/60 border border-white/20 text-xs text-white"
                                                    >
                                                        <option value="text" className="bg-slate-900">Text</option>
                                                        <option value="number" className="bg-slate-900">Number</option>
                                                        <option value="date" className="bg-slate-900">Date</option>
                                                        <option value="select" className="bg-slate-900">Select</option>
                                                        <option value="bool" className="bg-slate-900">Yes/No</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-5 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                                                    <div>
                                                        <label className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                                                            <input
                                                                type="checkbox"
                                                                checked={field.required}
                                                                onChange={e => updateField(idx, { required: e.target.checked })}
                                                                className="h-3 w-3 rounded border-white/30 bg-slate-900"
                                                            />
                                                            Required
                                                        </label>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-[11px] text-slate-300 mb-1">
                                                            Options (for select, comma-separated)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={field.options?.join(', ') || ''}
                                                            onChange={e =>
                                                                updateField(idx, {
                                                                    options: e.target.value
                                                                        .split(',')
                                                                        .map(s => s.trim())
                                                                        .filter(Boolean),
                                                                })
                                                            }
                                                            placeholder="e.g. Odd, Even"
                                                            className="w-full px-2 py-1.5 rounded bg-slate-900/60 border border-white/20 text-xs text-white"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeField(idx)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-red-300 border border-red-400/40 hover:bg-red-500/20"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeCtModal}
                                    className="px-4 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/10 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {creating ? (editingCt ? 'Updating...' : 'Creating...') : (editingCt ? 'Update Credential Type' : 'Create Credential Type')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

