"use client";

import { useState, useEffect } from "react";
import CertificateDisplay from "@/components/CertificateDisplay";
import { adminService } from "@/services/adminService";
import type { CredentialTypeConfig, CredentialFieldConfig } from "@/types/rbac";

interface Certificate {
    id: string;
    cert_id: string;
    cert_type: string;
    title?: string;
    institution?: string;
    status: string;
    issued_date?: string;
    issued_at?: string;
    metadata?: {
        student_name?: string;
        institution?: string;
        semester?: string;
        cgpa?: number | string;
        extra?: Record<string, unknown>;
        [key: string]: unknown;
    };
}

interface CertificatesTabProps {
    certificates: Certificate[];
    certificatesLoading: boolean;
    verifying: boolean;
    onRefresh: () => void;
    onVerify: (certId: string, e?: React.MouseEvent) => void;
}

const CARD_STANDARD_META_KEYS = new Set([
    "student_name", "student_email", "issuer_name", "issuer_role", "institution", "department", "course",
    "academic_year", "valid_from", "valid_until", "description", "additional_data", "metadata_hash",
]);
function buildFallbackFromMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
    if (!metadata || typeof metadata !== "object") return {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(metadata)) {
        if (CARD_STANDARD_META_KEYS.has(k) || v === undefined) continue;
        if (k === "extra" && v && typeof v === "object") continue;
        if (k === "additional_data" && v && typeof v === "object") continue;
        out[k] = v;
    }
    return out;
}

function matchCredentialType(certType: string, types: CredentialTypeConfig[]): CredentialTypeConfig | null {
    if (!certType || !types?.length) return null;
    const normalized = certType.toLowerCase().replace(/\s+/g, "_");
    return (
        types.find((t) => t.name === certType) ??
        types.find((t) => t.name.toLowerCase().replace(/\s+/g, "_") === normalized) ??
        types.find((t) => t.name.toLowerCase().includes(normalized.replace(/_/g, ""))) ??
        null
    );
}

function DynamicFields({
    extra,
    fields,
    fallbackMetadata,
    dark = false,
}: {
    extra?: Record<string, unknown>;
    fields?: CredentialFieldConfig[];
    fallbackMetadata?: Record<string, unknown>;
    dark?: boolean;
}) {
    const data = extra ?? fallbackMetadata ?? {};
    const labelCls = dark ? "text-slate-400" : "text-slate-500";
    const valueCls = dark ? "text-slate-200 font-medium" : "font-medium text-slate-800";
    if (fields?.length) {
        return (
            <div className="space-y-2">
                {fields.map((f) => {
                    const value = data[f.key];
                    if (value === undefined || value === null || value === "") return null;
                    return (
                        <div key={f.key} className="flex justify-between items-center text-sm gap-2">
                            <span className={labelCls}>{f.label}</span>
                            <span className={`${valueCls} truncate max-w-[60%] text-right`}>
                                {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    }
    return (
        <div className="space-y-2">
            {Object.entries(data).map(
                ([k, v]) =>
                    v !== undefined &&
                    v !== null &&
                    v !== "" && (
                        <div key={k} className="flex justify-between items-center text-sm gap-2">
                            <span className={`${labelCls} capitalize`}>{k.replace(/_/g, " ")}</span>
                            <span className={`${valueCls} truncate max-w-[60%] text-right`}>
                                {typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}
                            </span>
                        </div>
                    )
            )}
        </div>
    );
}

export default function CertificatesTab({
    certificates,
    certificatesLoading,
    verifying,
    onRefresh,
    onVerify,
}: CertificatesTabProps) {
    const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
    const [credentialTypes, setCredentialTypes] = useState<CredentialTypeConfig[]>([]);

    useEffect(() => {
        adminService
            .listPublicCredentialTypes()
            .then((data) => setCredentialTypes(Array.isArray(data) ? data : []))
            .catch(() => setCredentialTypes([]));
    }, []);

    if (certificatesLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
                <p className="mt-4 text-sm text-slate-400">Loading certificates...</p>
            </div>
        );
    }

    if (!certificates?.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-1">No certificates yet</h3>
                <p className="text-sm text-slate-400 max-w-sm">
                    Your certificates will appear here once issued by your institution.
                </p>
            </div>
        );
    }

    if (selectedCertificate) {
        return (
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => setSelectedCertificate(null)}
                    className="text-indigo-400 hover:text-white text-sm font-medium flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to list
                </button>
                <CertificateDisplay
                    certificate={selectedCertificate}
                    credentialTypes={credentialTypes}
                    onVerify={onVerify}
                />
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-semibold text-white">My certificates</h2>
                <button
                    type="button"
                    onClick={onRefresh}
                    className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-200 text-sm font-medium hover:bg-slate-700"
                >
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {certificates.map((cert) => {
                    const typeConfig = matchCredentialType(cert.cert_type, credentialTypes);
                    const title =
                        typeConfig?.name ?? cert.cert_type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Certificate";
                    const institution = cert.metadata?.institution ?? "Institution";
                    const issuedAt = cert.issued_at ?? cert.issued_date;
                    const dateStr =
                        issuedAt &&
                        new Date(issuedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        });
                    const ad = cert.metadata?.additional_data as { extra?: Record<string, unknown> } | undefined;
                    const extra = (cert.metadata?.extra ?? ad?.extra) as Record<string, unknown> | undefined;
                    const fallback = buildFallbackFromMetadata(cert.metadata as Record<string, unknown> | undefined);
                    const hasDetails = (extra && Object.keys(extra).length > 0) || Object.keys(fallback).length > 0;

                    return (
                        <button
                            type="button"
                            key={cert.cert_id}
                            onClick={() => setSelectedCertificate(cert)}
                            className="text-left bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 hover:bg-slate-800/70 transition-all"
                        >
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-white truncate">{title}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{institution}</p>
                                </div>
                                {dateStr && (
                                    <span className="text-xs text-slate-500 shrink-0">{dateStr}</span>
                                )}
                            </div>
                            <div className="border-t border-slate-700/50 pt-3 min-h-[2.5rem]">
                                {hasDetails ? (
                                    <DynamicFields
                                        extra={extra}
                                        fields={typeConfig?.fields}
                                        fallbackMetadata={Object.keys(fallback).length > 0 ? fallback : undefined}
                                        dark
                                    />
                                ) : (
                                    <p className="text-xs text-slate-500 pt-1">Click to view details</p>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
