'use client';

import React from 'react';

interface VerificationResult {
    is_valid: boolean;
    cert_id?: string;
    cert_type?: string;
    status?: string;
    issued_at?: string;
    tx_hash?: string;
    block_number?: number;
    ipfs_url?: string;
    signature_verified?: boolean;
    error_message?: string;
    metadata?: {
        student_name?: string;
        issuer_name?: string;
    };
}

interface VerificationModalProps {
    verificationResult: VerificationResult | null;
    onClose: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ verificationResult, onClose }) => {
    if (!verificationResult) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-indigo-100" onClick={(e) => e.stopPropagation()}>
                <div className={`p-6 border-b-4 ${verificationResult.is_valid ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {verificationResult.is_valid ? (
                                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                            <div>
                                <h3 className={`text-2xl font-bold ${verificationResult.is_valid ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {verificationResult.is_valid ? 'Certificate Verified' : 'Verification Failed'}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {verificationResult.is_valid
                                        ? (verificationResult.signature_verified
                                            ? 'This certificate is valid and cryptographically verified'
                                            : 'This certificate is valid and verified on the blockchain')
                                        : verificationResult.error_message || 'Certificate verification failed'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {verificationResult.is_valid && (
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-lg p-4">
                                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">Student Name</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {verificationResult.metadata?.student_name || 'N/A'}
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">Issuer</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {verificationResult.metadata?.issuer_name || 'N/A'}
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">Certificate Type</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {verificationResult.cert_type?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">Status</div>
                                <div className="text-lg font-semibold text-emerald-600">
                                    {verificationResult.status?.toUpperCase() || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50 rounded-lg p-4 border-2 border-emerald-200">
                            <div className="text-xs uppercase tracking-wide text-emerald-700 font-semibold mb-3">🔗 Blockchain Details</div>
                            <div className="grid grid-cols-1 gap-3 text-sm">
                                {verificationResult.cert_id && (
                                    <div className="bg-white rounded-lg p-3 border border-emerald-200">
                                        <span className="text-gray-600 font-medium">Certificate ID:</span>
                                        <div className="font-mono text-xs text-gray-800 break-all mt-1 bg-gray-50 px-2 py-1 rounded">
                                            {verificationResult.cert_id}
                                        </div>
                                    </div>
                                )}
                                {verificationResult.tx_hash && (
                                    <div className="bg-white rounded-lg p-3 border border-emerald-200">
                                        <span className="text-gray-600 font-medium">Transaction Hash:</span>
                                        <div className="font-mono text-xs text-gray-800 break-all mt-1 bg-gray-50 px-2 py-1 rounded">
                                            {verificationResult.tx_hash}
                                        </div>
                                    </div>
                                )}
                                {verificationResult.block_number && (
                                    <div className="bg-white rounded-lg p-3 border border-emerald-200">
                                        <span className="text-gray-600 font-medium">Block Number:</span>
                                        <div className="font-semibold text-gray-800 mt-1">
                                            #{verificationResult.block_number}
                                        </div>
                                    </div>
                                )}
                                {verificationResult.ipfs_url && (
                                    <div className="bg-white rounded-lg p-3 border border-emerald-200">
                                        <span className="text-gray-600 font-medium">IPFS Storage:</span>
                                        <div className="mt-1">
                                            <a
                                                href={verificationResult.ipfs_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline flex items-center"
                                            >
                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                                View Certificate on IPFS
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {verificationResult.issued_at && (
                                    <div className="bg-white rounded-lg p-3 border border-emerald-200">
                                        <span className="text-gray-600 font-medium">Issued At:</span>
                                        <div className="text-gray-800 mt-1">
                                            {new Date(verificationResult.issued_at).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <button
                                onClick={onClose}
                                className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

