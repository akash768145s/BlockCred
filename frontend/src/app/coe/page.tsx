'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCOE } from '@/hooks/useCOE';
import { DashboardHeader } from '@/components/DashboardHeader';
import { OverviewTab, IssueCredentialModal } from '@/components/coe';
import { CredentialTypesTab, IssuedTab } from '@/components/issuer';
import type { CredentialTypeConfig } from '@/types/rbac';

const COEDashboard: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const { user } = useAuth();
    const { students, credentials, loading, fetchCredentials } = useCOE();
    const [showIssueCredential, setShowIssueCredential] = useState(false);
    const [initialCredentialType, setInitialCredentialType] = useState<CredentialTypeConfig | null>(null);

    const stats = {
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalCredentials: Array.isArray(credentials) ? credentials.length : 0,
        issuedToday: Array.isArray(credentials)
            ? credentials.filter((c) => {
                  const today = new Date().toISOString().split('T')[0];
                  const issuedDate = (c as any).issued_date || (c as any).issued_at;
                  if (!issuedDate) return false;
                  const dateStr =
                      typeof issuedDate === 'string' ? issuedDate.split('T')[0] : new Date(issuedDate).toISOString().split('T')[0];
                  return dateStr === today;
              }).length
            : 0,
        pendingVerification: Array.isArray(credentials) ? credentials.filter((c) => c.status === 'pending').length : 0,
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const openIssueModal = (type: CredentialTypeConfig | null) => {
        setInitialCredentialType(type);
        setShowIssueCredential(true);
    };

    const closeIssueModal = () => {
        setShowIssueCredential(false);
        setInitialCredentialType(null);
        fetchCredentials();
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4"></div>
                    <p className="text-sm text-slate-300">Loading dashboard...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            <DashboardHeader user={user ?? null} onLogout={handleLogout} maxWidth="max-w-6xl" />

            <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'overview' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('credentials')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'credentials' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Credentials
                        </button>
                        <button
                            onClick={() => setActiveTab('issued')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'issued' ? 'bg-white/10 text-white border-t border-x border-white/20' : 'text-indigo-200 hover:text-white'}`}
                        >
                            Issued
                        </button>
                    </nav>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <OverviewTab
                        stats={stats}
                        onIssueCredential={() => openIssueModal(null)}
                        onViewCredentials={() => setActiveTab('credentials')}
                    />
                )}
                {activeTab === 'credentials' && (
                    <CredentialTypesTab onIssue={(t) => openIssueModal(t)} accent="indigo" />
                )}
                {activeTab === 'issued' && (
                    <IssuedTab credentials={credentials as any} onRefresh={fetchCredentials} accent="indigo" />
                )}
            </div>

            {showIssueCredential && (
                <IssueCredentialModal
                    onClose={() => {
                        setShowIssueCredential(false);
                        setInitialCredentialType(null);
                    }}
                    onCredentialIssued={closeIssueModal}
                    students={students}
                    initialCredentialType={initialCredentialType}
                />
            )}
        </main>
    );
};

export default COEDashboard;
