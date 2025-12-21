"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";

type Subject = {
    subject_code?: string;
    subject_name?: string;
    marks?: number;
    grade?: string;
    credits?: number;
};

type PublicCertificate = {
    cert_id: string;
    cert_type: string;
    status: string;
    issued_at: string;
    ipfs_url: string;

    // NEW: Cryptographic proofs (DApp architecture)
    issuer_signature?: string;
    merkle_root?: string;
    transparency_log_index?: number;
    signed_document_url?: string;

    // DEPRECATED: Blockchain fields (kept for backward compatibility)
    tx_hash?: string;
    block_number?: number;

    metadata: {
        student_name?: string;
        student_email?: string;
        institution?: string;
        department?: string;
        course?: string;
        semester?: string;
        academic_year?: string;
        grade?: string;
        cgpa?: number;
        additional_data?: Record<string, unknown>;
        subjects?: Subject[];
    };
};

type PublicStudentProfile = {
    student_id: string;
    name: string;
    department?: string;
    institution?: string;
    course?: string;
    wallet_address?: string;
    certificates: PublicCertificate[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

export default function ShareableStudentProfilePage() {
    const params = useParams<{ studentId: string }>();
    const studentId = params?.studentId;
    const [profile, setProfile] = useState<PublicStudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [origin, setOrigin] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setOrigin(window.location.origin);
        }
    }, []);

    useEffect(() => {
        if (!studentId) {
            setError("Missing student ID in URL");
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`${API_BASE}/public/student/${studentId}`);
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.message || "Unable to load public profile");
                }

                setProfile(data.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to load public profile");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [studentId]);

    const profileUrl = useMemo(() => {
        if (!origin || !studentId) return "";
        return `${origin}/share/${studentId}`;
    }, [origin, studentId]);

    const handleCopyLink = async () => {
        if (!profileUrl) return;
        try {
            await navigator.clipboard.writeText(profileUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            setError("Unable to copy link. Copy manually from the browser.");
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Generating Profile</p>
                    <h1 className="mt-3 text-2xl font-semibold">Loading blockchain certificates...</h1>
                </div>
            </main>
        );
    }

    if (error || !profile) {
        return (
            <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="text-center max-w-md">
                    <p className="text-sm uppercase tracking-[0.3em] text-red-300">Profile Error</p>
                    <h1 className="mt-3 text-2xl font-semibold">{error || "Profile unavailable"}</h1>
                    <p className="mt-2 text-slate-300">Ensure the shared link is correct or contact the student directly.</p>
                </div>
            </main>
        );
    }

    const certificateCount = profile.certificates?.length ?? 0;

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white py-12 px-4">
            <div className="max-w-6xl mx-auto space-y-10">
                <section className="rounded-3xl bg-white/10 border border-white/10 backdrop-blur-lg p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.45em] text-indigo-300">Verified Student</p>
                            <h1 className="text-3xl font-semibold mt-3">{profile.name}</h1>
                            <p className="text-sm text-indigo-100 mt-1">
                                {profile.course || profile.department || "Course information pending"} &bull; {profile.student_id}
                            </p>
                            {profile.wallet_address && (
                                <p className="text-xs text-indigo-200/80 mt-2 font-mono">Wallet: {profile.wallet_address}</p>
                            )}
                        </div>
                        <div className="bg-black/30 rounded-2xl border border-white/10 p-4 text-center min-w-[200px]">
                            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">On-chain Proofs</p>
                            <p className="text-4xl font-semibold mt-2">{certificateCount}</p>
                            <p className="text-xs text-slate-300 mt-1">Certificates issued via Hyperledger Besu</p>
                            <div className="mt-4 flex gap-2">
                                <button
                                    className="flex-1 bg-white text-slate-900 text-xs font-semibold py-2 rounded-xl"
                                    onClick={() => window.open(`/verify?certId=${profile.certificates?.[0]?.cert_id ?? ""}`, "_blank")}
                                    disabled={!profile.certificates?.length}
                                >
                                    Quick Verify
                                </button>
                                <button
                                    className="flex-1 border border-white/40 text-xs font-semibold py-2 rounded-xl"
                                    onClick={handleCopyLink}
                                >
                                    {copied ? "Copied!" : "Copy Link"}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Certificates</p>
                            <h2 className="text-2xl font-semibold mt-1">Blockchain-Protected Credentials</h2>
                            <p className="text-sm text-slate-300">
                                Scan any QR to open the immutable verification page, or tap &ldquo;Verify Now&rdquo; for full blockchain + IPFS data.
                            </p>
                        </div>
                        {profileUrl && (
                            <div className="text-right">
                                <p className="text-xs text-slate-400 mb-1">Shareable profile</p>
                                <p className="text-sm font-mono text-slate-100 truncate max-w-xs">{profileUrl}</p>
                            </div>
                        )}
                    </div>

                    {certificateCount === 0 ? (
                        <div className="bg-black/30 rounded-2xl border border-white/10 p-8 text-center text-slate-300">
                            No certificates are linked to this student yet. Check back after issuance.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {profile.certificates.map((certificate) => {
                                const nonBCsubjects: Subject[] | undefined = Array.isArray(certificate.metadata?.subjects)
                                    ? certificate.metadata.subjects
                                    : Array.isArray(
                                        (certificate.metadata?.additional_data as Record<string, any> | undefined)?.subjects
                                    )
                                        ? (((certificate.metadata?.additional_data as Record<string, any>)?.subjects) as Subject[])
                                        : undefined;

                                const verifyUrl = origin
                                    ? `${origin}/verify?certId=${certificate.cert_id}`
                                    : `/verify?certId=${certificate.cert_id}`;

                                const issuedDate = new Date(certificate.issued_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                });

                                return (
                                    <div
                                        key={certificate.cert_id}
                                        className="relative bg-white text-slate-900 rounded-3xl shadow-2xl p-6 border border-indigo-100"
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Certificate Type</p>
                                                    <h3 className="text-xl font-semibold mt-1">
                                                        {certificate.cert_type.replace(/_/g, " ").toUpperCase()}
                                                    </h3>
                                                    <p className="text-sm text-slate-500">Issued {issuedDate}</p>
                                                    <span
                                                        className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold ${certificate.status === "revoked"
                                                                ? "bg-red-50 text-red-600 border border-red-100"
                                                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                            }`}
                                                    >
                                                        {certificate.status === "revoked"
                                                            ? "Revoked"
                                                            : (certificate.issuer_signature ? "Cryptographically Verified" : "Verified on-chain")}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center gap-2">
                                                    <QRCodeCanvas
                                                        value={verifyUrl}
                                                        size={120}
                                                        bgColor="#ffffff"
                                                        fgColor="#111827"
                                                        level="H"
                                                    />
                                                    <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                                                        Scan to verify
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                {certificate.metadata?.semester && (
                                                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                                        <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Semester</p>
                                                        <p className="text-base font-semibold text-slate-900 mt-1">
                                                            {certificate.metadata.semester}
                                                        </p>
                                                    </div>
                                                )}
                                                {certificate.metadata?.academic_year && (
                                                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                                        <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Academic Year</p>
                                                        <p className="text-base font-semibold text-slate-900 mt-1">
                                                            {certificate.metadata.academic_year}
                                                        </p>
                                                    </div>
                                                )}
                                                {certificate.metadata?.cgpa && (
                                                    <div className="col-span-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100">
                                                        <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-600">CGPA</p>
                                                        <p className="text-3xl font-bold text-emerald-700 mt-1">{certificate.metadata.cgpa}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {nonBCsubjects && nonBCsubjects.length > 0 && (
                                                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
                                                    <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 mb-3">
                                                        Subjects
                                                    </p>
                                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                        {nonBCsubjects.map((subject, index) => (
                                                            <div
                                                                key={`${subject.subject_code}-${index}`}
                                                                className="flex items-center justify-between text-xs bg-white rounded-xl border border-slate-100 px-3 py-2"
                                                            >
                                                                <div>
                                                                    <p className="font-semibold text-slate-900">
                                                                        {subject.subject_code || subject.subject_name}
                                                                    </p>
                                                                    <p className="text-slate-500">{subject.subject_name}</p>
                                                                </div>
                                                                <div className="text-right font-semibold text-slate-900">
                                                                    {subject.marks && <p>{subject.marks} marks</p>}
                                                                    {subject.grade && <p className="text-emerald-600">{subject.grade}</p>}
                                                                    {subject.credits && <p className="text-[10px] text-slate-400">{subject.credits} Credits</p>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                <Link
                                                    href={`/verify?certId=${certificate.cert_id}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold"
                                                >
                                                    Verify Now
                                                </Link>
                                                <a
                                                    href={certificate.ipfs_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 text-slate-600"
                                                >
                                                    View IPFS Proof
                                                </a>
                                                {certificate.tx_hash && (
                                                    <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                                                        Tx: {certificate.tx_hash.slice(0, 10)}...
                                                    </span>
                                                )}
                                                {certificate.issuer_signature && (
                                                    <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                                                        Signature: {certificate.issuer_signature.slice(0, 10)}...
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

