'use client';

import React from 'react';
import { Users, Shield, GraduationCap, Clock, FileText, UserPlus, Award } from 'lucide-react';

interface OverviewTabProps {
    displayStats: {
        total_users: number;
        pending_users: number;
        total_credentials: number;
        total_students: number;
        total_issuers: number;
    };
    onCreateUser: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ displayStats, onCreateUser }) => {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Users className="h-7 w-7 text-blue-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Total Users</p>
                        <p className="text-2xl font-bold text-white">{displayStats.total_users}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Shield className="h-7 w-7 text-indigo-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Issuers</p>
                        <p className="text-2xl font-bold text-white">{displayStats.total_issuers}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <GraduationCap className="h-7 w-7 text-cyan-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Students</p>
                        <p className="text-2xl font-bold text-white">{displayStats.total_students}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <Clock className="h-7 w-7 text-yellow-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Pending Approval</p>
                        <p className="text-2xl font-bold text-white">{displayStats.pending_users}</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-5 rounded-lg shadow-lg">
                    <div className="flex flex-col items-center text-center">
                        <FileText className="h-7 w-7 text-green-400 mb-3" />
                        <p className="text-xs font-medium text-slate-300 mb-2">Total Credentials</p>
                        <p className="text-2xl font-bold text-white">{displayStats.total_credentials}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-indigo-300 mb-3 uppercase tracking-wide">Issuing Authorities</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={onCreateUser}
                            className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                        >
                            <div className="flex items-center mb-2">
                                <UserPlus className="h-5 w-5 text-blue-400" />
                                <span className="ml-2 font-medium text-white">Create COE</span>
                            </div>
                            <p className="text-sm text-slate-300">Controller of Examinations</p>
                        </button>

                        <button
                            onClick={onCreateUser}
                            className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                        >
                            <div className="flex items-center mb-2">
                                <GraduationCap className="h-5 w-5 text-green-400" />
                                <span className="ml-2 font-medium text-white">Create Faculty</span>
                            </div>
                            <p className="text-sm text-slate-300">Department Faculty</p>
                        </button>

                        <button
                            onClick={onCreateUser}
                            className="p-4 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left bg-white/5"
                        >
                            <div className="flex items-center mb-2">
                                <Award className="h-5 w-5 text-purple-400" />
                                <span className="ml-2 font-medium text-white">Create Club Coordinator</span>
                            </div>
                            <p className="text-sm text-slate-300">Club Coordinator</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

