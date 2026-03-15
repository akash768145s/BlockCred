"use client";

import { useState } from "react";
import CertificateDisplay from "@/components/CertificateDisplay";

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

export default function CertificatesTab({
    certificates,
    certificatesLoading,
    verifying,
    onRefresh,
    onVerify,
}: CertificatesTabProps) {
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

                    return (
                        <div
                            key={certificate.id}
                            className="relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-indigo-100 cursor-pointer overflow-hidden"
                            onClick={() => setSelectedCertificate(certificate)}
                        >
                            {/* SSN Logo Verification Stamp */}
                            <div className="absolute top-2 right-2 z-10 flex flex-col items-center">
                                <div className="bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-xl border-3 border-emerald-500">
                                    <img
                                        src="/ssnlogo.png"
                                        alt="SSN Verified"
                                        className="w-12 h-12 object-contain"
                                    />
                                </div>
                                <div className="mt-1 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold shadow-lg">
                                    VERIFIED
                                </div>
                            </div>

                            {/* NFT Badge */}
                            {isNFT && (
                                <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] tracking-[0.2em] font-semibold px-3 py-1 rounded-full shadow-lg z-10">
                                    NFT
                                </div>
                            )}

                            {/* Certificate Header */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{certificate.title || certificate.cert_type?.replace('_', ' ').toUpperCase()}</h3>
                                            <p className="text-sm text-slate-600">{certificate.institution || certificate.metadata?.institution || 'SSN College of Engineering'}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${certificate.status === 'issued'
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                                        }`}>
                                        ✓ {certificate.status?.toUpperCase() || 'ISSUED'}
                                    </span>
                                </div>

                                {/* Issued Date */}
                                <div className="text-xs text-slate-500 font-medium">
                                    Issued: {new Date(certificate.issued_date || certificate.issued_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            </div>

                            {/* Certificate Preview */}
                            <div className="space-y-2 text-sm">
                                {certificate.metadata?.semester && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Semester</span>
                                        <span className="font-semibold text-slate-900">{certificate.metadata.semester}</span>
                                    </div>
                                )}
                                {certificate.metadata?.cgpa && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">CGPA</span>
                                        <span className="font-bold text-emerald-600 text-lg">{certificate.metadata.cgpa}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

