'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft } from 'lucide-react';
import CertificateDisplay from '@/components/CertificateDisplay';
import { adminService } from '@/services/adminService';
import type { CredentialTypeConfig } from '@/types/rbac';

export interface IssuedCertificate {
    id?: string;
    cert_id: string;
    cert_type: string;
    student_id: string;
    status: string;
    issued_at?: string;
    issued_date?: string;
    metadata?: {
        student_name?: string;
        student_email?: string;
        institution?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

interface IssuedTabProps {
    credentials: IssuedCertificate[];
    onRefresh: () => void;
    /** Optional accent for table/buttons */
    accent?: 'indigo' | 'emerald' | 'purple';
}

export function IssuedTab({ credentials, onRefresh, accent = 'indigo' }: IssuedTabProps) {
    const [selectedCert, setSelectedCert] = useState<IssuedCertificate | null>(null);
    const [credentialTypes, setCredentialTypes] = useState<CredentialTypeConfig[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        adminService
            .listPublicCredentialTypes()
            .then((data) => setCredentialTypes(Array.isArray(data) ? data : []))
            .catch(() => setCredentialTypes([]));
    }, []);

    const filtered = (credentials || []).filter((c) => {
        const name = c.metadata?.student_name ?? (c as any).student_name ?? '';
        const id = c.student_id ?? '';
        const term = searchTerm.toLowerCase();
        return !term || String(name).toLowerCase().includes(term) || id.toLowerCase().includes(term);
    });

    const matchType = (certType: string | undefined | null): CredentialTypeConfig | null => {
        if (!certType || !credentialTypes.length) return null;
        const n = certType.toLowerCase().replace(/\s+/g, '_');
        return (
            credentialTypes.find((t) => t.name === certType) ??
            credentialTypes.find((t) => t.name.toLowerCase().replace(/\s+/g, '_') === n) ??
            credentialTypes.find((t) => t.name.toLowerCase().includes(n.replace(/_/g, ''))) ??
            null
        );
    };

    if (selectedCert) {
        return (
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => setSelectedCert(null)}
                    className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to list
                </button>
                <CertificateDisplay
                    certificate={selectedCert}
                    credentialTypes={credentialTypes}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by student name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <button
                    type="button"
                    onClick={onRefresh}
                    className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-200 text-sm font-medium hover:bg-slate-700"
                >
                    Refresh
                </button>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700/50">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Student ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Credential type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                                        No certificates issued yet. Issue one from the Credentials tab.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((cert) => {
                                    const issuedAt = cert.issued_at ?? (cert as any).issued_date;
                                    const dateStr = issuedAt
                                        ? new Date(issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                        : '—';
                                    const studentName = cert.metadata?.student_name ?? (cert as any).student_name ?? 'Unknown';
                                    const rawType = (cert.cert_type ?? (cert as any).cert_type ?? 'certificate') as string;
                                    const typeConfig = matchType(rawType);
                                    const typeLabel =
                                        typeConfig?.name ??
                                        rawType
                                            .replace(/_/g, ' ')
                                            .replace(/\s+/g, ' ')
                                            .trim()
                                            .replace(/\b\w/g, (c) => c.toUpperCase());
                                    return (
                                        <tr
                                            key={cert.cert_id}
                                            className="hover:bg-slate-700/30 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-sm font-medium text-white">
                                                {studentName}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-300">
                                                {cert.student_id}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-300">
                                                {typeLabel}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-400">
                                                {dateStr}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                        cert.status === 'issued'
                                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                            : cert.status === 'verified'
                                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                            : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                                                    }`}
                                                >
                                                    {cert.status ?? 'issued'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCert(cert)}
                                                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                                                >
                                                    View certificate
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
