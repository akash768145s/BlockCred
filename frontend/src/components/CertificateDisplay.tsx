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
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-slate-200 relative">
            {/* SSN Logo Watermark/Stamp - Blockchain Verified */}
            <div className="absolute top-8 right-8 z-10 flex flex-col items-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-xl border-4 border-emerald-500">
                    <img 
                        src="/ssnlogo.png" 
                        alt="SSN Logo" 
                        className="w-20 h-20 object-contain"
                    />
                </div>
                <div className="mt-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    BLOCKCHAIN VERIFIED
                </div>
            </div>

            {/* Certificate Header */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white p-8 relative overflow-hidden border-b-4 border-slate-600">
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                    }}></div>
                </div>
                <div className="relative z-10">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="mb-2">
                                <h1 className="text-4xl font-black tracking-tight mb-2">
                                    {certificate?.cert_type?.replace(/_/g, " ").toUpperCase() || "CERTIFICATE"}
                                </h1>
                                <div className="h-1 w-24 bg-emerald-400 rounded-full"></div>
                            </div>
                            <p className="text-xl font-semibold text-slate-200 mt-4">
                                    {certificate?.metadata?.institution || "SSN College of Engineering"}
                                </p>
                            </div>
                        <div className="text-right ml-6">
                            <div className="bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg border-2 border-emerald-400">
                                <div className="text-xs uppercase tracking-wider mb-1">Status</div>
                                <div className="text-2xl font-black">
                                    {certificate?.status === "issued" ? "✓ ISSUED" : certificate?.status?.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8 bg-gradient-to-b from-white to-slate-50">
                {/* Certificate Details Section */}
                <div className="border-l-4 border-emerald-500 pl-6 py-4 bg-emerald-50/50 rounded-r-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Student Name</div>
                            <div className="text-xl font-bold text-slate-900">
                                {certificate?.metadata?.student_name || "N/A"}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Issued By</div>
                            <div className="text-lg font-semibold text-slate-800">
                                {certificate?.metadata?.issuer_name || "N/A"}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Issue Date</div>
                            <div className="text-lg font-medium text-slate-700">
                                {certificate?.issued_at ? formatDate(certificate.issued_at) : "N/A"}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Certificate ID</div>
                            <div className="font-mono text-sm text-slate-700 break-all">
                                {certificate?.cert_id ? truncateHash(certificate.cert_id, 20) : "N/A"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ON-CHAIN DATA SECTION */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-300 shadow-sm">
                    <div className="flex items-center mb-5">
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">🔗 Blockchain Verification</h3>
                            <p className="text-sm text-slate-600">On-Chain Data (Immutable Record)</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-emerald-600 border-t-transparent"></div>
                            <p className="mt-3 text-sm text-slate-600 font-medium">Loading blockchain data...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Credential Hash */}
                            <div className="bg-white rounded-lg p-4 border-2 border-emerald-200 shadow-sm">
                                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Credential Hash</div>
                                <div className="font-mono text-xs text-slate-800 break-all bg-slate-50 p-2 rounded">
                                    {certificate?.file_hash ? truncateHash(certificate.file_hash, 20) : "N/A"}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">SHA-256</div>
                            </div>

                            {/* Metadata Hash */}
                            <div className="bg-white rounded-lg p-4 border-2 border-emerald-200 shadow-sm">
                                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Metadata Hash</div>
                                <div className="font-mono text-xs text-slate-800 break-all bg-slate-50 p-2 rounded">
                                    {certificate?.metadata?.additional_data?.metadata_hash 
                                        ? truncateHash(certificate.metadata.additional_data.metadata_hash, 20)
                                        : "N/A"}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">SHA-256</div>
                            </div>

                            {/* Transaction Hash */}
                            <div className="bg-white rounded-lg p-4 border-2 border-emerald-200 shadow-sm">
                                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Transaction Hash</div>
                                <div className="font-mono text-xs text-slate-800 break-all bg-slate-50 p-2 rounded">
                                    {certificate?.tx_hash ? truncateHash(certificate.tx_hash, 20) : "N/A"}
                                </div>
                            </div>

                            {/* Block Number */}
                            <div className="bg-white rounded-lg p-4 border-2 border-emerald-200 shadow-sm">
                                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Block Number</div>
                                <div className="text-lg font-bold text-emerald-600">
                                    {certificate?.block_number ? `#${certificate.block_number}` : "N/A"}
                                </div>
                            </div>

                            {/* Student Wallet */}
                            <div className="bg-white rounded-lg p-4 border-2 border-emerald-200 shadow-sm">
                                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Student Wallet</div>
                                <div className="font-mono text-xs text-slate-800 break-all bg-slate-50 p-2 rounded">
                                    {certificate?.metadata?.additional_data?.student_wallet 
                                        ? truncateHash(certificate.metadata.additional_data.student_wallet, 20)
                                        : "N/A"}
                                </div>
                            </div>

                            {/* Issuer Address */}
                            <div className="bg-white rounded-lg p-4 border-2 border-emerald-200 shadow-sm">
                                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Issuer Address</div>
                                <div className="font-mono text-xs text-slate-800 break-all bg-slate-50 p-2 rounded">
                                    {certificate?.metadata?.additional_data?.issuer_wallet 
                                        ? truncateHash(certificate.metadata.additional_data.issuer_wallet, 20)
                                        : "N/A"}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* OFF-CHAIN DATA SECTION */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-300 shadow-sm">
                    <div className="flex items-center mb-5">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">📄 Off-Chain Storage</h3>
                            <p className="text-sm text-slate-600">MongoDB + IPFS (Decentralized)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Certificate PDF */}
                        <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Certificate Document</div>
                            {certificate?.ipfs_url ? (
                                <a
                                    href={certificate.ipfs_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    View on IPFS
                                </a>
                            ) : (
                                <span className="text-slate-400 text-sm">Not available</span>
                            )}
                        </div>

                        {/* IPFS CID */}
                        <div className="bg-white rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                            <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">IPFS Content ID</div>
                            <div className="font-mono text-xs text-slate-800 break-all bg-slate-50 p-2 rounded">
                                {certificate?.ipfs_cid ? truncateHash(certificate.ipfs_cid, 20) : "N/A"}
                            </div>
                        </div>
                            </div>
                        </div>

                {/* NFT DATA SECTION */}
                {nftData && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3 text-white font-bold">
                                NFT
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">🌐 NFT Metadata</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                                <div className="text-xs text-gray-500 mb-1">Collection</div>
                            <div className="text-sm font-semibold text-gray-800">
                                    {nftData.collection || "BlockCred Academic"}
                            </div>
                        </div>
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                                <div className="text-xs text-gray-500 mb-1">Token Standard</div>
                            <div className="text-sm font-semibold text-gray-800">
                                    {nftData.token_standard || "ERC-721"}
                            </div>
                        </div>
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                                <div className="text-xs text-gray-500 mb-1">Chain</div>
                                <div className="text-sm font-semibold text-gray-800">
                                    {nftData.chain || "Hyperledger Besu"}
                            </div>
                        </div>
                            {nftData.display_image && (
                                <div className="bg-white rounded-lg p-4 border border-purple-200 flex flex-col">
                                    <div className="text-xs text-gray-500 mb-2">Artwork Preview</div>
                                    <img
                                        src={nftData.display_image}
                                        alt="NFT Artwork"
                                        className="rounded-lg border border-slate-100"
                                    />
                                </div>
                            )}
                            {nftData.external_url && (
                                <div className="bg-white rounded-lg p-4 border border-purple-200">
                                    <div className="text-xs text-gray-500 mb-1">External URL</div>
                                    <a
                                        href={nftData.external_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-purple-600 font-semibold underline"
                                    >
                                        {nftData.external_url}
                                    </a>
                                </div>
                            )}
                            {Array.isArray(nftData.attributes) && nftData.attributes.length > 0 && (
                                <div className="bg-white rounded-lg p-4 border border-purple-200 md:col-span-2">
                                    <div className="text-xs text-gray-500 mb-2">Attributes</div>
                                    <div className="flex flex-wrap gap-2">
                                        {nftData.attributes.map((attr: any, index: number) => (
                                            <span
                                                key={`${attr?.trait_type}-${index}`}
                                                className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-100"
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
                    <div className="flex justify-center pt-4 border-t-2 border-slate-200">
                        <button
                            onClick={() => onVerify(certificate.cert_id)}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-10 py-4 rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 font-bold text-lg flex items-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Verify Certificate on Blockchain</span>
                        </button>
                    </div>
                )}
            </div>
            
            {/* Footer with SSN branding */}
            <div className="bg-slate-800 text-white p-4 text-center text-xs">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <img src="/ssnlogo.png" alt="SSN" className="h-4 object-contain opacity-80" />
                    <span className="font-semibold">SSN College of Engineering</span>
                </div>
                <div className="text-slate-400">Blockchain-Verified Digital Credentials</div>
            </div>
        </div>
    );
}

