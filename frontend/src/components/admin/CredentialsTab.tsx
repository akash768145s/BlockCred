'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface CredentialsTabProps {
    credentials: any[];
    onDeleteCredential: (credentialId: number | string) => void;
}

export const CredentialsTab: React.FC<CredentialsTabProps> = ({ credentials, onDeleteCredential }) => {
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
                                    Issued By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800/30 divide-y divide-white/10">
                            {(Array.isArray(credentials) ? credentials : []).map((credential) => (
                                <tr key={credential.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{credential.title || ''}</div>
                                        <div className="text-sm text-slate-400">{credential.type || (credential as any).cert_type || ''}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {credential.student_id || ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {credential.issued_by || (credential as any).metadata?.issuer_name || (credential as any).issuer_name || ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {credential.issued_date 
                                            ? formatDate(credential.issued_date) 
                                            : (credential as any).issued_at 
                                                ? formatDate((credential as any).issued_at) 
                                                : (credential as any).created_at 
                                                    ? formatDate((credential as any).created_at) 
                                                    : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${credential.status === 'issued' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                            credential.status === 'verified' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                                'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                            }`}>
                                            {credential.status || 'issued'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                // Try cert_id first, then id, then _id
                                                const idToDelete = (credential as any).cert_id || credential.id || (credential as any)._id;
                                                onDeleteCredential(idToDelete);
                                            }}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                            title="Delete Credential"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
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

