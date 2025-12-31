"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useStudentData } from "@/hooks/useApi";
import {
    OverviewTab,
    CertificatesTab,
    VerificationModal
} from "@/components/student";

export default function StudentDashboard() {
    const router = useRouter();
    const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
    // Use the user ID directly (can be string or number)
    const userId = user?.id ? String(user.id) : null;
    const { student, loading, error, fetchStudentData } = useStudentData(userId);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [certificatesLoading, setCertificatesLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState<any | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [shareOrigin, setShareOrigin] = useState("");
    const [copiedShareLink, setCopiedShareLink] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "certificates">("overview");

    // Fetch certificates from the new API
    const fetchCertificates = async () => {
        if (!user?.student_id) {
            return;
        }

        setCertificatesLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/certificates/student/${user.student_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setCertificates(data.data);
                }
            } else {
                console.error('Failed to fetch certificates:', response.statusText);
                setCertificates([]);
            }
        } catch (error) {
            console.error('Error fetching certificates:', error);
            setCertificates([]);
        } finally {
            setCertificatesLoading(false);
        }
    };

    // Fetch certificates when component mounts or user changes
    useEffect(() => {
        if (user?.student_id) {
            fetchCertificates();
        }
    }, [user?.student_id]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setShareOrigin(window.location.origin);
        }
    }, []);

    const avatarUrl = useMemo(() => {
        if (student?.profile_image_url) {
            return student.profile_image_url;
        }

        const seed = encodeURIComponent(student?.name || "Student");
        return `https://api.dicebear.com/7.x/initials/svg?fontSize=48&radius=50&seed=${seed}`;
    }, [student?.profile_image_url, student?.name]);

    const publicProfileUrl = useMemo(() => {
        if (!shareOrigin || !student?.student_id) return "";
        return `${shareOrigin}/share/${student.student_id}`;
    }, [shareOrigin, student?.student_id]);

    const handleCopyShareLink = async () => {
        if (!publicProfileUrl) {
            return;
        }
        try {
            await navigator.clipboard.writeText(publicProfileUrl);
            setCopiedShareLink(true);
            setTimeout(() => setCopiedShareLink(false), 2000);
        } catch (error) {
            console.error("Unable to copy share link", error);
        }
    };

    const verifyCertificate = async (certId: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation(); // Prevent card click
        }

        setVerifying(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/certificates/verify/${certId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const result = await response.json();

            if (result.success) {
                // Find the certificate from local state to include all blockchain info
                const localCert = certificates.find(c => c.cert_id === certId);
                setVerificationResult({
                    ...result.data,
                    cert_id: localCert?.cert_id || result.data.cert_id,
                    ipfs_url: localCert?.ipfs_url || result.data.ipfs_url,
                    tx_hash: localCert?.tx_hash || result.data.tx_hash,
                });
            } else {
                setVerificationResult({
                    is_valid: false,
                    error_message: result.message || 'Verification failed'
                });
            }
        } catch (error) {
            console.error('Error verifying certificate:', error);
            setVerificationResult({
                is_valid: false,
                error_message: 'Failed to verify certificate. Please try again.'
            });
        } finally {
            setVerifying(false);
        }
    };

    // Handle redirects in useEffect to avoid setState during render
    useEffect(() => {
        console.log('useEffect running:', {
            authLoading,
            isAuthenticated: isAuthenticated(),
            userRole: user?.role,
            userId: user?.id
        });

        // Wait for auth to finish loading
        if (authLoading) {
            console.log('Auth still loading, waiting...');
            return;
        }

        if (!isAuthenticated()) {
            console.log('Not authenticated, redirecting to login');
            router.push('/login');
            return;
        }

        if (user && user.role !== 'student') {
            console.log('User is not a student, redirecting to login');
            router.push('/login');
            return;
        }

        console.log('All checks passed, staying on dashboard');
    }, [authLoading, isAuthenticated, user, router]);

    // Show loading while checking authentication
    if (authLoading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4"></div>
                    <p className="text-sm text-slate-300">Loading authentication...</p>
                </div>
            </main>
        );
    }

    // Show loading while checking authentication
    if (!user || !isAuthenticated()) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4"></div>
                    <p className="text-sm text-slate-300">Checking authentication...</p>
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">BlockCred</p>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mt-4 mb-4"></div>
                    <p className="text-sm text-slate-300">Loading dashboard...</p>
                </div>
            </main>
        );
    }

    if (error || !student) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center text-white">
                <div className="text-center max-w-md">
                    <p className="text-xs uppercase tracking-[0.3em] text-red-300">Error</p>
                    <h1 className="text-2xl font-semibold mt-3 mb-4">{error || "Student not found"}</h1>
                    <button
                        onClick={() => router.push("/login")}
                        className="px-6 py-3 bg-white text-slate-900 rounded-2xl hover:bg-indigo-50 transition-all font-semibold shadow-lg"
                    >
                        Back to Login
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 shadow-lg bg-white/10">
                                <img
                                    src={avatarUrl}
                                    alt={`${student.name} avatar`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-300 font-semibold">BlockCred</p>
                                <h1 className="text-lg font-semibold text-white mt-0.5">{student.name}</h1>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="text-xs font-semibold text-white border border-white/20 rounded-lg px-4 py-2 hover:bg-white/10 transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-1">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === "overview"
                                ? "bg-white/10 text-white border-t border-x border-white/20"
                                : "text-indigo-200 hover:text-white"
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab("certificates")}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-lg ${activeTab === "certificates"
                                ? "bg-white/10 text-white border-t border-x border-white/20"
                                : "text-indigo-200 hover:text-white"
                                }`}
                        >
                            Certificates
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

            {/* Verification Result Modal */}
            <VerificationModal
                verificationResult={verificationResult}
                onClose={() => setVerificationResult(null)}
            />
        </main>
    );
}
