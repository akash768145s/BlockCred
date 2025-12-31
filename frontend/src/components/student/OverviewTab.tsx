'use client';

import React from 'react';

interface Student {
    id: number;
    student_id?: string;
    name: string;
    email: string;
    phone?: string;
    dob?: string;
    father_name?: string;
    aadhar_number?: string;
    department?: string;
    tenth_school?: string;
    tenth_marks?: number;
    twelfth_school?: string;
    twelfth_marks?: number;
    cutoff?: number;
    school_name?: string;
    node_assigned?: boolean;
    is_approved?: boolean;
}

interface OverviewTabProps {
    student: Student;
    avatarUrl: string;
    publicProfileUrl: string;
    copiedShareLink: boolean;
    onCopyShareLink: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ student, avatarUrl, publicProfileUrl, copiedShareLink, onCopyShareLink }) => {
    return (
        <div className="space-y-6">
            {/* Student ID Card - Compact Design */}
            <section className="flex justify-center">
                <div className="w-full max-w-2xl rounded-xl bg-gradient-to-br from-slate-800/90 via-indigo-900/80 to-slate-800/90 border-2 border-white/20 backdrop-blur-lg shadow-2xl overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-b border-white/20 px-5 py-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[8px] uppercase tracking-[0.3em] text-indigo-200 font-semibold mb-1">BlockCred Student ID</p>
                                <h2 className="text-lg font-bold text-white">{student.name}</h2>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                                {student.student_id && (
                                    <span className="px-2.5 py-1 bg-white/15 border border-white/25 rounded-md text-[10px] font-semibold text-indigo-100">
                                        {student.student_id}
                                    </span>
                                )}
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${student.is_approved
                                    ? "bg-emerald-500/25 text-emerald-100 border border-emerald-400/40"
                                    : "bg-amber-500/25 text-amber-100 border border-amber-400/40"
                                    }`}>
                                    {student.is_approved ? "✓ Approved" : "⏳ Pending"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-5">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                            {/* Left Column */}
                            <div className="space-y-2.5">
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300/70 font-medium mb-0.5">Email</p>
                                    <p className="font-medium text-white text-[11px] break-all leading-tight">{student.email}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300/70 font-medium mb-0.5">Phone</p>
                                    <p className="font-medium text-white text-[11px]">{student.phone || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300/70 font-medium mb-0.5">Date of Birth</p>
                                    <p className="font-medium text-white text-[11px]">{student.dob || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300/70 font-medium mb-0.5">Father's Name</p>
                                    <p className="font-medium text-white text-[11px]">{student.father_name || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300/70 font-medium mb-0.5">Aadhar Number</p>
                                    <p className="font-medium text-white text-[11px]">{student.aadhar_number || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300/70 font-medium mb-0.5">Department</p>
                                    <p className="font-medium text-white text-[11px]">{student.department || "-"}</p>
                                </div>
                            </div>

                            {/* Right Column - Academic */}
                            <div className="space-y-2.5">
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300/70 font-medium mb-0.5">10th School</p>
                                    <p className="font-medium text-white text-[11px]">{student.tenth_school || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300/70 font-medium mb-0.5">10th Marks</p>
                                    <p className="font-medium text-white text-[11px]">{student.tenth_marks ? `${student.tenth_marks}%` : "-"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300/70 font-medium mb-0.5">12th School</p>
                                    <p className="font-medium text-white text-[11px]">{student.twelfth_school || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300/70 font-medium mb-0.5">12th Marks</p>
                                    <p className="font-medium text-white text-[11px]">{student.twelfth_marks ? `${student.twelfth_marks}%` : "-"}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300/70 font-medium mb-0.5">Cut-off</p>
                                    <p className="font-medium text-white text-[11px]">{student.cutoff ? `${student.cutoff}` : "-"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Verification Status */}
                    <div className="bg-slate-900/50 border-t border-white/10 px-5 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span className="text-[10px] font-semibold text-emerald-200">Verified Identity</span>
                        </div>
                        {student.node_assigned && (
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                <span className="text-[10px] font-semibold text-amber-200">Blockchain Node Linked</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Shareable Profile */}
            {publicProfileUrl && (
                <section className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-lg shadow-xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex-1">
                            <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-300 font-semibold mb-2">BlockCred</p>
                            <h2 className="text-lg font-semibold text-white mb-2">Blockchain-verified transcript</h2>
                            <p className="text-sm text-indigo-200 mb-3 max-w-lg">
                                Share a public page that showcases only the verified certificates. Recruiters can scan QR codes or open the verifier
                                link to view the blockchain + IPFS proofs.
                            </p>
                            <p className="text-xs font-mono text-indigo-300 bg-white/5 px-3 py-2 rounded-lg border border-white/10 truncate max-w-lg">{publicProfileUrl}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:flex-shrink-0">
                            {student.student_id && (
                                <button
                                    onClick={() => window.open(`/share/${student.student_id}`, "_blank")}
                                    className="px-5 py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold shadow-lg hover:bg-indigo-50 transition"
                                >
                                    View Public Profile
                                </button>
                            )}
                            <button
                                onClick={onCopyShareLink}
                                className="px-5 py-3 rounded-xl border border-white/30 text-sm font-semibold text-white hover:bg-white/10 transition"
                            >
                                {copiedShareLink ? "✓ Link Copied" : "Copy Share Link"}
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

