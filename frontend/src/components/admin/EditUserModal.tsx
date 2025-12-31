'use client';

import React, { useState } from 'react';
import { XCircle } from 'lucide-react';
import { adminService } from '@/services/adminService';

interface EditUserModalProps {
    user: any;
    onClose: () => void;
    onUserUpdated: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onUserUpdated }) => {
    const isStudent = user.role === 'student';

    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        department: user.department || '',
        club_name: (!isStudent ? (user.club_name || '') : ''),
        tenth_school: user.tenth_school || '',
        twelfth_school: user.twelfth_school || '',
        tenth_marks: user.tenth_marks || '',
        twelfth_marks: user.twelfth_marks || '',
        cutoff: user.cutoff || '',
        dob: user.dob || '',
        father_name: user.father_name || '',
        aadhar_number: user.aadhar_number || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // For staff users, allow role, department, and club_name changes
        if (!isStudent) {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');

                // Ensure role is always included and not empty
                if (!formData.role || formData.role.trim() === '') {
                    alert('Role is required');
                    setLoading(false);
                    return;
                }

                const updateData: any = {
                    role: formData.role.trim()
                };

                // Add department for Department Faculty and Club Coordinator
                if (formData.role === 'department_faculty' || formData.role === 'club_coordinator') {
                    if (!formData.department) {
                        alert('Department is required for this role');
                        setLoading(false);
                        return;
                    }
                    updateData.department = formData.department;
                }

                // Add club_name for Club Coordinator
                if (formData.role === 'club_coordinator') {
                    if (!formData.club_name) {
                        alert('Club name is required for Club Coordinator');
                        setLoading(false);
                        return;
                    }
                    updateData.club_name = formData.club_name;
                }

                await adminService.updateUser(user.id, updateData);
                alert('User updated successfully!');
                onUserUpdated();
            } catch (error: any) {
                alert(error.message || 'Failed to update user. Please try again.');
            } finally {
                setLoading(false);
            }
            return;
        }

        // For students, validate all fields
        // Validate Aadhar number
        if (formData.aadhar_number && formData.aadhar_number.length !== 12) {
            alert('Aadhar number must be exactly 12 digits');
            return;
        }

        // Validate phone number
        if (formData.phone && formData.phone.length !== 10) {
            alert('Phone number must be exactly 10 digits');
            return;
        }

        setLoading(true);

        try {
            // Convert date format from DD-MM-YYYY to YYYY-MM-DD if needed
            let dobFormatted = formData.dob;
            if (dobFormatted && dobFormatted.includes('-') && dobFormatted.split('-').length === 3) {
                const parts = dobFormatted.split('-');
                // Check if it's DD-MM-YYYY format (first part is > 12)
                if (parts[0].length === 2 && parseInt(parts[0]) > 12) {
                    // Convert DD-MM-YYYY to YYYY-MM-DD
                    dobFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }

            // Convert marks and cutoff to numbers (with decimals for marks)
            const updateData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                department: formData.department || '', // Ensure department is included (even if empty)
                tenth_school: formData.tenth_school,
                twelfth_school: formData.twelfth_school,
                tenth_marks: formData.tenth_marks ? parseFloat(formData.tenth_marks.toString()) : 0,
                twelfth_marks: formData.twelfth_marks ? parseFloat(formData.twelfth_marks.toString()) : 0,
                cutoff: formData.cutoff ? parseFloat(formData.cutoff.toString()) : 0,
                dob: dobFormatted,
                father_name: formData.father_name,
                aadhar_number: formData.aadhar_number,
            };

            await adminService.updateUser(user.id, updateData);
            alert('User updated successfully!');
            onUserUpdated();
        } catch (error: any) {
            alert(error.message || 'Failed to update user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Edit User Details</h2>
                            <p className="text-sm text-slate-300 mt-1">Update all required fields</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isStudent ? (
                            // Staff/Other Roles - Role, Department (for Faculty/Club), Club Name (for Club)
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Issuing Authority Role <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.role}
                                        onChange={(e) => {
                                            const newRole = e.target.value;
                                            // Clear department and club_name when changing to COE
                                            if (newRole === 'coe') {
                                                setFormData({ ...formData, role: newRole, department: '', club_name: '' });
                                            } else if (newRole === 'department_faculty') {
                                                // Clear club_name when changing to Department Faculty
                                                setFormData({ ...formData, role: newRole, club_name: '' });
                                            } else {
                                                setFormData({ ...formData, role: newRole });
                                            }
                                        }}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                    >
                                        <option value="ssn_main_admin" className="bg-slate-800 text-white">SSN Main Admin</option>
                                        <optgroup label="Issuing Authorities" className="bg-slate-800">
                                            <option value="coe" className="bg-slate-800 text-white">COE - Controller of Examinations</option>
                                            <option value="department_faculty" className="bg-slate-800 text-white">Faculty - Department Faculty</option>
                                            <option value="club_coordinator" className="bg-slate-800 text-white">Club - Club Coordinator</option>
                                        </optgroup>
                                    </select>
                                </div>

                                {(formData.role === 'department_faculty' || formData.role === 'club_coordinator') && (
                                    <div>
                                        <label className="block text-sm font-semibold text-white mb-2">
                                            Department <span className="text-red-400">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                        >
                                            <option value="" className="bg-slate-800 text-slate-400">Select Department</option>
                                            <option value="Electrical and Electronics Engineering" className="bg-slate-800 text-white">Electrical and Electronics Engineering</option>
                                            <option value="Electronics and Communication Engineering" className="bg-slate-800 text-white">Electronics and Communication Engineering</option>
                                            <option value="Computer Science and Engineering" className="bg-slate-800 text-white">Computer Science and Engineering</option>
                                            <option value="Information Technology" className="bg-slate-800 text-white">Information Technology</option>
                                            <option value="Mechanical Engineering" className="bg-slate-800 text-white">Mechanical Engineering</option>
                                            <option value="Chemical Engineering" className="bg-slate-800 text-white">Chemical Engineering</option>
                                            <option value="Biomedical Engineering" className="bg-slate-800 text-white">Biomedical Engineering</option>
                                            <option value="Civil Engineering" className="bg-slate-800 text-white">Civil Engineering</option>
                                        </select>
                                    </div>
                                )}

                                {formData.role === 'club_coordinator' && (
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
                            </div>
                        ) : (
                            // Students - All fields
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Full Name <span className="text-red-400">*</span>
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
                                        placeholder="Enter email"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Phone <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        pattern="[0-9]{10}"
                                        maxLength={10}
                                        minLength={10}
                                        value={formData.phone}
                                        onChange={(e) => {
                                            // Only allow digits
                                            const value = e.target.value.replace(/\D/g, '');
                                            // Limit to 10 digits
                                            const limitedValue = value.slice(0, 10);
                                            setFormData({ ...formData, phone: limitedValue });
                                        }}
                                        onBlur={(e) => {
                                            // Validate on blur
                                            if (e.target.value.length !== 10) {
                                                e.target.setCustomValidity('Phone number must be exactly 10 digits');
                                            } else {
                                                e.target.setCustomValidity('');
                                            }
                                        }}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                        placeholder="Enter phone number (10 digits)"
                                    />
                                    {formData.phone && formData.phone.length !== 10 && (
                                        <p className="mt-1 text-sm text-red-400">Phone number must be exactly 10 digits</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Department <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                    >
                                        <option value="" className="bg-slate-800 text-slate-400">Select Department</option>
                                        <option value="Electrical and Electronics Engineering" className="bg-slate-800 text-white">Electrical and Electronics Engineering</option>
                                        <option value="Electronics and Communication Engineering" className="bg-slate-800 text-white">Electronics and Communication Engineering</option>
                                        <option value="Computer Science and Engineering" className="bg-slate-800 text-white">Computer Science and Engineering</option>
                                        <option value="Information Technology" className="bg-slate-800 text-white">Information Technology</option>
                                        <option value="Mechanical Engineering" className="bg-slate-800 text-white">Mechanical Engineering</option>
                                        <option value="Chemical Engineering" className="bg-slate-800 text-white">Chemical Engineering</option>
                                        <option value="Biomedical Engineering" className="bg-slate-800 text-white">Biomedical Engineering</option>
                                        <option value="Civil Engineering" className="bg-slate-800 text-white">Civil Engineering</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        10th School <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.tenth_school}
                                        onChange={(e) => setFormData({ ...formData, tenth_school: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                        placeholder="Enter 10th school"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        12th School <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.twelfth_school}
                                        onChange={(e) => setFormData({ ...formData, twelfth_school: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                        placeholder="Enter 12th school"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        10th Marks <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={formData.tenth_marks}
                                        onChange={(e) => setFormData({ ...formData, tenth_marks: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                        placeholder="Enter 10th marks (0-100)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        12th Marks <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={formData.twelfth_marks}
                                        onChange={(e) => setFormData({ ...formData, twelfth_marks: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                        placeholder="Enter 12th marks (0-100)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Cut-off Marks <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="200"
                                        value={formData.cutoff}
                                        onChange={(e) => setFormData({ ...formData, cutoff: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                        placeholder="Enter cut-off marks (0-200)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Date of Birth <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dob}
                                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                    />
                                    <p className="mt-1 text-xs text-slate-400">Format: YYYY-MM-DD (e.g., 2004-05-27)</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Father Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.father_name}
                                        onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                        placeholder="Enter father's name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        Aadhar Number <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        pattern="[0-9]{12}"
                                        maxLength={12}
                                        minLength={12}
                                        value={formData.aadhar_number}
                                        onChange={(e) => {
                                            // Only allow digits
                                            const value = e.target.value.replace(/\D/g, '');
                                            // Limit to 12 digits
                                            const limitedValue = value.slice(0, 12);
                                            setFormData({ ...formData, aadhar_number: limitedValue });
                                        }}
                                        onBlur={(e) => {
                                            // Validate on blur
                                            if (e.target.value.length !== 12) {
                                                e.target.setCustomValidity('Aadhar number must be exactly 12 digits');
                                            } else {
                                                e.target.setCustomValidity('');
                                            }
                                        }}
                                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                        placeholder="Enter Aadhar number (12 digits)"
                                    />
                                    {formData.aadhar_number && formData.aadhar_number.length !== 12 && (
                                        <p className="mt-1 text-sm text-red-400">Aadhar number must be exactly 12 digits</p>
                                    )}
                                </div>
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
                                {loading ? 'Updating...' : 'Update User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

