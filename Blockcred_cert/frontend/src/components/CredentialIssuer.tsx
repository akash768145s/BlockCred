'use client';

import React, { useState } from 'react';
import { User, CredentialRequest } from '@/types/auth';
import { FileText, Award, FileCheck, FileX } from 'lucide-react';

interface CredentialIssuerProps {
    user: User;
    credentialType: 'marksheet' | 'bonafide' | 'noc' | 'participation';
    onIssue: (credential: CredentialRequest) => void;
}

const CredentialIssuer: React.FC<CredentialIssuerProps> = ({ user, credentialType, onIssue }) => {
    const [formData, setFormData] = useState<Partial<CredentialRequest>>({
        type: credentialType,
        institution: 'SSN College of Engineering',
        issued_by: user.name,
        valid_from: new Date().toISOString().split('T')[0],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getFormFields = () => {
        switch (credentialType) {
            case 'marksheet':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Student ID *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.student_id || ''}
                                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Student ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Semester *
                                </label>
                                <select
                                    required
                                    value={formData.semester || ''}
                                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Semester</option>
                                    <option value="1">Semester 1</option>
                                    <option value="2">Semester 2</option>
                                    <option value="3">Semester 3</option>
                                    <option value="4">Semester 4</option>
                                    <option value="5">Semester 5</option>
                                    <option value="6">Semester 6</option>
                                    <option value="7">Semester 7</option>
                                    <option value="8">Semester 8</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.subject || ''}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Subject Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Marks *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.marks || ''}
                                    onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Marks"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Grade
                            </label>
                            <input
                                type="text"
                                value={formData.grade || ''}
                                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Grade (e.g., A+, A, B+, B)"
                            />
                        </div>
                    </>
                );

            case 'bonafide':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Student ID *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.student_id || ''}
                                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Student ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department *
                                </label>
                                <select
                                    required
                                    value={formData.department || ''}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Department</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Information Technology">Information Technology</option>
                                    <option value="Electronics and Communication">Electronics and Communication</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                    <option value="Civil Engineering">Civil Engineering</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valid From *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.valid_from || ''}
                                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valid Until
                                </label>
                                <input
                                    type="date"
                                    value={formData.valid_until || ''}
                                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </>
                );

            case 'noc':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Student ID *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.student_id || ''}
                                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Student ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department *
                                </label>
                                <select
                                    required
                                    value={formData.department || ''}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Department</option>
                                    <option value="Computer Science">Computer Science</option>
                                    <option value="Information Technology">Information Technology</option>
                                    <option value="Electronics and Communication">Electronics and Communication</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                    <option value="Civil Engineering">Civil Engineering</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valid From *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.valid_from || ''}
                                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valid Until
                                </label>
                                <input
                                    type="date"
                                    value={formData.valid_until || ''}
                                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </>
                );

            case 'participation':
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Student ID *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.student_id || ''}
                                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Student ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Event Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.event_name || ''}
                                    onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Event Name"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Event Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.event_date || ''}
                                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Position/Role
                                </label>
                                <input
                                    type="text"
                                    value={formData.position || ''}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Participant, Winner, Organizer"
                                />
                            </div>
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    const getFormTitle = () => {
        switch (credentialType) {
            case 'marksheet':
                return 'Issue Semester Marksheet';
            case 'bonafide':
                return 'Issue Bonafide Certificate';
            case 'noc':
                return 'Issue No Objection Certificate (NOC)';
            case 'participation':
                return 'Issue Participation Certificate';
            default:
                return 'Issue Credential';
        }
    };

    const getFormIcon = () => {
        switch (credentialType) {
            case 'marksheet':
                return <FileText className="h-6 w-6" />;
            case 'bonafide':
                return <FileCheck className="h-6 w-6" />;
            case 'noc':
                return <FileX className="h-6 w-6" />;
            case 'participation':
                return <Award className="h-6 w-6" />;
            default:
                return <FileText className="h-6 w-6" />;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Validate required fields
            if (!formData.student_id || !formData.title || !formData.institution) {
                alert('Please fill in all required fields');
                return;
            }

            // Set title based on credential type
            const title = formData.title ||
                (credentialType === 'marksheet' ? `Semester ${formData.semester} Marksheet` :
                    credentialType === 'bonafide' ? 'Bonafide Certificate' :
                        credentialType === 'noc' ? 'No Objection Certificate' :
                            credentialType === 'participation' ? 'Participation Certificate' :
                                'Credential');

            const credentialData: CredentialRequest = {
                ...formData,
                title,
                type: credentialType,
                institution: formData.institution || 'SSN College of Engineering',
                issued_by: user.name,
                valid_from: formData.valid_from || new Date().toISOString().split('T')[0],
            } as CredentialRequest;

            await onIssue(credentialData);

            // Reset form
            setFormData({
                type: credentialType,
                institution: 'SSN College of Engineering',
                issued_by: user.name,
                valid_from: new Date().toISOString().split('T')[0],
            });

        } catch (error) {
            console.error('Error issuing credential:', error);
            alert('Failed to issue credential. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
                {getFormIcon()}
                <h2 className="text-2xl font-bold text-gray-900 ml-3">{getFormTitle()}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {getFormFields()}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter additional details or description"
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({
                                type: credentialType,
                                institution: 'SSN College of Engineering',
                                issued_by: user.name,
                                valid_from: new Date().toISOString().split('T')[0],
                            });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Issuing...' : 'Issue Credential'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CredentialIssuer;
