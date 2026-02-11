'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

const ExternalVerifierDashboard: React.FC = () => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated()) {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
            }
        }
    }, [isAuthenticated]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center shadow-lg">
                            <ShieldCheck className="h-6 w-6 text-teal-300" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-300 font-semibold">BlockCred</p>
                            <h1 className="text-xl font-semibold text-white mt-1">External Verifier</h1>
                            <p className="text-xs text-indigo-200">Verify credential authenticity</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-200 border border-teal-400/30">
                            External Verifier
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

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm text-center">
                    <Search className="h-16 w-16 text-teal-400/80 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">Verify a credential</h2>
                    <p className="text-indigo-200/80 mb-6 max-w-md mx-auto">
                        Use the public verification page to check whether a certificate or credential is valid and issued by BlockCred.
                    </p>
                    <Link
                        href="/verify"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-500/20 text-teal-200 border border-teal-400/30 hover:bg-teal-500/30 transition-all font-semibold"
                    >
                        <Search className="h-5 w-5" />
                        Go to Verify
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default ExternalVerifierDashboard;
