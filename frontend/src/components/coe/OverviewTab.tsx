'use client';

import React from 'react';
import { Users, FileText, TrendingUp, Clock, GraduationCap } from 'lucide-react';

interface OverviewTabProps {
    stats: {
        totalStudents: number;
        totalCredentials: number;
        issuedToday: number;
        pendingVerification: number;
    };
    onIssueCredential: () => void;
    onViewCredentials: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ stats, onIssueCredential, onViewCredentials }) => {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Users className="h-7 w-7 text-blue-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Total Students</p>
                        <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <FileText className="h-7 w-7 text-green-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Total Credentials</p>
                        <p className="text-2xl font-bold text-white">{stats.totalCredentials}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <TrendingUp className="h-7 w-7 text-purple-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Issued Today</p>
                        <p className="text-2xl font-bold text-white">{stats.issuedToday}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Clock className="h-7 w-7 text-yellow-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Pending Verification</p>
                        <p className="text-2xl font-bold text-white">{stats.pendingVerification}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={onIssueCredential}
                        className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                    >
                        <div className="flex items-center mb-2">
                            <FileText className="h-5 w-5 text-blue-400" />
                            <span className="ml-2 font-medium text-white">Issue Marksheet</span>
                        </div>
                        <p className="text-sm text-slate-300">Issue semester marksheet for students</p>
                    </button>

                    <button
                        onClick={onIssueCredential}
                        className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                    >
                        <div className="flex items-center mb-2">
                            <GraduationCap className="h-5 w-5 text-green-400" />
                            <span className="ml-2 font-medium text-white">Issue Degree Certificate</span>
                        </div>
                        <p className="text-sm text-slate-300">Issue degree certificates for graduates</p>
                    </button>

                    <button
                        onClick={onViewCredentials}
                        className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                    >
                        <div className="flex items-center mb-2">
                            <Users className="h-5 w-5 text-purple-400" />
                            <span className="ml-2 font-medium text-white">View Credentials</span>
                        </div>
                        <p className="text-sm text-slate-300">Browse credential types you can issue</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

