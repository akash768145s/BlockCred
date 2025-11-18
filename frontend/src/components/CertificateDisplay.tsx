"use client";

import { useState, useEffect } from "react";

interface CertificateDisplayProps {
    certificate: any;
    onVerify?: (certId: string) => void;
}

export default function CertificateDisplay({ certificate, onVerify }: CertificateDisplayProps) {
    const [onChainData, setOnChainData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (certificate?.cert_id) {
            fetchOnChainData(certificate.cert_id);
        }
    }, [certificate?.cert_id]);

    const fetchOnChainData = async (certId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/blockchain/certificate?cert_id=${certId}`);
            if (response.ok) {
                const data = await response.json();
                setOnChainData(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch on-chain data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string | Date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const truncateHash = (hash: string, length: number = 12) => {
        if (!hash) return "N/A";
        return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
    };

    return (
        <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-2xl shadow-2xl overflow-hidden border-2 border-blue-200">
            {/* Certificate Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {certificate?.cert_type?.replace(/_/g, " ").toUpperCase() || "CERTIFICATE"}
                                </h2>
                                <p className="text-blue-100 text-sm">
                                    {certificate?.metadata?.institution || "SSN College of Engineering"}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2">
                                <div className="text-xs text-blue-100">Status</div>
                                <div className="text-lg font-bold">
                                    {certificate?.status === "issued" ? "✓ ISSUED" : certificate?.status?.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* ON-CHAIN DATA SECTION */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">🔗 On-Chain Data (Blockchain)</h3>
                    </div>

                    {loading ? (
                        <div className="text-center py-4">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            <p className="mt-2 text-sm text-gray-600">Loading blockchain data...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Credential Hash */}
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="text-xs text-gray-500 mb-1">Credential Hash (SHA-256)</div>
                                <div className="font-mono text-sm text-gray-800 break-all">
                                    {certificate?.file_hash ? truncateHash(certificate.file_hash, 16) : "N/A"}
                                </div>
                            </div>

                            {/* Metadata Hash */}
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="text-xs text-gray-500 mb-1">Metadata Hash (SHA-256)</div>
                                <div className="font-mono text-sm text-gray-800 break-all">
                                    {certificate?.metadata?.additional_data?.metadata_hash 
                                        ? truncateHash(certificate.metadata.additional_data.metadata_hash, 16)
                                        : "N/A"}
                                </div>
                            </div>

                            {/* Issuer Address */}
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="text-xs text-gray-500 mb-1">Issuer Address</div>
                                <div className="font-mono text-sm text-gray-800 break-all">
                                    {certificate?.metadata?.additional_data?.issuer_wallet 
                                        ? truncateHash(certificate.metadata.additional_data.issuer_wallet, 16)
                                        : "N/A"}
                                </div>
                            </div>

                            {/* Student Wallet */}
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="text-xs text-gray-500 mb-1">Student Wallet</div>
                                <div className="font-mono text-sm text-gray-800 break-all">
                                    {certificate?.metadata?.additional_data?.student_wallet 
                                        ? truncateHash(certificate.metadata.additional_data.student_wallet, 16)
                                        : "N/A"}
                                </div>
                            </div>

                            {/* Transaction Hash */}
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="text-xs text-gray-500 mb-1">Transaction Hash</div>
                                <div className="font-mono text-sm text-gray-800 break-all">
                                    {certificate?.tx_hash ? truncateHash(certificate.tx_hash, 16) : "N/A"}
                                </div>
                            </div>

                            {/* Block Number */}
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="text-xs text-gray-500 mb-1">Block Number</div>
                                <div className="font-semibold text-gray-800">
                                    {certificate?.block_number ? `#${certificate.block_number}` : "N/A"}
                                </div>
                            </div>

                            {/* Timestamp */}
                            <div className="bg-white rounded-lg p-4 border border-green-200 md:col-span-2">
                                <div className="text-xs text-gray-500 mb-1">Timestamp (On-Chain)</div>
                                <div className="text-sm text-gray-800">
                                    {certificate?.issued_at ? formatDate(certificate.issued_at) : "N/A"}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* OFF-CHAIN DATA SECTION */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">📄 Off-Chain Data (MongoDB + IPFS)</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Certificate PDF */}
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <div className="text-xs text-gray-500 mb-2">Certificate PDF (IPFS)</div>
                            {certificate?.ipfs_url ? (
                                <a
                                    href={certificate.ipfs_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    View Certificate
                                </a>
                            ) : (
                                <span className="text-gray-400 text-sm">Not available</span>
                            )}
                        </div>

                        {/* IPFS CID */}
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <div className="text-xs text-gray-500 mb-1">IPFS CID</div>
                            <div className="font-mono text-sm text-gray-800 break-all">
                                {certificate?.ipfs_cid ? truncateHash(certificate.ipfs_cid, 16) : "N/A"}
                            </div>
                        </div>

                        {/* Student Info */}
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <div className="text-xs text-gray-500 mb-1">Student Name</div>
                            <div className="text-sm font-semibold text-gray-800">
                                {certificate?.metadata?.student_name || "N/A"}
                            </div>
                        </div>

                        {/* Issuer Info */}
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <div className="text-xs text-gray-500 mb-1">Issuer Name</div>
                            <div className="text-sm font-semibold text-gray-800">
                                {certificate?.metadata?.issuer_name || "N/A"}
                            </div>
                        </div>

                        {/* Certificate ID */}
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <div className="text-xs text-gray-500 mb-1">Certificate ID</div>
                            <div className="font-mono text-sm text-gray-800 break-all">
                                {certificate?.cert_id ? truncateHash(certificate.cert_id, 16) : "N/A"}
                            </div>
                        </div>

                        {/* Issued Date */}
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <div className="text-xs text-gray-500 mb-1">Issued Date</div>
                            <div className="text-sm text-gray-800">
                                {certificate?.issued_at ? formatDate(certificate.issued_at) : "N/A"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Verification Button */}
                {certificate?.cert_id && onVerify && (
                    <div className="flex justify-center">
                        <button
                            onClick={() => onVerify(certificate.cert_id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold text-lg flex items-center space-x-2 shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Verify on Blockchain</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

