'use client';

import React, { useState } from 'react';
import CertificateDisplay from '@/components/CertificateDisplay';

interface Certificate {
    id: string;
    cert_id: string;
    cert_type: string;
    title?: string;
    institution?: string;
    status: string;
    issued_date?: string;
    issued_at?: string;
    metadata?: any;
    additional_data?: any;
}

interface CertificatesTabProps {
    certificates: Certificate[];
    certificatesLoading: boolean;
    verifying: boolean;
    onRefresh: () => void;
    onVerify: (certId: string, e?: React.MouseEvent) => void;
}

export const CertificatesTab: React.FC<CertificatesTabProps> = ({
    certificates,
    certificatesLoading,
    verifying,
    onRefresh,
    onVerify,
}) => {
    const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

    if (certificatesLoading) {
        return (
            <div className="rounded-3xl bg-white/10 border border-white/10 backdrop-blur-lg shadow-2xl p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto"></div>
                <p className="mt-4 text-indigo-200">Loading certificates...</p>
            </div>
        );
    }

    if (!certificates || certificates.length === 0) {
        return (
            <div className="rounded-3xl bg-white/10 border border-white/10 backdrop-blur-lg shadow-2xl p-8 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Certificates Yet</h3>
                <p className="text-indigo-200">
                    Your certificates will appear here once they are issued by institutions.
                </p>
            </div>
        );
    }

    if (selectedCertificate) {
        return (
            <div className="space-y-4">
                <button
                    onClick={() => setSelectedCertificate(null)}
                    className="text-indigo-300 hover:text-white font-semibold flex items-center transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Certificates
                </button>
                <CertificateDisplay
                    certificate={selectedCertificate}
                    onVerify={onVerify}
                />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <h2 className="text-xl font-semibold text-white mt-1">My Certificates</h2>
                </div>
                <button
                    onClick={onRefresh}
                    className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-2xl hover:bg-white/20 transition-all text-sm font-semibold"
                >
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((certificate) => {
                    const nftData = certificate?.metadata?.additional_data?.nft;
                    const isNFT = certificate?.cert_type === 'nft_certificate' || !!nftData;
                    const certTitle = certificate.title || certificate.cert_type?.replace('_', ' ').toUpperCase() || 'CERTIFICATE';
                    const institution = certificate.institution || certificate.metadata?.institution || 'SSN College of Engineering';
                    const issuedDate = certificate.issued_date || certificate.issued_at;
                    const formattedDate = issuedDate ? new Date(issuedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : '';

                    return (
                        <div
                            key={certificate.id}
                            className="relative bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 p-6 border border-gray-200 cursor-pointer overflow-hidden group"
                            onClick={() => setSelectedCertificate(certificate)}
                        >
                            {/* NFT Badge */}
                            {isNFT && (
                                <div className="absolute top-3 left-3 bg-purple-600 text-white text-[9px] tracking-[0.2em] font-bold px-2.5 py-1 rounded-full shadow-lg z-20">
                                    NFT
                                </div>
                            )}

                            {/* Certificate Content */}
                            <div className="flex items-start gap-4 mb-4">
                                {/* SSN Logo Icon - No Background */}
                                <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 p-2">
                                    <img
                                        src="/ssnlogo.png"
                                        alt="SSN"
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                {/* Certificate Title and Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-2xl text-gray-800 mb-1 leading-tight">{certTitle}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{institution}</p>
                                    {formattedDate && (
                                        <p className="text-xs text-gray-500">Issued: {formattedDate}</p>
                                    )}
                                </div>
                            </div>

                            {/* Academic Details */}
                            <div className="space-y-3">
                                {certificate.metadata?.semester && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500 font-medium">Semester</span>
                                        <span className="text-2xl font-bold text-emerald-600">{certificate.metadata.semester}</span>
                                    </div>
                                )}
                                {certificate.metadata?.cgpa && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500 font-medium">CGPA</span>
                                        <span className="text-2xl font-bold text-emerald-600">{certificate.metadata.cgpa}</span>
                                    </div>
                                )}
                            </div>

                            {/* Hover Effect Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

