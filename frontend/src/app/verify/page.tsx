"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Subject = {
    subject_code?: string;
    subject_name?: string;
    marks?: number;
    grade?: string;
    credits?: number;
};

type CertificateMetadata = {
    student_name?: string;
    student_email?: string;
    issuer_name?: string;
    institution?: string;
    department?: string;
    course?: string;
    semester?: string;
    academic_year?: string;
    grade?: string;
    cgpa?: number;
    description?: string;
    additional_data?: Record<string, unknown>;
    subjects?: Subject[];
};

type VerificationResult = {
    is_valid: boolean;
    cert_id: string;
    student_id: string;
    issuer_id: string;
    cert_type: string;
    status: string;
    issued_at: string;
    ipfs_url: string;

    // NEW: Cryptographic proofs (DApp architecture)
    issuer_signature?: string;
    issuer_public_key?: string;
    signature_verified?: boolean;
    merkle_root?: string;
    merkle_proof_valid?: boolean;
    transparency_log_index?: number;
    signed_document_url?: string;

    // DEPRECATED: Blockchain fields (kept for backward compatibility)
    tx_hash?: string;
    block_number?: number;

    metadata: CertificateMetadata;
    error_message?: string;
    file_hash?: string;
    file_integrity_ok?: boolean;
    tamper_detected?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

export default function VerifyCertificatePage() {
    const searchParams = useSearchParams();
    const searchCertId = searchParams.get("certId") || "";
    const [certId, setCertId] = useState(searchCertId);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<VerificationResult | null>(null);

    useEffect(() => {
        if (searchCertId) {
            setCertId(searchCertId);
            handleVerify(searchCertId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchCertId]);

    const handleVerify = useCallback(
        async (certOverride?: string) => {
            const target = (certOverride ?? certId).trim();
            if (!target) {
                setError("Enter a certificate ID or scan a QR code.");
                return;
            }

            setLoading(true);
            setError(null);
            setResult(null);

            try {
                const response = await fetch(`${API_BASE}/certificates/verify/${target}`);
                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.message || "Verification failed");
                }

                setResult(data.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unable to verify certificate right now.");
            } finally {
                setLoading(false);
            }
        },
        [certId]
    );

    const subjects: Subject[] = useMemo(() => {
        if (!result?.metadata) return [];

        if (Array.isArray(result.metadata.subjects)) {
            return result.metadata.subjects;
        }

        const additionalSubjects = (result.metadata.additional_data as Record<string, Subject[]> | undefined)?.subjects;
        if (Array.isArray(additionalSubjects)) {
            return additionalSubjects;
        }

        return [];
    }, [result]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white py-12 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="text-center space-y-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">BlockCred</p>
                    <h1 className="text-3xl font-semibold">Verify Academic Credentials</h1>
                    <p className="text-sm text-indigo-100 max-w-2xl mx-auto">
                        Employers and verifiers can scan a QR code or enter a certificate ID to retrieve tamper-proof blockchain
                        validation plus the IPFS-hosted record.
                    </p>
                </header>

                <div className="grid lg:grid-cols-3 gap-6">
                    <section className="rounded-3xl bg-white/10 border border-white/10 backdrop-blur-lg p-6 space-y-4 shadow-2xl">
                        <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Enter Certificate ID</p>
                            <div className="mt-2 flex flex-col gap-3">
                                <input
                                    value={certId}
                                    onChange={(event) => setCertId(event.target.value)}
                                    placeholder="0x..."
                                    className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-indigo-200/60 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 font-mono text-sm"
                                />
                                <button
                                    onClick={() => handleVerify()}
                                    disabled={loading}
                                    className="rounded-2xl bg-white text-slate-900 font-semibold py-3 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                >
                                    {loading ? "Verifying..." : "Verify Certificate"}
                                </button>
                            </div>
                            {error && <p className="text-xs text-red-300 mt-2">{error}</p>}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-indigo-100 space-y-2">
                            <p className="uppercase tracking-[0.4em] text-indigo-200">How it works</p>
                            <ul className="space-y-1 list-disc list-inside text-indigo-100/80">
                                <li>Scan a student-provided QR code or paste the certificate ID.</li>
                                <li>We validate the on-chain issuance + IPFS hash.</li>
                                <li>View non-blockchain data plus blockchain proofs in one place.</li>
                            </ul>
                        </div>
                    </section>

                    <section className="lg:col-span-2 bg-white text-slate-900 rounded-3xl p-8 shadow-2xl space-y-6 min-h-[480px] border border-indigo-100">
                        {!result && !error && (
                            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Awaiting verification request</p>
                                <p className="mt-2 text-sm text-slate-500">Enter a certificate ID or scan a QR code to see the blockchain proof.</p>
                            </div>
                        )}

                        {result && (
                            <div className="space-y-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Certificate ID</p>
                                        <p className="font-mono text-sm text-slate-600 break-all mt-1">{result.cert_id}</p>
                                        <h2 className="text-2xl font-semibold mt-2">
                                            {result.cert_type.replace(/_/g, " ").toUpperCase()}
                                        </h2>
                                        <p className="text-sm text-slate-500">
                                            Issued on{" "}
                                            {new Date(result.issued_at).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div
                                            className={`rounded-2xl px-4 py-3 text-sm font-semibold text-center ${result.is_valid ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                                                }`}
                                        >
                                            {result.is_valid ? "VALID CERTIFICATE" : "FAILED VERIFICATION"}
                                        </div>
                                        {result.signature_verified !== undefined && (
                                            <div
                                                className={`rounded-2xl px-4 py-2 text-xs font-semibold text-center ${result.signature_verified
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-red-50 text-red-600"
                                                    }`}
                                            >
                                                {result.signature_verified ? "✅ SIGNATURE VERIFIED" : "❌ INVALID SIGNATURE"}
                                            </div>
                                        )}
                                        {result.merkle_proof_valid !== undefined && (
                                            <div
                                                className={`rounded-2xl px-4 py-2 text-xs font-semibold text-center ${result.merkle_proof_valid
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-red-50 text-red-600"
                                                    }`}
                                            >
                                                {result.merkle_proof_valid ? "✅ MERKLE PROOF VALID" : "❌ INVALID MERKLE PROOF"}
                                            </div>
                                        )}
                                        {result.tamper_detected !== undefined && (
                                            <div
                                                className={`rounded-2xl px-4 py-2 text-xs font-semibold text-center ${result.tamper_detected
                                                    ? "bg-red-50 text-red-600 border-2 border-red-300"
                                                    : result.file_integrity_ok
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-yellow-50 text-yellow-700"
                                                    }`}
                                            >
                                                {result.tamper_detected
                                                    ? "⚠️ FILE TAMPERED"
                                                    : result.file_integrity_ok
                                                        ? "✅ FILE INTEGRITY OK"
                                                        : "⚠️ INTEGRITY CHECK UNAVAILABLE"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-slate-200 p-4">
                                        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Student ID</p>
                                        <p className="font-semibold text-slate-900 mt-1">{result.student_id}</p>
                                        {result.metadata?.student_name && (
                                            <p className="text-sm text-slate-500">{result.metadata.student_name}</p>
                                        )}
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 p-4">
                                        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Institution</p>
                                        <p className="font-semibold text-slate-900 mt-1">
                                            {result.metadata?.institution || "SSN College of Engineering"}
                                        </p>
                                        {result.metadata?.department && (
                                            <p className="text-sm text-slate-500">{result.metadata.department}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white p-6 border border-white/10 space-y-3 shadow-xl">
                                    {result.issuer_signature ? (
                                        <>
                                            <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Cryptographic Proofs (DApp Architecture)</p>
                                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-white/70 text-xs tracking-[0.3em]">Issuer Signature</p>
                                                    <p className="font-mono text-xs break-all mt-1 bg-white/5 p-2 rounded-lg">
                                                        {result.issuer_signature.substring(0, 32)}...
                                                    </p>
                                                </div>
                                                {result.merkle_root && (
                                                    <div>
                                                        <p className="text-white/70 text-xs tracking-[0.3em]">Merkle Root</p>
                                                        <p className="font-mono text-xs break-all mt-1 bg-white/5 p-2 rounded-lg">
                                                            {result.merkle_root.substring(0, 32)}...
                                                        </p>
                                                    </div>
                                                )}
                                                {result.transparency_log_index !== undefined && (
                                                    <div>
                                                        <p className="text-white/70 text-xs tracking-[0.3em]">Transparency Log Index</p>
                                                        <p className="text-lg font-semibold mt-1">{result.transparency_log_index}</p>
                                                    </div>
                                                )}
                                                {result.signed_document_url && (
                                                    <div>
                                                        <p className="text-white/70 text-xs tracking-[0.3em]">Signed Document</p>
                                                        <a
                                                            href={result.signed_document_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-2 text-xs underline mt-1 break-all"
                                                        >
                                                            View Signed Document
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xs uppercase tracking-[0.4em] text-indigo-200">Legacy Certificate (Blockchain-based)</p>
                                            {result.tx_hash && (
                                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-white/70 text-xs tracking-[0.3em]">Transaction Hash</p>
                                                        <p className="font-mono text-xs break-all mt-1 bg-white/5 p-2 rounded-lg">
                                                            {result.tx_hash}
                                                        </p>
                                                    </div>
                                                    {result.block_number && (
                                                        <div>
                                                            <p className="text-white/70 text-xs tracking-[0.3em]">Block Number</p>
                                                            <p className="text-lg font-semibold mt-1">{result.block_number}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <p className="text-white/60 text-[10px] mt-2">
                                                This is a legacy certificate issued before the DApp architecture migration. Verification is based on database record and file integrity.
                                            </p>
                                        </>
                                    )}

                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-white/70 text-xs tracking-[0.3em]">IPFS URL</p>
                                            <a
                                                href={result.ipfs_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-xs underline mt-1 break-all"
                                            >
                                                View File
                                            </a>
                                        </div>
                                    </div>

                                    {result.file_hash && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <p className="text-white/70 text-xs tracking-[0.3em] mb-2">File Hash (SHA-256)</p>
                                            <p className="font-mono text-xs break-all bg-white/5 p-2 rounded-lg">
                                                {result.file_hash}
                                            </p>
                                            <p className="text-white/60 text-[10px] mt-2">
                                                {result.issuer_signature
                                                    ? "This hash is cryptographically signed. If the file is modified, the hash will change and tampering will be detected."
                                                    : "This hash is stored on-chain. If the file is modified, the hash will change and tampering will be detected."}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Academic Snapshot</p>
                                    <div className="grid sm:grid-cols-3 gap-4 text-sm">
                                        {result.metadata?.semester && (
                                            <div>
                                                <p className="text-slate-500">Semester</p>
                                                <p className="text-lg font-semibold text-slate-900">
                                                    {result.metadata.semester}
                                                </p>
                                            </div>
                                        )}
                                        {result.metadata?.academic_year && (
                                            <div>
                                                <p className="text-slate-500">Academic Year</p>
                                                <p className="text-lg font-semibold text-slate-900">
                                                    {result.metadata.academic_year}
                                                </p>
                                            </div>
                                        )}
                                        {typeof result.metadata?.cgpa === "number" && (
                                            <div>
                                                <p className="text-slate-500">CGPA</p>
                                                <p className="text-3xl font-bold text-emerald-600">{result.metadata.cgpa.toFixed(2)}</p>
                                            </div>
                                        )}
                                    </div>
                                    {result.metadata?.grade && (
                                        <p className="text-sm text-slate-600">Overall Grade: {result.metadata.grade}</p>
                                    )}
                                </div>

                                {subjects.length > 0 && (
                                    <div className="rounded-2xl border border-slate-200 p-5 space-y-3">
                                        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Subjects</p>
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                            {subjects.map((subject, index) => (
                                                <div
                                                    key={`${subject.subject_code ?? index}`}
                                                    className="grid grid-cols-4 gap-3 text-xs bg-slate-50 rounded-xl px-3 py-2 items-center"
                                                >
                                                    <div className="col-span-2">
                                                        <p className="font-semibold text-slate-900">
                                                            {subject.subject_code || subject.subject_name || `Subject ${index + 1}`}
                                                        </p>
                                                        <p className="text-slate-500">{subject.subject_name}</p>
                                                    </div>
                                                    <div className="text-center font-semibold text-slate-900">
                                                        {typeof subject.marks !== "undefined" ? `${subject.marks} Marks` : "—"}
                                                    </div>
                                                    <div className="text-right font-semibold text-emerald-600">
                                                        {subject.grade || `${subject.credits ?? "—"} Cr`}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {result?.metadata?.description && (
                            <p className="text-xs text-slate-500 border-t border-slate-100 pt-4">
                                {result.metadata.description}
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

