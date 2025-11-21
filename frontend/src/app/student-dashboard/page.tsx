"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useStudentData } from "@/hooks/useApi";
import CertificateDisplay from "@/components/CertificateDisplay";

export default function StudentDashboard() {
    const router = useRouter();
    const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
    const { student, loading, error, fetchStudentData } = useStudentData(user?.id || null);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);
    const [certificatesLoading, setCertificatesLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState<any | null>(null);
    const [verifying, setVerifying] = useState(false);

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

    const avatarUrl = useMemo(() => {
        if (student?.profile_image_url) {
            return student.profile_image_url;
        }

        const seed = encodeURIComponent(student?.name || "Student");
        return `https://api.dicebear.com/7.x/initials/svg?fontSize=48&radius=50&seed=${seed}`;
    }, [student?.profile_image_url, student?.name]);

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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading authentication...</p>
                </div>
            </div>
        );
    }

    // Show loading while checking authentication
    if (!user || !isAuthenticated()) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || "Student not found"}</p>
                    <div className="text-sm text-gray-500 mb-4">
                        <p>Debug Info:</p>
                        <p>User ID: {user?.id}</p>
                        <p>User Role: {user?.role}</p>
                        <p>Loading: {loading.toString()}</p>
                    </div>
                    <button
                        onClick={() => router.push("/login")}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f6fb]">
            {/* Compact Header */}
            <header className="bg-white border-b">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                                <img
                                    src={avatarUrl}
                                    alt={`${student.name} avatar`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                Student
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Student Dashboard</p>
                            <h1 className="text-xl font-semibold text-slate-900">{student.name}</h1>
                            <p className="text-xs text-slate-500">{student.department || "Department pending"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-full">ID: {student.student_id}</span>
                        <span className={`px-2.5 py-1 rounded-full ${student.is_approved ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                            {student.is_approved ? "Approved" : "Pending"}
                        </span>
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">{student.email}</span>
                        <button
                            onClick={logout}
                            className="ml-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-full px-3 py-1 hover:bg-slate-50"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
                {/* Student Overview */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl shadow p-3 border border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Student Identity</p>
                                <h2 className="text-base font-semibold text-slate-900">{student.name}</h2>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                                {student.name.charAt(0)}
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-x-3 gap-y-1.5 text-[13px] leading-5">
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Email</p>
                                <p className="font-medium text-slate-900 break-all">{student.email}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Phone</p>
                                <p className="font-medium text-slate-900">{student.phone || "Not provided"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Date of Birth</p>
                                <p className="font-medium text-slate-900">{student.dob || "Not provided"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Father's Name</p>
                                <p className="font-medium text-slate-900">{student.father_name || "Not provided"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Aadhar Number</p>
                                <p className="font-medium text-slate-900">{student.aadhar_number || "Not provided"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-slate-400">Department</p>
                                <p className="font-medium text-slate-900">{student.department || "Not assigned"}</p>
                            </div>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1 text-[11px] font-medium text-slate-500">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                Verified Identity
                            </span>
                            {student.node_assigned && (
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    Blockchain Node Linked
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-white rounded-2xl shadow-lg p-5 border border-slate-100">
                            <h3 className="text-base font-semibold text-slate-900 mb-3">Academic Snapshot</h3>
                            <div className="space-y-3 text-sm text-slate-600">
                                <div className="flex justify-between">
                                    <span>10th School</span>
                                    <span className="font-medium">{student.tenth_school || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>12th School</span>
                                    <span className="font-medium">{student.twelfth_school || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Cut-off</span>
                                    <span className="font-medium">{student.cutoff ? `${student.cutoff}%` : "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Current School</span>
                                    <span className="font-medium">{student.school_name || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Removed duplicate large cards */}

                {/* Certificates Section */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">My Certificates</h2>
                        <button
                            onClick={() => {
                                fetchStudentData(student.id);
                                fetchCertificates();
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Refresh
                        </button>
                    </div>

                    {certificatesLoading ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading certificates...</p>
                        </div>
                    ) : (!certificates || certificates.length === 0) ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Yet</h3>
                            <p className="text-gray-600">
                                Your certificates will appear here once they are issued by institutions.
                            </p>
                        </div>
                    ) : selectedCertificate ? (
                        <div className="space-y-4">
                            <button
                                onClick={() => setSelectedCertificate(null)}
                                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                Back to Certificates
                            </button>
                            <CertificateDisplay
                                certificate={selectedCertificate}
                                onVerify={verifyCertificate}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {certificates.map((certificate) => {
                                const nftData = certificate?.metadata?.additional_data?.nft;
                                const isNFT = certificate?.cert_type === 'nft_certificate' || !!nftData;

                                return (
                                    <div
                                        key={certificate.id}
                                        className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-blue-200 cursor-pointer overflow-hidden"
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
                                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-900">{certificate.title || certificate.cert_type?.replace('_', ' ').toUpperCase()}</h3>
                                                        <p className="text-sm text-gray-600">{certificate.institution || certificate.metadata?.institution || 'SSN College of Engineering'}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${certificate.status === 'issued'
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                    }`}>
                                                    ✓ {certificate.status?.toUpperCase() || 'ISSUED'}
                                                </span>
                                            </div>
                                            
                                            {/* Issued Date */}
                                            <div className="text-xs text-gray-500 font-medium">
                                                Issued: {new Date(certificate.issued_date || certificate.issued_at).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </div>
                                        </div>

                                        {/* Certificate Details */}
                                        <div className="space-y-3 text-sm">
                                            {/* Academic Information */}
                                            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                                                <div className="text-xs uppercase tracking-wide text-blue-600 font-bold mb-3">Academic Information</div>
                                                
                                                {/* Certificate Type */}
                                                <div className="mb-3 pb-3 border-b border-gray-200">
                                                    <div className="text-xs text-gray-500 mb-1">Certificate Type</div>
                                                    <div className="text-base font-bold text-gray-900">
                                                        {certificate.cert_type?.replace(/_/g, ' ').toUpperCase() || 'CERTIFICATE'}
                                                    </div>
                                                </div>

                                                {/* Semester & Academic Year */}
                                                {(certificate.metadata?.semester || certificate.metadata?.academic_year) && (
                                                    <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-200">
                                                        {certificate.metadata.semester && (
                                                            <div>
                                                                <div className="text-xs text-gray-500 mb-1">Semester</div>
                                                                <div className="text-sm font-semibold text-gray-900">Semester {certificate.metadata.semester}</div>
                                                            </div>
                                                        )}
                                                        {certificate.metadata.academic_year && (
                                                            <div>
                                                                <div className="text-xs text-gray-500 mb-1">Academic Year</div>
                                                                <div className="text-sm font-semibold text-gray-900">{certificate.metadata.academic_year}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* CGPA */}
                                                {certificate.metadata?.cgpa && (
                                                    <div className="mb-3 pb-3 border-b border-gray-200">
                                                        <div className="text-xs text-gray-500 mb-1">CGPA</div>
                                                        <div className="text-2xl font-bold text-emerald-600">{certificate.metadata.cgpa}</div>
                                                    </div>
                                                )}

                                                {/* Grade & Marks (if no subjects) */}
                                                {(!certificate.metadata?.subjects || certificate.metadata.subjects.length === 0) && (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {certificate.metadata?.grade && (
                                                            <div>
                                                                <div className="text-xs text-gray-500 mb-1">Grade</div>
                                                                <div className="text-lg font-bold text-emerald-700">{certificate.metadata.grade}</div>
                                                            </div>
                                                        )}
                                                        {certificate.metadata?.marks && (
                                                            <div>
                                                                <div className="text-xs text-gray-500 mb-1">Marks</div>
                                                                <div className="text-lg font-bold text-emerald-700">{certificate.metadata.marks}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Subjects List */}
                                            {certificate.metadata?.subjects && Array.isArray(certificate.metadata.subjects) && certificate.metadata.subjects.length > 0 && (
                                                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border-2 border-emerald-200">
                                                    <div className="text-xs uppercase tracking-wide text-emerald-700 font-bold mb-3">Subjects</div>
                                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                                        {certificate.metadata.subjects.map((subject: any, idx: number) => (
                                                            <div key={idx} className="bg-white rounded-lg p-2.5 border border-emerald-200">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="font-semibold text-sm text-gray-900">{subject.subject_code || subject.code}</div>
                                                                        <div className="text-xs text-gray-600 mt-0.5">{subject.subject_name || subject.name}</div>
                                                                    </div>
                                                                    <div className="text-right ml-3">
                                                                        {subject.marks && (
                                                                            <div className="text-xs font-semibold text-emerald-700">{subject.marks}%</div>
                                                                        )}
                                                                        {subject.grade && (
                                                                            <div className="text-xs text-gray-600">{subject.grade}</div>
                                                                        )}
                                                                        {subject.credits && (
                                                                            <div className="text-[10px] text-gray-500 mt-0.5">{subject.credits} Cr</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {isNFT && nftData && (
                                                <div className="bg-white rounded-lg p-3 border border-purple-200 space-y-1">
                                                    <div className="text-xs uppercase tracking-wide text-purple-500 font-semibold">
                                                        NFT Metadata
                                                    </div>
                                                    <div className="text-sm text-gray-700 flex justify-between">
                                                        <span>Collection</span>
                                                        <span className="font-medium">{nftData.collection || "BlockCred"}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-700 flex justify-between">
                                                        <span>Standard</span>
                                                        <span className="font-medium">{nftData.token_standard || "ERC-721"}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-700 flex justify-between">
                                                        <span>Chain</span>
                                                        <span className="font-medium">{nftData.chain || "Hyperledger Besu"}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Verification Button */}
                                            {certificate.cert_id && (
                                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                                                    <button
                                                        onClick={(e) => verifyCertificate(certificate.cert_id, e)}
                                                        disabled={verifying}
                                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {verifying ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                                                Verifying...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                                Verify Certificate
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Verification Result Modal */}
            {verificationResult && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setVerificationResult(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                                            {verificationResult.is_valid ? 'This certificate is valid and verified on the blockchain' : verificationResult.error_message || 'Certificate verification failed'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setVerificationResult(null)}
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
                                        onClick={() => setVerificationResult(null)}
                                        className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
