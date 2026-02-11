'use client';

import React, { useState } from 'react';
import { XCircle } from 'lucide-react';

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
        role: 'coe',
        department: '',
        institution: 'SSN College of Engineering',
        club_name: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate department for Department Faculty and Club Coordinator
        if ((formData.role === 'department_faculty' || formData.role === 'club_coordinator') && !formData.department) {
            alert('Department is required for this role');
            return;
        }

        // Validate club_name for Club Coordinator
        if (formData.role === 'club_coordinator' && !formData.club_name) {
            alert('Club name is required for Club Coordinator');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            console.log('Creating user with data:', formData);
            console.log('Using token:', token);

            const response = await fetch('http://localhost:8080/api/admin/onboard', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            console.log('User creation response:', data);

            if (response.ok) {
                alert('User created successfully!');
                onUserCreated();
            } else {
                alert(`Error: ${data.message || 'Failed to create user'}`);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user. Please check if the backend server is running.');
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
                                    Issuing Authority Role <span className="text-red-400">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-white/20 transition-all"
                                >
                                    <optgroup label="Issuing Authorities" className="bg-slate-800">
                                        <option value="coe" className="text-white bg-slate-800">COE - Controller of Examinations</option>
                                        <option value="department_faculty" className="text-white bg-slate-800">Faculty - Department Faculty</option>
                                        <option value="club_coordinator" className="text-white bg-slate-800">Club - Club Coordinator</option>
                                    </optgroup>
                                    <optgroup label="Verifiers" className="bg-slate-800">
                                        <option value="student_verifier" className="text-white bg-slate-800">Student Verifier (approve registrations)</option>
                                        <option value="external_verifier" className="text-white bg-slate-800">External Verifier (verify credentials)</option>
                                    </optgroup>
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

                        {formData.role === 'department_faculty' && (
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
                                    <option value="" className="text-slate-400 bg-slate-800">Select Department</option>
                                    <option value="Electrical and Electronics Engineering" className="text-white bg-slate-800">Electrical and Electronics Engineering</option>
                                    <option value="Electronics and Communication Engineering" className="text-white bg-slate-800">Electronics and Communication Engineering</option>
                                    <option value="Computer Science and Engineering" className="text-white bg-slate-800">Computer Science and Engineering</option>
                                    <option value="Information Technology" className="text-white bg-slate-800">Information Technology</option>
                                    <option value="Mechanical Engineering" className="text-white bg-slate-800">Mechanical Engineering</option>
                                    <option value="Chemical Engineering" className="text-white bg-slate-800">Chemical Engineering</option>
                                    <option value="Biomedical Engineering" className="text-white bg-slate-800">Biomedical Engineering</option>
                                    <option value="Civil Engineering" className="text-white bg-slate-800">Civil Engineering</option>
                                </select>
                            </div>
                        )}

                        {formData.role === 'club_coordinator' && (
                            <>
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
                                        <option value="" className="text-slate-400 bg-slate-800">Select Department</option>
                                        <option value="Electrical and Electronics Engineering" className="text-white bg-slate-800">Electrical and Electronics Engineering</option>
                                        <option value="Electronics and Communication Engineering" className="text-white bg-slate-800">Electronics and Communication Engineering</option>
                                        <option value="Computer Science and Engineering" className="text-white bg-slate-800">Computer Science and Engineering</option>
                                        <option value="Information Technology" className="text-white bg-slate-800">Information Technology</option>
                                        <option value="Mechanical Engineering" className="text-white bg-slate-800">Mechanical Engineering</option>
                                        <option value="Chemical Engineering" className="text-white bg-slate-800">Chemical Engineering</option>
                                        <option value="Biomedical Engineering" className="text-white bg-slate-800">Biomedical Engineering</option>
                                        <option value="Civil Engineering" className="text-white bg-slate-800">Civil Engineering</option>
                                    </select>
                                </div>
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
                            </>
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

