"use client";

import { useMemo } from "react";
import type { CredentialTypeConfig, CredentialFieldConfig } from "@/types/rbac";

interface CertificateDisplayProps {
    certificate: any;
    credentialTypes?: CredentialTypeConfig[];
    onVerify?: (certId: string) => void;
}

function matchType(certType: string, types: CredentialTypeConfig[]): CredentialTypeConfig | null {
    if (!certType || !types?.length) return null;
    const n = certType.toLowerCase().replace(/\s+/g, "_");
    return (
        types.find((t) => t.name === certType) ??
        types.find((t) => t.name.toLowerCase().replace(/\s+/g, "_") === n) ??
        types.find((t) => t.name.toLowerCase().includes(n.replace(/_/g, ""))) ??
        null
    );
}

const STANDARD_META_KEYS = new Set([
    "student_name", "student_email", "issuer_name", "issuer_role", "institution", "department", "course",
    "academic_year", "valid_from", "valid_until", "description", "additional_data", "metadata_hash",
]);
function buildFallbackFromMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
    if (!metadata || typeof metadata !== "object") return {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(metadata)) {
        if (STANDARD_META_KEYS.has(k) || v === undefined) continue;
        if (k === "extra" && v && typeof v === "object") continue;
        if (k === "additional_data" && v && typeof v === "object") continue;
        out[k] = v;
    }
    return out;
}

function DynamicDetailSection({
    extra,
    fields,
    fallback,
}: {
    extra?: Record<string, unknown>;
    fields?: CredentialFieldConfig[];
    fallback?: Record<string, unknown>;
}) {
    const COMMON_LABELS: Record<string, string> = {
        semester: "Semester",
        cgpa: "CGPA",
        grade: "Grade",
        department: "Department",
        course: "Course",
        purpose: "Purpose",
        event_name: "Event name",
        position: "Position",
        description: "Description",
        valid_from: "Valid from",
        valid_until: "Valid until",
    };

    const labelForKey = (key: string): string => {
        const fromField = fields?.find((f) => f.key === key);
        if (fromField) return fromField.label;
        if (COMMON_LABELS[key]) return COMMON_LABELS[key];
        return key
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const data: Record<string, unknown> = { ...(fallback ?? {}), ...(extra ?? {}) };
    if (fields?.length) {
        return (
            <div className="grid grid-cols-2 gap-4 text-sm">
                {fields.map((f) => {
                    const value = data[f.key];
                    const isEmpty = value === undefined || value === null || value === "";
                    return (
                        <div key={f.key} className="border border-gray-200 p-3 bg-gray-50">
                            <dt className="text-xs font-semibold text-gray-600 mb-1">{f.label}</dt>
                            <dd className="text-gray-900">
                                {isEmpty ? "—" : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                            </dd>
                        </div>
                    );
                })}
            </div>
        );
    }
    const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== "");
    if (entries.length === 0) return <p className="text-sm text-gray-500">No additional details recorded.</p>;
    return (
        <div className="grid grid-cols-2 gap-4 text-sm">
            {entries.map(([k, v]) => (
                <div key={k} className="border border-gray-200 p-3 bg-gray-50">
                    <dt className="text-xs font-semibold text-gray-600 mb-1">{labelForKey(k)}</dt>
                    <dd className="text-gray-900">{typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}</dd>
                </div>
            ))}
        </div>
    );
}

export default function CertificateDisplay({ certificate, credentialTypes = [], onVerify }: CertificateDisplayProps) {
    const nftData = certificate?.metadata?.additional_data?.nft || certificate?.metadata?.nft;

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

    const typeConfig = useMemo(
        () => matchType(certificate?.cert_type, credentialTypes),
        [certificate?.cert_type, credentialTypes]
    );
    const certTitle =
        typeConfig?.name ?? certificate?.cert_type?.replace(/_/g, " ").toUpperCase() ?? "CERTIFICATE";
    const ad = certificate?.metadata?.additional_data as { extra?: Record<string, unknown> } | undefined;
    const extra = (certificate?.metadata?.extra ?? ad?.extra) as Record<string, unknown> | undefined;
    const fallback = useMemo(
        () => buildFallbackFromMetadata(certificate?.metadata),
        [certificate?.metadata]
    );
    const hasFields = (typeConfig?.fields?.length ?? 0) > 0;
    const hasData = (extra && Object.keys(extra).length > 0) || Object.keys(fallback).length > 0;
    const hasDynamicDetails = hasFields || hasData;

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
                                {certTitle}
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

                    {/* Credential details (dynamic fields or placeholder) */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                            Credential details
                        </h3>
                        {hasDynamicDetails ? (
                            <DynamicDetailSection
                                extra={extra}
                                fields={typeConfig?.fields}
                                fallback={fallback}
                            />
                        ) : (
                            <p className="text-sm text-gray-500 py-2">No additional details recorded for this credential.</p>
                        )}
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