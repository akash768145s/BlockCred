'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Shield,
    FileText,
    Award,
    GraduationCap,
    Download,
    Share2,
    Eye,
    CheckCircle,
    Clock,
    User,
    Calendar,
    Building,
    QrCode,
    Copy,
    ExternalLink,
    Verified
} from 'lucide-react';

interface Credential {
    id: number;
    type: string;
    title: string;
    student_id: string;
    student_name: string;
    issued_by: string;
    issued_date: string;
    status: string;
    description: string;
    blockchain_hash?: string;
    verification_url?: string;
}

interface StudentProfile {
    id: number;
    name: string;
    student_id: string;
    email: string;
    department: string;
    semester: string;
    graduation_year: string;
    is_verified: boolean;
}

const StudentWallet: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [shareUrl, setShareUrl] = useState('');
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const studentId = searchParams.get('id') || localStorage.getItem('student_id');
        if (studentId) {
            fetchStudentData(studentId);
            generateShareUrl(studentId);
        } else {
            // If no student ID, redirect to login
            router.push('/login');
        }
    }, [searchParams, router]);

    const fetchStudentData = async (studentId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/student/${studentId}/credentials`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCredentials(data.data?.credentials || []);
                setStudentProfile(data.data?.profile || null);
            }
        } catch (error) {
            console.error('Error fetching student data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateShareUrl = (studentId: string) => {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/student-wallet?id=${studentId}`;
        setShareUrl(url);
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const getCredentialIcon = (type: string) => {
        switch (type) {
            case 'marksheet':
                return <FileText className="h-6 w-6 text-blue-600" />;
            case 'degree':
                return <GraduationCap className="h-6 w-6 text-green-600" />;
            case 'noc':
                return <Shield className="h-6 w-6 text-yellow-600" />;
            case 'bonafide':
                return <FileText className="h-6 w-6 text-purple-600" />;
            case 'participation_cert':
                return <Award className="h-6 w-6 text-pink-600" />;
            default:
                return <FileText className="h-6 w-6 text-gray-600" />;
        }
    };

    const getCredentialColor = (type: string) => {
        switch (type) {
            case 'marksheet':
                return 'bg-blue-100 text-blue-800';
            case 'degree':
                return 'bg-green-100 text-green-800';
            case 'noc':
                return 'bg-yellow-100 text-yellow-800';
            case 'bonafide':
                return 'bg-purple-100 text-purple-800';
            case 'participation_cert':
                return 'bg-pink-100 text-pink-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'issued':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-500" />;
        }
    };

    const renderProfile = () => (
        <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
            <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{studentProfile?.name}</h2>
                    <p className="text-gray-600">{studentProfile?.student_id}</p>
                    <p className="text-sm text-gray-500">{studentProfile?.email}</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                        {studentProfile?.is_verified ? (
                            <Verified className="h-5 w-5 text-green-500" />
                        ) : (
                            <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <span className={`text-sm font-medium ${studentProfile?.is_verified ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                            {studentProfile?.is_verified ? 'Verified Student' : 'Pending Verification'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">{studentProfile?.department}</p>
                    <p className="text-sm text-gray-500">Semester {studentProfile?.semester}</p>
                </div>
            </div>
        </div>
    );

    const renderShareSection = () => (
        <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Profile</h3>
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <button
                        onClick={copyToClipboard}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                        <Copy className="h-4 w-4" />
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                        onClick={() => setShowQR(!showQR)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                        <QrCode className="h-4 w-4" />
                        <span>QR</span>
                    </button>
                </div>

                {showQR && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                        <div className="inline-block p-4 bg-white rounded-lg">
                            {/* QR Code placeholder - in real implementation, use a QR code library */}
                            <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                                <QrCode className="h-16 w-16 text-gray-400" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Scan to view profile</p>
                    </div>
                )}

                <div className="text-sm text-gray-600">
                    <p>Share this link with employers, HR departments, or anyone who needs to verify your credentials.</p>
                </div>
            </div>
        </div>
    );

    const renderCredentials = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Academic Credentials</h3>
            {credentials.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md border p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Credentials Yet</h4>
                    <p className="text-gray-600">Your academic credentials will appear here once they are issued.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {credentials.map((credential) => (
                        <div key={credential.id} className="bg-white rounded-lg shadow-md border p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        {getCredentialIcon(credential.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h4 className="text-lg font-semibold text-gray-900">{credential.title}</h4>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCredentialColor(credential.type)}`}>
                                                {credential.type.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-2">{credential.description}</p>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <span>Issued by: {credential.issued_by}</span>
                                            <span>Date: {new Date(credential.issued_date).toLocaleDateString()}</span>
                                        </div>
                                        {credential.blockchain_hash && (
                                            <div className="mt-2 text-xs text-gray-500">
                                                <span className="font-medium">Blockchain Hash:</span> {credential.blockchain_hash.substring(0, 20)}...
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {getStatusIcon(credential.status)}
                                    <span className={`text-sm font-medium ${credential.status === 'verified' ? 'text-green-600' :
                                            credential.status === 'issued' ? 'text-yellow-600' :
                                                'text-gray-600'
                                        }`}>
                                        {credential.status}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <button className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                                        <Eye className="h-4 w-4" />
                                        <span>View Details</span>
                                    </button>
                                    <button className="text-green-600 hover:text-green-800 flex items-center space-x-1">
                                        <Download className="h-4 w-4" />
                                        <span>Download</span>
                                    </button>
                                </div>
                                {credential.verification_url && (
                                    <a
                                        href={credential.verification_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-600 hover:text-purple-800 flex items-center space-x-1"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        <span>Verify on Blockchain</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading student wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-4">
                            <Shield className="h-8 w-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Student Wallet</h1>
                                <p className="text-gray-600">Secure credential verification</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push('/student-dashboard')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {studentProfile && renderProfile()}
                {renderShareSection()}
                {renderCredentials()}
            </div>

            {/* Footer */}
            <div className="bg-white border-t mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <Shield className="h-6 w-6 text-blue-600" />
                            <span className="text-lg font-semibold text-gray-900">BlockCred</span>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Secure, blockchain-verified academic credentials
                        </p>
                        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                            <span>Powered by Blockchain</span>
                            <span>•</span>
                            <span>End-to-End Encryption</span>
                            <span>•</span>
                            <span>Tamper-Proof</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentWallet;
