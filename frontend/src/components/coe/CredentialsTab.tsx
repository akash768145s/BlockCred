'use client';

import React from 'react';
import { Eye, Download } from 'lucide-react';

interface CredentialsTabProps {
    credentials: any[];
}

export const CredentialsTab: React.FC<CredentialsTabProps> = ({ credentials }) => {
    return (
        <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Issued Credentials</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Credential
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Semester
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Grade
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800/30 divide-y divide-white/10">
                            {credentials.map((credential) => (
                                <tr key={credential.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{credential.title || ((credential as any).cert_type || 'certificate').replace('_', ' ').toUpperCase()}</div>
                                        <div className="text-sm text-slate-400">{((credential as any).cert_type || credential.type || 'certificate').replace('_', ' ').toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {credential.student_name || (credential as any).metadata?.student_name || 'Unknown Student'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {credential.semester || (credential as any).metadata?.semester || ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {credential.subject || (credential as any).metadata?.course || ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium">{credential.marks || (credential as any).metadata?.cgpa || ''}</span>
                                            {credential.grade || (credential as any).metadata?.grade ? (
                                                <span className="text-slate-400">({credential.grade || (credential as any).metadata?.grade})</span>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {credential.issued_date || (credential as any).issued_at ? new Date(credential.issued_date || (credential as any).issued_at).toLocaleDateString() : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button className="text-blue-400 hover:text-blue-300">
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button className="text-green-400 hover:text-green-300">
                                                <Download className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

