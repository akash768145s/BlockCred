'use client';

import React from 'react';
import { XCircle, CheckCircle, Clock } from 'lucide-react';
import { getRoleDisplayName, formatDate } from '@/lib/utils';

interface ViewUserDetailsModalProps {
    user: any;
    onClose: () => void;
    onApprove?: (userId: string | number) => void;
}

export const ViewUserDetailsModal: React.FC<ViewUserDetailsModalProps> = ({ user, onClose, onApprove }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-white">User Details</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
                            <h4 className="text-lg font-semibold text-white mb-4">Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-400">Name</p>
                                    <p className="text-base text-white font-medium">{user.name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-400">Email</p>
                                    <p className="text-base text-white font-medium">{user.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-400">Phone</p>
                                    <p className="text-base text-white font-medium">{user.phone || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-400">Role</p>
                                    <p className="text-base text-white font-medium">{getRoleDisplayName(user.role)}</p>
                                </div>
                                {user.student_id && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-400">Student ID</p>
                                        <p className="text-base text-white font-medium">{user.student_id}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-slate-400">Status</p>
                                    <div className="flex items-center space-x-2">
                                        {user.is_active ? (
                                            <CheckCircle className="h-4 w-4 text-green-400" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-400" />
                                        )}
                                        <span className={`text-base font-medium ${user.is_active ? 'text-green-300' : 'text-red-300'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-400">Approval Status</p>
                                    <div className="flex items-center space-x-2">
                                        {user.is_approved ? (
                                            <CheckCircle className="h-4 w-4 text-green-400" />
                                        ) : (
                                            <Clock className="h-4 w-4 text-yellow-400" />
                                        )}
                                        <span className={`text-base font-medium ${user.is_approved ? 'text-green-300' : 'text-yellow-300'}`}>
                                            {user.is_approved ? 'Approved' : 'Pending Approval'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-400">Created At</p>
                                    <p className="text-base text-white font-medium">{formatDate(user.created_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Department/Institution Information */}
                        {(user.department || user.institution || user.club_name) && (
                            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
                                <h4 className="text-lg font-semibold text-white mb-4">Organization Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.department && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">Department</p>
                                            <p className="text-base text-white font-medium">{user.department}</p>
                                        </div>
                                    )}
                                    {user.institution && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">Institution</p>
                                            <p className="text-base text-white font-medium">{user.institution}</p>
                                        </div>
                                    )}
                                    {user.club_name && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">Club Name</p>
                                            <p className="text-base text-white font-medium">{user.club_name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Academic Information (for students) */}
                        {(user.tenth_school || user.twelfth_school || user.tenth_marks || user.twelfth_marks) && (
                            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
                                <h4 className="text-lg font-semibold text-white mb-4">Academic Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.tenth_school && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">10th School</p>
                                            <p className="text-base text-white font-medium">{user.tenth_school}</p>
                                        </div>
                                    )}
                                    {user.tenth_marks && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">10th Marks</p>
                                            <p className="text-base text-white font-medium">{user.tenth_marks}</p>
                                        </div>
                                    )}
                                    {user.twelfth_school && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">12th School</p>
                                            <p className="text-base text-white font-medium">{user.twelfth_school}</p>
                                        </div>
                                    )}
                                    {user.twelfth_marks && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">12th Marks</p>
                                            <p className="text-base text-white font-medium">{user.twelfth_marks}</p>
                                        </div>
                                    )}
                                    {user.cutoff && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">Cut-off Marks</p>
                                            <p className="text-base text-white font-medium">{user.cutoff}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Personal Information (for students) */}
                        {(user.dob || user.father_name || user.aadhar_number) && (
                            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
                                <h4 className="text-lg font-semibold text-white mb-4">Personal Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.dob && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">Date of Birth</p>
                                            <p className="text-base text-white font-medium">{user.dob}</p>
                                        </div>
                                    )}
                                    {user.father_name && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">Father's Name</p>
                                            <p className="text-base text-white font-medium">{user.father_name}</p>
                                        </div>
                                    )}
                                    {user.aadhar_number && (
                                        <div>
                                            <p className="text-sm font-medium text-slate-400">Aadhar Number</p>
                                            <p className="text-base text-white font-medium">{user.aadhar_number}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                        {onApprove && !user.is_approved && (
                            <button
                                onClick={() => {
                                    onApprove(user.id);
                                    onClose();
                                }}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-md"
                            >
                                <CheckCircle className="h-5 w-5" />
                                Approve
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

