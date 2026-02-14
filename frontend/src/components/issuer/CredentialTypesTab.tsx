'use client';

import React, { useState, useEffect } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { adminService } from '@/services/adminService';
import type { CredentialTypeConfig } from '@/types/rbac';

interface CredentialTypesTabProps {
    onIssue: (credentialType: CredentialTypeConfig) => void;
    /** Optional accent for cards: 'indigo' | 'emerald' | 'purple' */
    accent?: 'indigo' | 'emerald' | 'purple';
}

const accentClasses = {
    indigo: 'border-indigo-500/30 hover:border-indigo-400/50 hover:bg-indigo-500/10',
    emerald: 'border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-500/10',
    purple: 'border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/10',
};

const iconColors = { indigo: 'text-indigo-400', emerald: 'text-emerald-400', purple: 'text-purple-400' };

export function CredentialTypesTab({ onIssue, accent = 'indigo' }: CredentialTypesTabProps) {
    const [types, setTypes] = useState<CredentialTypeConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        adminService
            .listIssuerCredentialTypes()
            .then((list) => {
                setTypes(Array.isArray(list) ? list : []);
                setError(null);
            })
            .catch(() => {
                setTypes([]);
                setError('Unable to load credential types. Ask an administrator to assign types to your role.');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-500 border-t-transparent" />
                <p className="mt-4 text-sm text-slate-400">Loading credential types...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-6 text-amber-100">
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (!types.length) {
        return (
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-8 text-center">
                <FileText className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No credential types are assigned to you yet.</p>
                <p className="text-sm text-slate-500 mt-1">Contact an administrator to configure credential types for your role.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-400">Click a credential to open the issuance form.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {types.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => onIssue(t)}
                        className={`text-left p-5 rounded-xl border bg-slate-800/50 transition-all flex items-center justify-between gap-4 ${accentClasses[accent]}`}
                    >
                        <div className="flex items-start gap-3 min-w-0">
                            <div className={`shrink-0 ${iconColors[accent]}`}>
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-white truncate">{t.name}</h3>
                                {t.description && (
                                    <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">{t.description}</p>
                                )}
                                {t.fields && t.fields.length > 0 && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        {t.fields.length} field{t.fields.length !== 1 ? 's' : ''}: {t.fields.map((f) => f.label).join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-500 shrink-0" />
                    </button>
                ))}
            </div>
        </div>
    );
}
