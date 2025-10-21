'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Eye,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Shield,
    User,
    Calendar,
    Building,
    AlertTriangle,
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
    verification_result?: {
        is_valid: boolean;
        blockchain_verified: boolean;
        issuer_verified: boolean;
        tamper_detected: boolean;
    };
}

const VerifierDashboard: React.FC = () => {
    const router = useRouter();
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [verificationResults, setVerificationResults] = useState<{ [key: number]: any }>({});

    useEffect(() => {
        fetchCredentials();
    }, []);

    const fetchCredentials = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/verifier/credentials', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const credentialsData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
                setCredentials(credentialsData);
            } else {
                console.error('Failed to fetch credentials:', response.statusText);
                setCredentials([]);
            }
        } catch (error) {
            console.error('Error fetching credentials:', error);
            setCredentials([]);
        } finally {
            setLoading(false);
        }
    };

    const verifyCredential = async (credentialId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/verifier/verify/${credentialId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                setVerificationResults(prev => ({
                    ...prev,
                    [credentialId]: result.data
                }));
            } else {
                const errorData = await response.json();
                alert(`Verification failed: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error verifying credential:', error);
            alert('Failed to verify credential');
        }
    };

    const filteredCredentials = (Array.isArray(credentials) ? credentials : []).filter(credential => {
        const matchesSearch = credential.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            credential.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            credential.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || credential.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getCredentialIcon = (type: string) => {
        switch (type) {
            case 'marksheet':
                return <FileText className="h-6 w-6 text-blue-600" />;
            case 'degree':
                return <Shield className="h-6 w-6 text-green-600" />;
            case 'noc':
                return <Shield className="h-6 w-6 text-yellow-600" />;
            case 'bonafide':
                return <FileText className="h-6 w-6 text-purple-600" />;
            case 'participation_cert':
                return <FileText className="h-6 w-6 text-pink-600" />;
            default:
                return <FileText className="h-6 w-6 text-gray-600" />;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'invalid':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-500" />;
        }
    };

    const getVerificationStatus = (credentialId: number) => {
        const result = verificationResults[credentialId];
        if (!result) return null;

        if (result.is_valid && result.blockchain_verified && result.issuer_verified && !result.tamper_detected) {
            return { status: 'verified', color: 'text-green-600', icon: CheckCircle };
        } else if (result.tamper_detected) {
            return { status: 'tampered', color: 'text-red-600', icon: AlertTriangle };
        } else {
            return { status: 'invalid', color: 'text-red-600', icon: XCircle };
        }
    };

    const renderOverview = () => {
        const totalCredentials = credentials.length;
        const verifiedCredentials = credentials.filter(c => c.status === 'verified').length;
        const pendingCredentials = credentials.filter(c => c.status === 'pending').length;
        const invalidCredentials = credentials.filter(c => c.status === 'invalid').length;

        return (
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <div className="flex items-center">
                            <FileText className="h-8 w-8 text-blue-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Credentials</p>
                                <p className="text-2xl font-bold text-gray-900">{totalCredentials}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <div className="flex items-center">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Verified</p>
                                <p className="text-2xl font-bold text-gray-900">{verifiedCredentials}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-yellow-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{pendingCredentials}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <div className="flex items-center">
                            <XCircle className="h-8 w-8 text-red-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Invalid</p>
                                <p className="text-2xl font-bold text-gray-900">{invalidCredentials}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCredentials = () => (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search credentials..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="md:w-48">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="verified">Verified</option>
                            <option value="pending">Pending</option>
                            <option value="invalid">Invalid</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Credentials Table */}
            <div className="bg-white rounded-lg shadow-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Credential
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Issued By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Verification
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCredentials.map((credential) => {
                                const verificationStatus = getVerificationStatus(credential.id);
                                return (
                                    <tr key={credential.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getCredentialIcon(credential.type)}
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">{credential.title}</div>
                                                    <div className="text-sm text-gray-500">{credential.type.replace('_', ' ').toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{credential.student_name}</div>
                                            <div className="text-sm text-gray-500">{credential.student_id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {credential.issued_by}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(credential.issued_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(credential.status)}
                                                <span className={`text-sm font-medium ${credential.status === 'verified' ? 'text-green-600' :
                                                    credential.status === 'pending' ? 'text-yellow-600' :
                                                        'text-red-600'
                                                    }`}>
                                                    {credential.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {verificationStatus ? (
                                                <div className="flex items-center space-x-2">
                                                    <verificationStatus.icon className={`h-4 w-4 ${verificationStatus.color}`} />
                                                    <span className={`text-sm font-medium ${verificationStatus.color}`}>
                                                        {verificationStatus.status}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500">Not verified</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => verifyCredential(credential.id)}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span>Verify</span>
                                                </button>
                                                <button className="text-green-600 hover:text-green-900 flex items-center space-x-1">
                                                    <FileText className="h-4 w-4" />
                                                    <span>View</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading verifier dashboard...</p>
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
                            <Eye className="h-8 w-8 text-yellow-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Verifier Dashboard</h1>
                                <p className="text-gray-600">Verify authenticity of student credentials</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                External Verifier
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        <button className="py-4 px-1 border-b-2 border-yellow-500 text-yellow-600 font-medium text-sm">
                            Overview
                        </button>
                        <button className="py-4 px-1 border-b-2 border-yellow-500 text-yellow-600 font-medium text-sm">
                            Credentials
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderOverview()}
                {renderCredentials()}
            </div>
        </div>
    );
};

export default VerifierDashboard;
