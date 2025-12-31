'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { useCOE } from '@/hooks/useCOE';
import {
    OverviewTab,
    StudentsTab,
    CredentialsTab,
    IssueCredentialModal
} from '@/components/coe';

const COEDashboard: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const { students, credentials, loading, fetchCredentials } = useCOE();
    const [showIssueCredential, setShowIssueCredential] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSemester, setFilterSemester] = useState('all');


    const stats = {
        totalStudents: Array.isArray(students) ? students.length : 0,
        totalCredentials: Array.isArray(credentials) ? credentials.length : 0,
        issuedToday: Array.isArray(credentials) ? credentials.filter(c => {
            const today = new Date().toISOString().split('T')[0];
            const issuedDate = (c as any).issued_date || (c as any).issued_at;
            if (!issuedDate) return false;
            const dateStr = typeof issuedDate === 'string'
                ? issuedDate.split('T')[0]
                : new Date(issuedDate).toISOString().split('T')[0];
            return dateStr === today;
        }).length : 0,
        pendingVerification: Array.isArray(credentials) ? credentials.filter(c => c.status === 'pending').length : 0
    };




    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4"></div>
                    <p className="text-sm text-slate-300">Loading COE dashboard...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center shadow-lg">
                            <FileText className="h-6 w-6 text-indigo-300" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-300 font-semibold">BlockCred</p>
                            <h1 className="text-xl font-semibold text-white mt-1">COE Dashboard</h1>
                            <p className="text-xs text-indigo-200">Manage academic credentials & results</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/20">
                            Controller of Examinations
                        </span>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                router.push('/login');
                            }}
                            className="px-4 py-2 text-xs font-semibold text-white border border-white/20 rounded-lg hover:bg-white/10 transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'overview'
                                ? 'bg-white/10 text-white border-t border-x border-white/20'
                                : 'text-indigo-200 hover:text-white'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'students'
                                ? 'bg-white/10 text-white border-t border-x border-white/20'
                                : 'text-indigo-200 hover:text-white'
                                }`}
                        >
                            Students
                        </button>
                        <button
                            onClick={() => setActiveTab('credentials')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === 'credentials'
                                ? 'bg-white/10 text-white border-t border-x border-white/20'
                                : 'text-indigo-200 hover:text-white'
                                }`}
                        >
                            Credentials
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <OverviewTab
                        stats={stats}
                        onIssueCredential={() => setShowIssueCredential(true)}
                        onViewStudents={() => setActiveTab('students')}
                    />
                )}
                {activeTab === 'students' && (
                    <StudentsTab
                        students={students}
                        searchTerm={searchTerm}
                        filterSemester={filterSemester}
                        onSearchChange={setSearchTerm}
                        onFilterSemesterChange={setFilterSemester}
                        onIssueCredential={() => setShowIssueCredential(true)}
                    />
                )}
                {activeTab === 'credentials' && (
                    <CredentialsTab
                        credentials={credentials}
                    />
                )}
            </div>

            {/* Issue Credential Modal */}
            {showIssueCredential && (
                <IssueCredentialModal
                    onClose={() => setShowIssueCredential(false)}
                    onCredentialIssued={() => {
                        setShowIssueCredential(false);
                        fetchCredentials();
                    }}
                    students={students}
                />
            )}
        </main>
    );
};

export default COEDashboard;
