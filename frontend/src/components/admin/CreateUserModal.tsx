'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { XCircle } from 'lucide-react';
import { adminService } from '@/services/adminService';

interface CreateUserModalProps {
    onClose: () => void;
    onUserCreated: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onUserCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role_id: '',
        role: '',
        department: '',
        institution: 'SSN College of Engineering',
        club_name: ''
    });
    const [loading, setLoading] = useState(false);
    const [metaLoading, setMetaLoading] = useState(true);
    const [roles, setRoles] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            setMetaLoading(true);
            try {
                const [r, d] = await Promise.all([adminService.listRoles(), adminService.listDepartments()]);
                setRoles(Array.isArray(r) ? r : []);
                setDepartments(Array.isArray(d) ? d : []);
            } catch (err) {
                console.error(err);
                setRoles([]);
                setDepartments([]);
            } finally {
                setMetaLoading(false);
            }
        };
        load();
    }, []);

    const selectedRole = useMemo(() => roles.find((r) => r.id === formData.role_id), [roles, formData.role_id]);
    const isStudentRole = (selectedRole?.name ?? '').toString().toLowerCase() === 'student';
    const departmentsForSelect = useMemo(() =>
        isStudentRole ? departments.filter((d: any) => d.academic_department) : departments,
    [departments, isStudentRole]);
    const allowedDepartmentIDs: string[] = Array.isArray(selectedRole?.department_ids) ? selectedRole.department_ids : [];
    const allowedDepartments = useMemo(() => {
        if (!allowedDepartmentIDs.length) return departmentsForSelect;
        return departmentsForSelect.filter((d) => allowedDepartmentIDs.includes(d.id));
    }, [departmentsForSelect, allowedDepartmentIDs]);
    const showDepartment = departmentsForSelect.length > 0;
    const departmentRequired = allowedDepartmentIDs.length > 0;
    const showClubName = (selectedRole?.name || '').toString().toLowerCase().includes('club');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.role_id) {
            alert('Role is required');
            return;
        }

        if (departmentRequired && !formData.department) {
            alert('Department is required for this role');
            return;
        }

        if (showClubName && !formData.club_name) {
            alert('Club name is required for this role');
            return;
        }

        setLoading(true);

        try {
            await adminService.createUser({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                role_id: formData.role_id,
                role: formData.role || undefined, // optional legacy fallback
                department: formData.department || undefined,
                institution: formData.institution || undefined,
                club_name: formData.club_name || undefined,
            });
            alert('User created successfully!');
            onUserCreated();
        } catch (error) {
            console.error('Error creating user:', error);
            alert(error instanceof Error ? error.message : 'Failed to create user. Please check if the backend server is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-white">Create New User</h3>
                            <p className="text-sm text-slate-300 mt-1">Fill in the details to create a new issuing authority</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Email <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                    placeholder="Enter email address"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Phone <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Role <span className="text-red-400">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.role_id}
                                    disabled={metaLoading}
                                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                >
                                    <option value="" className="text-slate-400 bg-slate-800">
                                        {metaLoading ? 'Loading roles...' : 'Select role'}
                                    </option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id} className="text-white bg-slate-800">
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                                Password <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                placeholder="Enter password"
                            />
                        </div>

                        {showDepartment && (
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Department {departmentRequired && <span className="text-red-400">*</span>}
                                </label>
                                <select
                                    required={departmentRequired}
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                >
                                    <option value="" className="text-slate-400 bg-slate-800">Select Department</option>
                                    {allowedDepartments.map((d) => (
                                        <option key={d.id} value={d.name} className="text-white bg-slate-800">
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {showClubName && (
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Club Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.club_name}
                                    onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                    placeholder="Enter club name"
                                />
                            </div>
                        )}

                        <div className="flex justify-end space-x-4 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border-2 border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-md"
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

