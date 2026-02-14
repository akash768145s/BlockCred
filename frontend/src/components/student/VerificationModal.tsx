'use client';

import React from 'react';

interface VerificationResult {
    is_valid: boolean;
    cert_id?: string;
    cert_type?: string;
    status?: string;
    issued_at?: string;
    ipfs_url?: string;
    ipfs_cid?: string;
    signature_verified?: boolean;
    error_message?: string;
    metadata?: {
        student_name?: string;
        issuer_name?: string;
    };
    // Blockchain & storage (shown only in verify modal)
    tx_hash?: string;
    block_number?: number;
    file_hash?: string;
    metadata_hash?: string;
    student_wallet?: string;
    issuer_wallet?: string;
}

interface VerificationModalProps {
    verificationResult: VerificationResult | null;
    onClose: () => void;
}

function truncate(str: string | undefined, len = 16): string {
    if (!str) return 'N/A';
    if (str.length <= len * 2) return str;
    return `${str.slice(0, len)}...${str.slice(-len)}`;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ verificationResult, onClose }) => {
    if (!verificationResult) return null;

    const valid = verificationResult.is_valid;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className={`p-6 border-b border-slate-600 ${
                        valid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {valid ? (
                                <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-400/40">
                                    <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center border border-red-400/40">
                                    <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                            <div>
                                <h3 className={`text-xl font-bold ${valid ? 'text-emerald-200' : 'text-red-200'}`}>
                                    {valid ? 'Certificate verified' : 'Verification failed'}
                                </h3>
                                <p className="text-sm text-slate-400 mt-0.5">
                                    {valid
                                        ? verificationResult.signature_verified
                                            ? 'Cryptographically verified'
                                            : 'Verified'
                                        : verificationResult.error_message || 'Verification failed'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {valid && (
                    <div className="p-6 space-y-6">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Student</div>
                                <div className="text-sm font-medium text-white">
                                    {verificationResult.metadata?.student_name ?? 'N/A'}
                                </div>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Issuer</div>
                                <div className="text-sm font-medium text-white">
                                    {verificationResult.metadata?.issuer_name ?? 'N/A'}
                                </div>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Type</div>
                                <div className="text-sm font-medium text-white">
                                    {verificationResult.cert_type?.replace(/_/g, ' ').toUpperCase() ?? 'N/A'}
                                </div>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Status</div>
                                <div className="text-sm font-medium text-emerald-400">
                                    {verificationResult.status ?? 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* Blockchain & storage */}
                        <div className="border border-slate-600 rounded-xl overflow-hidden bg-slate-900/50">
                            <div className="px-4 py-3 border-b border-slate-600 bg-slate-800/50">
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Blockchain & storage
                                </h4>
                            </div>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <Row label="Credential hash" value={truncate(verificationResult.file_hash, 12)} mono />
                                <Row label="Metadata hash" value={truncate(String(verificationResult.metadata_hash ?? ''), 12)} mono />
                                <Row label="Transaction hash" value={truncate(verificationResult.tx_hash, 12)} mono />
                                <Row label="Block number" value={verificationResult.block_number != null ? `#${verificationResult.block_number}` : 'N/A'} />
                                <Row label="Student wallet" value={truncate(String(verificationResult.student_wallet ?? ''), 12)} mono />
                                <Row label="Issuer address" value={truncate(String(verificationResult.issuer_wallet ?? ''), 12)} mono />
                                <Row label="IPFS content ID" value={truncate(verificationResult.ipfs_cid ?? '', 12)} mono />
                                <div className="sm:col-span-2">
                                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Certificate document</div>
                                    {verificationResult.ipfs_url ? (
                                        <a
                                            href={verificationResult.ipfs_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                            </svg>
                                            View on IPFS
                                        </a>
                                    ) : (
                                        <span className="text-slate-500 text-sm">Not available</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-500 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {!valid && (
                    <div className="p-6 flex justify-center">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg bg-slate-600 text-white text-sm font-medium hover:bg-slate-500 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

function Row({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-sm text-slate-200 break-all ${mono ? 'font-mono text-xs' : ''}`}>
                {value}
            </div>
        </div>
    );
}
