"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useStudentData } from "@/hooks/useApi";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
    OverviewTab,
    CertificatesTab,
    VerificationModal,
} from "@/components/student";

export default function StudentDashboard() {
    const router = useRouter();
    const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
    const userId = user?.id ? String(user.id) : null;
    const { student, loading, error, fetchStudentData } = useStudentData(userId);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [certificatesLoading, setCertificatesLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState<any | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [shareOrigin, setShareOrigin] = useState("");
    const [copiedShareLink, setCopiedShareLink] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "certificates">("overview");

    const fetchCertificates = async () => {
        if (!user?.student_id) return;
        setCertificatesLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:8080/api/certificates/student/${user.student_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    const all = Array.isArray(data.data) ? data.data : [];
                    const own = all.filter((c: any) => c.student_id === user.student_id);
                    setCertificates(own);
                } else {
                    setCertificates([]);
                }
            } else {
                setCertificates([]);
            }
        } catch {
            setCertificates([]);
        } finally {
            setCertificatesLoading(false);
        }
    };

    useEffect(() => {
        if (user?.student_id) fetchCertificates();
    }, [user?.student_id]);

    useEffect(() => {
        if (typeof window !== "undefined") setShareOrigin(window.location.origin);
    }, []);

    const avatarUrl = useMemo(() => {
        if (student?.profile_image_url) return student.profile_image_url;
        const seed = encodeURIComponent(student?.name || "Student");
        return `https://api.dicebear.com/7.x/initials/svg?fontSize=48&radius=50&seed=${seed}`;
    }, [student?.profile_image_url, student?.name]);

    const publicProfileUrl = useMemo(() => {
        if (!shareOrigin || !student?.student_id) return "";
        return `${shareOrigin}/share/${student.student_id}`;
    }, [shareOrigin, student?.student_id]);

    const handleCopyShareLink = async () => {
        if (!publicProfileUrl) return;
        try {
            await navigator.clipboard.writeText(publicProfileUrl);
            setCopiedShareLink(true);
            setTimeout(() => setCopiedShareLink(false), 2000);
        } catch {}
    };

    const verifyCertificate = async (certId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setVerifying(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:8080/api/certificates/verify/${certId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            const result = await response.json();
            if (result.success) {
                const localCert = certificates.find((c) => c.cert_id === certId);
                const ad = localCert?.metadata?.additional_data as Record<string, unknown> | undefined;
                setVerificationResult({
                    ...result.data,
                    cert_id: localCert?.cert_id ?? result.data.cert_id,
                    ipfs_url: localCert?.ipfs_url ?? result.data.ipfs_url,
                    ipfs_cid: localCert?.ipfs_cid ?? result.data.ipfs_cid,
                    tx_hash: localCert?.tx_hash ?? result.data.tx_hash,
                    block_number: localCert?.block_number ?? result.data.block_number,
                    file_hash: localCert?.file_hash ?? result.data.file_hash,
                    metadata_hash: ad?.metadata_hash ?? result.data.metadata_hash,
                    student_wallet: ad?.student_wallet ?? result.data.student_wallet,
                    issuer_wallet: ad?.issuer_wallet ?? result.data.issuer_wallet,
                });
            } else {
                setVerificationResult({
                    is_valid: false,
                    error_message: result.message || "Verification failed",
                });
            }
        } catch {
            setVerificationResult({
                is_valid: false,
                error_message: "Failed to verify certificate. Please try again.",
            });
        } finally {
            setVerifying(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated()) {
            router.push("/login");
            return;
        }
        if (user && user.role !== "student") {
            router.push("/login");
            return;
        }
    }, [authLoading, isAuthenticated, user, router]);

    if (authLoading || !user || !isAuthenticated()) {
        return (
            <main className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent mx-auto" />
                    <p className="mt-4 text-sm text-slate-400">Loading...</p>
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent mx-auto" />
                    <p className="mt-4 text-sm text-slate-400">Loading dashboard...</p>
                </div>
            </main>
        );
    }

    if (error || !student) {
        return (
            <main className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center max-w-sm">
                    <h1 className="text-xl font-semibold text-white mb-4">
                        {error || "Student not found"}
                    </h1>
                    <button
                        onClick={() => router.push("/login")}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                    >
                        Back to Login
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 text-white">
            <DashboardHeader user={user} onLogout={logout} maxWidth="max-w-5xl" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex gap-1 border-b border-slate-700/80">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-5 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                            activeTab === "overview"
                                ? "bg-slate-800/80 text-white border border-b-0 border-slate-600"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("certificates")}
                        className={`px-5 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                            activeTab === "certificates"
                                ? "bg-slate-800/80 text-white border border-b-0 border-slate-600"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Certificates
                    </button>
                </nav>

                <div className="py-8">
                    {activeTab === "overview" && (
                        <OverviewTab
                            student={student}
                            avatarUrl={avatarUrl}
                            publicProfileUrl={publicProfileUrl}
                            copiedShareLink={copiedShareLink}
                            onCopyShareLink={handleCopyShareLink}
                        />
                    )}
                    {activeTab === "certificates" && (
                        <CertificatesTab
                            certificates={certificates}
                            certificatesLoading={certificatesLoading}
                            verifying={verifying}
                            onRefresh={() => {
                                fetchStudentData(student.id);
                                fetchCertificates();
                            }}
                            onVerify={verifyCertificate}
                        />
                    )}
                </div>
            </div>

            <VerificationModal
                verificationResult={verificationResult}
                onClose={() => setVerificationResult(null)}
            />
        </main>
    );
}
