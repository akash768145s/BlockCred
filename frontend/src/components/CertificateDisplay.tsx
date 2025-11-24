"use client";

import { useState, useEffect } from "react";

interface CertificateDisplayProps {
    certificate: any;
    onVerify?: (certId: string) => void;
}

export default function CertificateDisplay({ certificate, onVerify }: CertificateDisplayProps) {
    const [onChainData, setOnChainData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const nftData = certificate?.metadata?.additional_data?.nft || certificate?.metadata?.nft;

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
        <div className="max-w-5xl mx-auto bg-white shadow-lg border border-gray-300">
            {/* Decorative Border */}
            <div className="border-8 border-double border-gray-800 m-4">
                <div className="border-2 border-gray-700 p-8">
                    
                    {/* Header with Institution Logo */}
                    <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-300">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                                <img 
                                    src="/ssnlogo.png" 
                                    alt="SSN Logo" 
                                    className="w-16 h-16 object-contain"
                                />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {certificate?.metadata?.institution || "SSN College of Engineering"}
                                    </h2>
                                    <p className="text-sm text-gray-600">Blockchain-Verified Digital Credential</p>
                                </div>
                            </div>
                            <h1 className="text-3xl font-serif font-bold text-center text-gray-900 tracking-wide">
                                {certificate?.cert_type?.replace(/_/g, " ").toUpperCase() || "CERTIFICATE"}
                            </h1>
                        </div>
                    </div>

                    {/* Certificate Details */}
                    <div className="mb-8 space-y-6">
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">This certifies that</p>
                            <p className="text-3xl font-serif font-bold text-gray-900 mb-4">
                                {certificate?.metadata?.student_name || "N/A"}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 py-4 border-y border-gray-200">
                            <div>
                                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Certificate ID</dt>
                                <dd className="text-sm font-mono text-gray-900">{certificate?.cert_id ? truncateHash(certificate.cert_id, 20) : "N/A"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date of Issue</dt>
                                <dd className="text-sm text-gray-900">{certificate?.issued_at ? formatDate(certificate.issued_at) : "N/A"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Issued By</dt>
                                <dd className="text-sm text-gray-900">{certificate?.metadata?.issuer_name || "N/A"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</dt>
                                <dd className="text-sm font-semibold text-gray-900">
                                    {certificate?.status === "issued" ? "Issued" : certificate?.status || "N/A"}
                                </dd>
                            </div>
                        </div>
                    </div>

                    {/* Blockchain Verification Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Blockchain Verification
                        </h3>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
                                <p className="mt-3 text-sm text-gray-600">Loading verification data...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="border border-gray-200 p-3 bg-gray-50">
                                    <dt className="text-xs font-semibold text-gray-600 mb-1">Credential Hash</dt>
                                    <dd className="font-mono text-xs text-gray-900 break-all">
                                        {certificate?.file_hash ? truncateHash(certificate.file_hash, 16) : "N/A"}
                                    </dd>
                                </div>
                                <div className="border border-gray-200 p-3 bg-gray-50">
                                    <dt className="text-xs font-semibold text-gray-600 mb-1">Metadata Hash</dt>
                                    <dd className="font-mono text-xs text-gray-900 break-all">
                                        {certificate?.metadata?.additional_data?.metadata_hash 
                                            ? truncateHash(certificate.metadata.additional_data.metadata_hash, 16)
                                            : "N/A"}
                                    </dd>
                                </div>
                                <div className="border border-gray-200 p-3 bg-gray-50">
                                    <dt className="text-xs font-semibold text-gray-600 mb-1">Transaction Hash</dt>
                                    <dd className="font-mono text-xs text-gray-900 break-all">
                                        {certificate?.tx_hash ? truncateHash(certificate.tx_hash, 16) : "N/A"}
                                    </dd>
                                </div>
                                <div className="border border-gray-200 p-3 bg-gray-50">
                                    <dt className="text-xs font-semibold text-gray-600 mb-1">Block Number</dt>
                                    <dd className="font-semibold text-gray-900">
                                        {certificate?.block_number ? `#${certificate.block_number}` : "N/A"}
                                    </dd>
                                </div>
                                <div className="border border-gray-200 p-3 bg-gray-50">
                                    <dt className="text-xs font-semibold text-gray-600 mb-1">Student Wallet</dt>
                                    <dd className="font-mono text-xs text-gray-900 break-all">
                                        {certificate?.metadata?.additional_data?.student_wallet 
                                            ? truncateHash(certificate.metadata.additional_data.student_wallet, 16)
                                            : "N/A"}
                                    </dd>
                                </div>
                                <div className="border border-gray-200 p-3 bg-gray-50">
                                    <dt className="text-xs font-semibold text-gray-600 mb-1">Issuer Address</dt>
                                    <dd className="font-mono text-xs text-gray-900 break-all">
                                        {certificate?.metadata?.additional_data?.issuer_wallet 
                                            ? truncateHash(certificate.metadata.additional_data.issuer_wallet, 16)
                                            : "N/A"}
                                    </dd>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Document Storage Section */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                            </svg>
                            Document Storage
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="border border-gray-200 p-3 bg-gray-50">
                                <dt className="text-xs font-semibold text-gray-600 mb-1">IPFS Content ID</dt>
                                <dd className="font-mono text-xs text-gray-900 break-all">
                                    {certificate?.ipfs_cid ? truncateHash(certificate.ipfs_cid, 16) : "N/A"}
                                </dd>
                            </div>
                            <div className="border border-gray-200 p-3 bg-gray-50">
                                <dt className="text-xs font-semibold text-gray-600 mb-2">Certificate Document</dt>
                                {certificate?.ipfs_url ? (
                                    <a
                                        href={certificate.ipfs_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-blue-700 hover:text-blue-900 font-medium underline text-xs"
                                    >
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                        </svg>
                                        View on IPFS
                                    </a>
                                ) : (
                                    <span className="text-gray-400 text-xs">Not available</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* NFT Metadata Section */}
                    {nftData && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">NFT Metadata</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="border border-gray-200 p-3 bg-gray-50">
                                    <dt className="text-xs font-semibold text-gray-600 mb-1">Collection</dt>
                                    <dd className="text-gray-900">{nftData.collection || "BlockCred Academic"}</dd>
                                </div>
                                <div className="border border-gray-200 p-3 bg-gray-50">
                                    <dt className="text-xs font-semibold text-gray-600 mb-1">Token Standard</dt>
                                    <dd className="text-gray-900">{nftData.token_standard || "ERC-721"}</dd>
                                </div>
                                <div className="border border-gray-200 p-3 bg-gray-50">
                                    <dt className="text-xs font-semibold text-gray-600 mb-1">Blockchain Network</dt>
                                    <dd className="text-gray-900">{nftData.chain || "Hyperledger Besu"}</dd>
                                </div>
                                {nftData.external_url && (
                                    <div className="border border-gray-200 p-3 bg-gray-50">
                                        <dt className="text-xs font-semibold text-gray-600 mb-1">External URL</dt>
                                        <a
                                            href={nftData.external_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-700 hover:text-blue-900 font-medium underline text-xs break-all"
                                        >
                                            {nftData.external_url}
                                        </a>
                                    </div>
                                )}
                                {Array.isArray(nftData.attributes) && nftData.attributes.length > 0 && (
                                    <div className="border border-gray-200 p-3 bg-gray-50 col-span-2">
                                        <dt className="text-xs font-semibold text-gray-600 mb-2">Attributes</dt>
                                        <div className="flex flex-wrap gap-2">
                                            {nftData.attributes.map((attr: any, index: number) => (
                                                <span
                                                    key={`${attr?.trait_type}-${index}`}
                                                    className="px-2 py-1 bg-white border border-gray-300 text-gray-700 text-xs"
                                                >
                                                    {attr?.trait_type}: {attr?.value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Verification Button */}
                    {certificate?.cert_id && onVerify && (
                        <div className="flex justify-center pt-6 border-t border-gray-300">
                            <button
                                onClick={() => onVerify(certificate.cert_id)}
                                className="bg-gray-900 text-white px-8 py-3 hover:bg-gray-800 transition-colors font-semibold flex items-center gap-2 border-2 border-gray-900"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verify Certificate
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-900 text-white py-4 px-8">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <img src="/ssnlogo.png" alt="SSN" className="h-6 object-contain" />
                        <span>SSN College of Engineering</span>
                    </div>
                    <span className="text-gray-400">Blockchain-Verified Credential System</span>
                </div>
            </div>
        </div>
    );
}