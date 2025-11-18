"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useStudentData } from "@/hooks/useApi";
import CertificateDisplay from "@/components/CertificateDisplay";

export default function StudentDashboard() {
    const router = useRouter();
    const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
    const { student, loading, error, fetchStudentData } = useStudentData(user?.id || null);
    const [certificates, setCertificates] = useState([]);
    const [certificatesLoading, setCertificatesLoading] = useState(false);

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

    const verifyCertificate = async (certId: string) => {
        try {
            const response = await fetch(`http://localhost:8080/api/certificates/verify/${certId}`);
            const result = await response.json();

            if (result.success && result.data.is_valid) {
                const studentName = result.data.metadata?.student_name || 'Unknown Student';
                const issuerName = result.data.metadata?.issuer_name || 'Unknown Issuer';
                alert(`✅ Certificate is valid!\n\nStudent: ${studentName}\nIssuer: ${issuerName}\nType: ${result.data.cert_type}\nStatus: ${result.data.status}`);
            } else {
                alert(`❌ Certificate verification failed: ${result.message}`);
            }
        } catch (error) {
            console.error('Error verifying certificate:', error);
            alert('Failed to verify certificate');
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                            <p className="text-sm text-gray-600">Welcome, {student.name}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Student ID Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl shadow-lg p-8 text-white">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Student ID Card</h2>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-blue-600">
                                    {student.name.charAt(0)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-blue-100 text-sm">Student ID</p>
                                <p className="text-xl font-mono font-bold">{student.student_id}</p>
                            </div>

                            <div>
                                <p className="text-blue-100 text-sm">Full Name</p>
                                <p className="text-lg font-semibold">{student.name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-blue-100 text-sm">Email</p>
                                    <p className="text-sm">{student.email}</p>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-sm">Phone</p>
                                    <p className="text-sm">{student.phone}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-blue-100 text-sm">Date of Birth</p>
                                    <p className="text-sm">{student.dob || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-sm">Father Name</p>
                                    <p className="text-sm">{student.father_name || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-blue-100 text-sm">Aadhar Number</p>
                                    <p className="text-sm">{student.aadhar_number || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-sm">Department</p>
                                    <p className="text-sm">{student.department || 'Not assigned'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-blue-100 text-sm">10th School</p>
                                    <p className="text-sm">{student.tenth_school || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-sm">10th Marks</p>
                                    <p className="text-sm">{student.tenth_marks ? `${student.tenth_marks}%` : 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-blue-100 text-sm">12th School</p>
                                    <p className="text-sm">{student.twelfth_school || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-sm">12th Marks</p>
                                    <p className="text-sm">{student.twelfth_marks ? `${student.twelfth_marks}%` : 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-blue-100 text-sm">Cut-off Marks</p>
                                    <p className="text-sm">{student.cutoff ? `${student.cutoff}%` : 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-sm">Current School</p>
                                    <p className="text-sm">{student.school_name || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 pt-4 border-t border-blue-400">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                                    <span className="text-sm">Approved</span>
                                </div>
                                {student.node_assigned && (
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                                        <span className="text-sm">Blockchain Node Assigned</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Registration Status</span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${student.is_approved
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {student.is_approved ? 'Approved' : 'Pending Approval'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Blockchain Node</span>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                        {student.node_assigned ? 'Assigned' : 'Pending'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Certificates</span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                                        {certificates.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Information Card */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Information</h3>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <p className="text-sm text-gray-600">
                                        You can view all your personal and academic details above.
                                    </p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                                    <p className="text-sm text-gray-600">
                                        Certificate access requires admin approval. Once approved, you'll be able to request and view certificates.
                                    </p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                    <p className="text-sm text-gray-600">
                                        Your blockchain node will be assigned after approval for secure credential storage.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Info</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>• Your credentials are stored on a private GoEth blockchain</p>
                                <p>• Each certificate is cryptographically secured</p>
                                <p>• Certificates can be verified by institutions</p>
                                <p>• Your data is decentralized and tamper-proof</p>
                            </div>
                        </div>
                    </div>
                </div>

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
                            {certificates.map((certificate) => (
                                <div 
                                    key={certificate.id} 
                                    className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border-2 border-blue-200 cursor-pointer"
                                    onClick={() => setSelectedCertificate(certificate)}
                                >
                                    {/* Verified Stamp */}
                                    <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-2 shadow-lg">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>

                                    {/* Certificate Header */}
                                    <div className="mb-4">
                                        <div className="flex items-center mb-2">
                                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{certificate.title || certificate.cert_type?.replace('_', ' ').toUpperCase()}</h3>
                                                <p className="text-sm text-gray-600">{certificate.institution || 'SSN College of Engineering'}</p>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex items-center justify-between">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${certificate.status === 'issued'
                                                ? 'bg-green-100 text-green-800 border border-green-200'
                                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                }`}>
                                                ✓ {certificate.status?.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(certificate.issued_date || certificate.issued_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Certificate Details */}
                                    <div className="space-y-3 text-sm">
                                        {certificate.cert_id && (
                                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600 font-medium">Certificate ID:</span>
                                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {certificate.cert_id.substring(0, 12)}...
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {certificate.ipfs_url && (
                                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600 font-medium">IPFS Storage:</span>
                                                    <a
                                                        href={certificate.ipfs_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline flex items-center"
                                                    >
                                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                        View Certificate
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {certificate.tx_hash && (
                                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600 font-medium">Blockchain Tx:</span>
                                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {certificate.tx_hash.substring(0, 12)}...
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Verification Button */}
                                        {certificate.cert_id && (
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                                                <button
                                                    onClick={() => verifyCertificate(certificate.cert_id)}
                                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold text-sm flex items-center justify-center"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Verify Certificate
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
