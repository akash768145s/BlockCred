"use client";

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

function Row({ label, value }: { label: string; value?: string | number }) {
    return (
        <div className="py-3 px-4 rounded-lg bg-slate-900/40 border border-slate-700/50">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm font-medium text-slate-100">{value ?? "—"}</p>
        </div>
    );
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

export default function OverviewTab({
    student,
    publicProfileUrl,
    copiedShareLink,
    onCopyShareLink,
}: OverviewTabProps) {
    return (
        <div className="space-y-6">
            {/* Profile card */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden transition-all hover:border-slate-600/80">
                <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between flex-wrap gap-4 bg-slate-800/80">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-bold text-xl shadow-inner">
                            {student.name?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-white tracking-tight">{student.name}</h1>
                            {student.student_id && (
                                <p className="text-sm text-slate-400 mt-0.5 font-mono">{student.student_id}</p>
                            )}
                        </div>
                    </div>
                    <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            student.is_approved
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                                : "bg-amber-500/15 text-amber-300 border-amber-500/40"
                        }`}
                    >
                        {student.is_approved ? "Approved" : "Pending"}
                    </span>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CardSection title="Contact & identity">
                        <Row label="Email" value={student.email} />
                        <Row label="Phone" value={student.phone} />
                        <Row label="Date of birth" value={student.dob} />
                        <Row label="Father's name" value={student.father_name} />
                        <Row label="Aadhar" value={student.aadhar_number} />
                    </CardSection>
                    <CardSection title="Academic">
                        <Row label="Department" value={student.department} />
                        <Row label="Cut-off" value={student.cutoff != null ? String(student.cutoff) : undefined} />
                    </CardSection>
                    <CardSection title="Previous education">
                        <Row label="10th school" value={student.tenth_school} />
                        <Row label="10th marks" value={student.tenth_marks != null ? `${student.tenth_marks}%` : undefined} />
                        <Row label="12th school" value={student.twelfth_school} />
                        <Row label="12th marks" value={student.twelfth_marks != null ? `${student.twelfth_marks}%` : undefined} />
                    </CardSection>
                </div>
                {student.node_assigned && (
                    <div className="px-6 py-3 bg-slate-900/50 border-t border-slate-700/50 flex items-center gap-2 text-xs font-medium text-amber-200/90">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Blockchain node linked
                    </div>
                )}
            </div>

            {/* Share credentials card */}
            {publicProfileUrl && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden transition-all hover:border-slate-600/80">
                    <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/80">
                        <h2 className="text-base font-semibold text-white">Share your credentials</h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Public link for recruiters and verifiers to view your blockchain-verified certificates.
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <code className="flex-1 min-w-0 px-4 py-3 bg-slate-900/60 border border-slate-600 rounded-lg text-sm text-slate-300 font-mono truncate">
                                {publicProfileUrl}
                            </code>
                            <div className="flex gap-2 shrink-0">
                                <a
                                    href={`/share/${student.student_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
                                >
                                    Open profile
                                </a>
                                <button
                                    onClick={onCopyShareLink}
                                    className="px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-200 text-sm font-medium hover:bg-slate-700 transition-colors"
                                >
                                    {copiedShareLink ? "Copied" : "Copy link"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
