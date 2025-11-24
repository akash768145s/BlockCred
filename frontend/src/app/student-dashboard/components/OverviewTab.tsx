"use client";

import { useMemo } from "react";

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

export default function OverviewTab({ student, avatarUrl, publicProfileUrl, copiedShareLink, onCopyShareLink }: OverviewTabProps) {
    return (
        <div className="space-y-6">
            {/* Student Overview */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-lg shadow-xl p-6 space-y-5">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-300 font-semibold mb-2">Student Identity</p>
                            <h2 className="text-xl font-semibold text-white mb-3">{student.name}</h2>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {student.student_id && (
                                    <span className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs font-medium text-indigo-200">
                                        ID: {student.student_id}
                                    </span>
                                )}
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${student.is_approved
                                    ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                                    : "bg-amber-500/20 text-amber-200 border border-amber-400/30"
                                    }`}>
                                    {student.is_approved ? "✓ Approved" : "⏳ Pending"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-300 font-semibold mb-1.5">Email</p>
                            <p className="font-medium text-white break-all">{student.email}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-300 font-semibold mb-1.5">Phone</p>
                            <p className="font-medium text-white">{student.phone || "Not provided"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-300 font-semibold mb-1.5">Date of Birth</p>
                            <p className="font-medium text-white">{student.dob || "Not provided"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-300 font-semibold mb-1.5">Father's Name</p>
                            <p className="font-medium text-white">{student.father_name || "Not provided"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-300 font-semibold mb-1.5">Aadhar Number</p>
                            <p className="font-medium text-white">{student.aadhar_number || "Not provided"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-300 font-semibold mb-1.5">Department</p>
                            <p className="font-medium text-white">{student.department || "Not assigned"}</p>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Verified Identity
                        </span>
                        {student.node_assigned && (
                            <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-400/30 rounded-lg text-amber-200">
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                Blockchain Node Linked
                            </span>
                        )}
                    </div>
                </div>
                <div>
                    <div className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur-lg shadow-xl p-6 h-full">
                        <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-300 font-semibold mb-4">Academic Snapshot</p>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-sm text-indigo-200">10th School</span>
                                <span className="font-semibold text-white">{student.tenth_school || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-sm text-indigo-200">10th Marks</span>
                                <span className="font-semibold text-white">{student.tenth_marks ? `${student.tenth_marks}%` : "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-sm text-indigo-200">12th School</span>
                                <span className="font-semibold text-white">{student.twelfth_school || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-sm text-indigo-200">12th Marks</span>
                                <span className="font-semibold text-white">{student.twelfth_marks ? `${student.twelfth_marks}%` : "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-sm text-indigo-200">Cut-off</span>
                                <span className="font-semibold text-white">{student.cutoff ? `${student.cutoff}` : "N/A"}</span>
                            </div>
                        </div>
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
}

